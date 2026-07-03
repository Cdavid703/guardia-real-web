// ──────────────────────────────────────────────────────────────────
// Firebase — Client-side SDK
// ──────────────────────────────────────────────────────────────────
import { initializeApp, getApps, getApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp,
  deleteField,
  writeBatch,
  arrayUnion,
  Timestamp,
} from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import type { UserProfile, UserRole, Integrante, Tema, Partitura } from '@/types'
import { camposFaltantes, diaMesCumple, esMenorDeEdad } from '@/lib/integrantes-utils'

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Evitar múltiples inicializaciones en dev (hot reload)
const app  = getApps().length ? getApp() : initializeApp(firebaseConfig)
const auth = getAuth(app)
const db   = getFirestore(app)
const storage = getStorage(app)

// ── Providers ─────────────────────────────────────────────────────
const googleProvider    = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

const microsoftProvider = new OAuthProvider('microsoft.com')
microsoftProvider.setCustomParameters({
  prompt: 'select_account',
  tenant: process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID || 'common',
})

// ── Auth helpers ──────────────────────────────────────────────────
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider)
  await ensureUserProfile(result.user)
  return result.user
}

export async function signInWithMicrosoft(): Promise<User> {
  const result = await signInWithPopup(auth, microsoftProvider)
  await ensureUserProfile(result.user)
  return result.user
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, password)
  await ensureUserProfile(result.user)
  return result.user
}

export async function signOutUser(): Promise<void> {
  await signOut(auth)
}

// ── Firestore: User profile ───────────────────────────────────────
/** Crea el perfil si no existe (primer login → role = 'pending') */
export async function ensureUserProfile(user: User): Promise<void> {
  const ref = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    const profile: Omit<UserProfile, 'createdAt' | 'updatedAt'> & {
      createdAt: ReturnType<typeof serverTimestamp>
      updatedAt: ReturnType<typeof serverTimestamp>
    } = {
      uid:         user.uid,
      email:       user.email ?? '',
      displayName: user.displayName ?? user.email?.split('@')[0] ?? 'Sin nombre',
      photoURL:    user.photoURL ?? undefined,
      role:        'pending',
      active:      true,
      createdAt:   serverTimestamp(),
      updatedAt:   serverTimestamp(),
    }
    await setDoc(ref, profile)
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    ...data,
    createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() ?? new Date(),
  } as UserProfile
}

export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    role,
    updatedAt: serverTimestamp(),
  })
}

export async function updateUserProfile(uid: string, data: {
  displayName?: string
  phone?: string
  instrument?: string
  joinedYear?: number
  bio?: string
  requestedRole?: UserRole | null
}): Promise<void> {
  const { requestedRole, ...rest } = data
  await updateDoc(doc(db, 'users', uid), {
    ...rest,
    ...(requestedRole === null ? { requestedRole: deleteField() } : requestedRole ? { requestedRole } : {}),
    updatedAt: serverTimestamp(),
  })
}

export async function getPendingUsers(): Promise<UserProfile[]> {
  const q = query(
    collection(db, 'users'),
    where('role', '==', 'pending'),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => {
    const data = d.data()
    return {
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() ?? new Date(),
    } as UserProfile
  })
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')))
  return snap.docs.map(d => {
    const data = d.data()
    return {
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() ?? new Date(),
    } as UserProfile
  })
}

// ── Firestore: Integrantes (roster oficial) ───────────────────────
// Modelo de doble colección para privacidad a nivel de campo:
//   integrantes/{id}        → datos NO sensibles (roster, visible a miembros)
//   integrantesPrivado/{id} → datos sensibles (cédula, dirección, salud)
// Ambos comparten el mismo id. linkedUid se guarda en los dos para que las
// reglas de Firestore puedan validar al dueño sin lecturas cruzadas.

/** Campos que viven en la colección sensible (integrantesPrivado). */
const CAMPOS_SENSIBLES = [
  'tipoDoc', 'numDoc', 'fechaNacimiento', 'direccion',
  'tipoSangre', 'eps', 'pasaporte', 'contactoEmergencia', 'diagnostico',
] as const

/** Roster ligero — solo datos no sensibles (colección integrantes). */
export interface IntegranteBase {
  id:        string
  nombre:    string
  apellidos: string
  seccion:   string
  familia:   string
  secciones: string[]
  whatsapp:  string
  correo:    string
  linkedUid?: string
  linkedUids: string[]          // normalizado: incluye linkedUid legacy
  correosAutorizados: string[]  // normalizado: incluye correo principal
  fotoURL?:  string
  consentimientoDatos?: boolean
  consentimientoFecha?: string
  faltan?:   string[]
  datosCompletos?: boolean
  cumpleDia?: number
  cumpleMes?: number
  esMenor?:  boolean
  tienePasaporte?: boolean
  activo:    boolean
  createdAt: Date
  updatedAt: Date
}

function mapBase(id: string, d: Record<string, unknown>): IntegranteBase {
  return {
    id,
    nombre:    (d.nombre as string) ?? '',
    apellidos: (d.apellidos as string) ?? '',
    seccion:   (d.seccion as string) ?? '',
    familia:   (d.familia as string) ?? '',
    secciones: (d.secciones as string[]) ?? [],
    whatsapp:  (d.whatsapp as string) ?? '',
    correo:    (d.correo as string) ?? '',
    linkedUid: (d.linkedUid as string) ?? undefined,
    linkedUids: (d.linkedUids as string[]) ?? (d.linkedUid ? [d.linkedUid as string] : []),
    correosAutorizados: (d.correosAutorizados as string[]) ?? ((d.correo as string) ? [(d.correo as string).toLowerCase()] : []),
    fotoURL:   (d.fotoURL as string) ?? undefined,
    consentimientoDatos: (d.consentimientoDatos as boolean) ?? false,
    consentimientoFecha: (d.consentimientoFecha as string) ?? undefined,
    faltan:    (d.faltan as string[]) ?? undefined,
    datosCompletos: (d.datosCompletos as boolean) ?? undefined,
    cumpleDia: (d.cumpleDia as number) ?? undefined,
    cumpleMes: (d.cumpleMes as number) ?? undefined,
    esMenor:   (d.esMenor as boolean) ?? undefined,
    tienePasaporte: (d.tienePasaporte as boolean) ?? undefined,
    activo:    (d.activo as boolean) ?? true,
    createdAt: (d.createdAt as Timestamp)?.toDate() ?? new Date(),
    updatedAt: (d.updatedAt as Timestamp)?.toDate() ?? new Date(),
  }
}

/** Calcula metadatos no sensibles (completitud + cumpleaños) desde un registro full. */
function completitud(data: Partial<Integrante>) {
  const faltan = camposFaltantes(data)
  const cumple = diaMesCumple(data.fechaNacimiento)
  return {
    faltan,
    datosCompletos: faltan.length === 0,
    cumpleDia: cumple?.dia ?? null,
    cumpleMes: cumple?.mes ?? null,
    esMenor: esMenorDeEdad(data.fechaNacimiento),
    tienePasaporte: data.pasaporte === true,
  }
}

/** Separa un registro plano en sus partes base y sensible. */
function splitIntegrante(r: Partial<Integrante>) {
  const base: Record<string, unknown> = {}
  const priv: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(r)) {
    if (k === 'id' || k === 'createdAt' || k === 'updatedAt' || k === 'updatedBy') continue
    if (v === undefined) continue // Firestore rechaza valores `undefined` en updateDoc/setDoc
    if ((CAMPOS_SENSIBLES as readonly string[]).includes(k)) priv[k] = v
    else base[k] = v
  }
  return { base, priv }
}

/** Roster completo (solo base) para tabla admin / listados. */
export async function getAllIntegrantes(): Promise<IntegranteBase[]> {
  const snap = await getDocs(collection(db, 'integrantes'))
  return snap.docs
    .map(d => mapBase(d.id, d.data()))
    .sort((a, b) => `${a.apellidos} ${a.nombre}`.localeCompare(`${b.apellidos} ${b.nombre}`, 'es'))
}

/** Datos sensibles de una ficha (solo admin o dueño, por reglas). */
export async function getIntegrantePrivado(id: string): Promise<Partial<Integrante> | null> {
  const s = await getDoc(doc(db, 'integrantesPrivado', id))
  return s.exists() ? (s.data() as Partial<Integrante>) : null
}

/** Ficha COMPLETA (base + sensible) enlazada a un uid de cuenta. */
export async function getMiIntegrante(uid: string): Promise<Integrante | null> {
  // Cuentas con acceso (puede haber varias por ficha)
  let snap = await getDocs(query(collection(db, 'integrantes'), where('linkedUids', 'array-contains', uid), limit(1)))
  // Compatibilidad con fichas antiguas que solo tienen linkedUid
  if (snap.empty) snap = await getDocs(query(collection(db, 'integrantes'), where('linkedUid', '==', uid), limit(1)))
  if (snap.empty) return null
  const base = mapBase(snap.docs[0].id, snap.docs[0].data())
  const priv = await getIntegrantePrivado(base.id) ?? {}
  return mergeIntegrante(base, priv)
}

/** Busca una ficha cuyo correo autorizado coincida (aún sin enlazar al uid). */
export async function getIntegranteByCorreoAutorizado(correo: string): Promise<IntegranteBase | null> {
  const c = correo.toLowerCase()
  let snap = await getDocs(query(collection(db, 'integrantes'), where('correosAutorizados', 'array-contains', c), limit(1)))
  if (snap.empty) snap = await getDocs(query(collection(db, 'integrantes'), where('correo', '==', c), limit(1)))
  return snap.empty ? null : mapBase(snap.docs[0].id, snap.docs[0].data())
}

/**
 * Self-service: el propio usuario crea su ficha cuando todavía no existe.
 * Permitido por las reglas porque su uid queda en linkedUids.
 */
export async function createMiFicha(uid: string, nombre: string, correo: string): Promise<void> {
  const partes = nombre.trim().split(/\s+/)
  const c = correo.toLowerCase()
  const ficha: Partial<Integrante> = {
    nombre: partes[0] ?? nombre, apellidos: partes.slice(1).join(' '),
    correo: c, whatsapp: '',
    seccion: '', familia: '', secciones: [],
    direccion: '', tipoDoc: '', numDoc: '', fechaNacimiento: '',
    tipoSangre: '', eps: '', pasaporte: false, contactoEmergencia: '', diagnostico: '',
    linkedUid: uid, linkedUids: [uid], correosAutorizados: [c], activo: true,
  }
  const { base, priv } = splitIntegrante(ficha)
  const comp = completitud(ficha)
  const refBase = doc(collection(db, 'integrantes'))
  await Promise.all([
    setDoc(refBase, { ...base, ...comp, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), updatedBy: uid }),
    setDoc(doc(db, 'integrantesPrivado', refBase.id), { ...priv, linkedUid: uid, linkedUids: [uid], createdAt: serverTimestamp(), updatedAt: serverTimestamp(), updatedBy: uid }),
  ])
}

function mergeIntegrante(base: IntegranteBase, priv: Partial<Integrante>): Integrante {
  return {
    ...base,
    tipoDoc:            priv.tipoDoc ?? '',
    numDoc:             priv.numDoc ?? '',
    fechaNacimiento:    priv.fechaNacimiento ?? '',
    direccion:          priv.direccion ?? '',
    tipoSangre:         priv.tipoSangre ?? '',
    eps:                priv.eps ?? '',
    pasaporte:          priv.pasaporte ?? false,
    contactoEmergencia: priv.contactoEmergencia ?? '',
    diagnostico:        priv.diagnostico ?? '',
  }
}

/** Busca una ficha base por correo (para enlazar cuenta tras registro). */
export async function getIntegranteByCorreo(correo: string): Promise<IntegranteBase | null> {
  const snap = await getDocs(query(collection(db, 'integrantes'), where('correo', '==', correo.toLowerCase()), limit(1)))
  return snap.empty ? null : mapBase(snap.docs[0].id, snap.docs[0].data())
}

/** Roster ligero de una sección (solo campos no sensibles). */
export async function getRosterSeccion(seccion: string): Promise<IntegranteBase[]> {
  const snap = await getDocs(query(collection(db, 'integrantes'), where('secciones', 'array-contains', seccion)))
  return snap.docs.map(d => mapBase(d.id, d.data()))
}

/** El integrante actualiza su propia ficha (escribe en ambas colecciones). */
export async function updateMiIntegrante(
  id: string,
  uid: string,
  data: Partial<Integrante>,
): Promise<void> {
  // El integrante NUNCA modifica los campos de vínculo (los gestiona el admin).
  // Enviarlos rompía el guardado en fichas que aún no tienen estos campos.
  const limpio: Partial<Integrante> = { ...data }
  delete limpio.id; delete limpio.linkedUid; delete limpio.linkedUids
  delete limpio.correosAutorizados; delete limpio.createdAt; delete limpio.updatedAt
  const { base, priv } = splitIntegrante(limpio)
  const comp = completitud(limpio)
  const ops: Promise<unknown>[] = [
    updateDoc(doc(db, 'integrantes', id), { ...base, ...comp, updatedAt: serverTimestamp(), updatedBy: uid }),
  ]
  if (Object.keys(priv).length)
    ops.push(setDoc(doc(db, 'integrantesPrivado', id), { ...priv, linkedUid: uid, linkedUids: arrayUnion(uid), updatedAt: serverTimestamp(), updatedBy: uid }, { merge: true }))
  await Promise.all(ops)
}

/** Admin: crea o actualiza una ficha completa. */
export async function upsertIntegrante(
  id: string | null,
  data: Partial<Integrante>,
  uid: string,
): Promise<void> {
  const { base, priv } = splitIntegrante(data)
  const comp = completitud(data)
  if (id) {
    await Promise.all([
      updateDoc(doc(db, 'integrantes', id), { ...base, ...comp, updatedAt: serverTimestamp(), updatedBy: uid }),
      setDoc(doc(db, 'integrantesPrivado', id), { ...priv, linkedUid: base.linkedUid ?? null, updatedAt: serverTimestamp(), updatedBy: uid }, { merge: true }),
    ])
  } else {
    const refBase = doc(collection(db, 'integrantes'))
    await Promise.all([
      setDoc(refBase, { ...base, ...comp, activo: data.activo ?? true, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), updatedBy: uid }),
      setDoc(doc(db, 'integrantesPrivado', refBase.id), { ...priv, linkedUid: base.linkedUid ?? null, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), updatedBy: uid }),
    ])
  }
}

/** Admin: enlaza una ficha con una cuenta (admite varias cuentas por ficha). */
export async function linkIntegranteToUser(integranteId: string, uid: string, email?: string): Promise<void> {
  const baseUpd: Record<string, unknown> = {
    linkedUid: uid,                       // legacy: una cuenta de referencia
    linkedUids: arrayUnion(uid),          // todas las cuentas con acceso
    updatedAt: serverTimestamp(),
  }
  if (email) baseUpd.correosAutorizados = arrayUnion(email.toLowerCase())
  await Promise.all([
    updateDoc(doc(db, 'integrantes', integranteId), baseUpd),
    setDoc(doc(db, 'integrantesPrivado', integranteId), { linkedUid: uid, linkedUids: arrayUnion(uid) }, { merge: true }),
  ])
}

/** Admin: define la lista de correos con acceso a una ficha. */
export async function setCorreosAutorizados(integranteId: string, correos: string[]): Promise<void> {
  const limpios = Array.from(new Set(correos.map(c => c.trim().toLowerCase()).filter(Boolean)))
  await updateDoc(doc(db, 'integrantes', integranteId), { correosAutorizados: limpios, updatedAt: serverTimestamp() })
}

export async function deleteIntegrante(id: string): Promise<void> {
  await Promise.all([
    deleteDoc(doc(db, 'integrantes', id)),
    deleteDoc(doc(db, 'integrantesPrivado', id)),
  ])
}

/**
 * Importación masiva idempotente desde el Excel limpio.
 * Match por numDoc (o correo) para no duplicar. Escribe en ambas colecciones.
 */
export async function bulkImportIntegrantes(
  registros: Partial<Integrante>[],
  uid: string,
): Promise<{ creados: number; actualizados: number }> {
  const existentesBase = await getAllIntegrantes()
  // numDoc vive en la colección sensible — lo traemos para el match
  const privados = await Promise.all(existentesBase.map(e => getIntegrantePrivado(e.id)))
  const porDoc = new Map<string, string>()   // numDoc -> id
  existentesBase.forEach((e, i) => { const nd = privados[i]?.numDoc; if (nd) porDoc.set(nd, e.id) })
  const porCorreo = new Map(existentesBase.map(e => [e.correo, e.id]))

  let creados = 0, actualizados = 0
  let batch = writeBatch(db)
  let ops = 0
  const flush = async () => { if (ops) { await batch.commit(); batch = writeBatch(db); ops = 0 } }

  for (const r of registros) {
    const { base, priv } = splitIntegrante(r)
    const comp = completitud(r)
    const matchId = (r.numDoc && porDoc.get(r.numDoc)) || (r.correo && porCorreo.get(r.correo)) || null
    if (matchId) {
      batch.update(doc(db, 'integrantes', matchId), { ...base, ...comp, updatedAt: serverTimestamp(), updatedBy: uid })
      batch.set(doc(db, 'integrantesPrivado', matchId), { ...priv, updatedAt: serverTimestamp(), updatedBy: uid }, { merge: true })
      actualizados++
    } else {
      const refBase = doc(collection(db, 'integrantes'))
      batch.set(refBase, { ...base, ...comp, activo: true, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), updatedBy: uid })
      batch.set(doc(db, 'integrantesPrivado', refBase.id), { ...priv, linkedUid: null, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), updatedBy: uid })
      creados++
    }
    ops += 2
    if (ops >= 440) await flush()
  }
  await flush()
  return { creados, actualizados }
}

/**
 * Enlaza automáticamente todas las fichas sin cuenta cuyo correo coincide con
 * una cuenta existente, y opcionalmente asciende el rol a 'integrante'.
 * Devuelve cuántas se enlazaron.
 */
export async function autoLinkIntegrantes(
  asignarRol = true,
): Promise<{ enlazados: number }> {
  const [bases, users] = await Promise.all([getAllIntegrantes(), getAllUsers()])
  const userByEmail = new Map(users.map(u => [u.email?.toLowerCase(), u]))
  let enlazados = 0
  for (const b of bases) {
    // Correos que dan acceso a esta ficha (autorizados + principal)
    const correos = new Set([b.correo, ...b.correosAutorizados].filter(Boolean))
    for (const correo of correos) {
      const u = userByEmail.get(correo)
      if (!u || b.linkedUids.includes(u.uid)) continue
      await linkIntegranteToUser(b.id, u.uid, u.email)
      if (asignarRol && (u.role === 'pending' || u.role === 'visitante')) {
        await updateUserRole(u.uid, 'integrante')
      }
      enlazados++
    }
  }
  return { enlazados }
}

// ── Firestore: News ───────────────────────────────────────────────
export interface NewsItem {
  id:          string
  title:       string
  slug:        string
  excerpt:     string
  content:     string
  tags:        string[]
  image?:      string
  published:   boolean
  visibleTo:   string[]   // ['public'] o roles específicos: ['integrante', 'director', ...]
  publishedAt: Date
  updatedAt:   Date
  author?:     string
}

function newsFromDoc(id: string, data: Record<string, unknown>): NewsItem {
  return {
    id,
    title:       (data.title       as string) ?? '',
    slug:        (data.slug        as string) ?? '',
    excerpt:     (data.excerpt     as string) ?? '',
    content:     (data.content     as string) ?? '',
    tags:        (data.tags        as string[]) ?? [],
    image:       (data.image       as string) ?? undefined,
    published:   (data.published   as boolean) ?? false,
    visibleTo:   (data.visibleTo   as string[]) ?? ['public'],  // default público para retrocompatibilidad
    publishedAt: (data.publishedAt as Timestamp)?.toDate() ?? new Date(),
    updatedAt:   (data.updatedAt   as Timestamp)?.toDate() ?? new Date(),
    author:      (data.author      as string) ?? undefined,
  }
}

/**
 * Noticias publicadas y visibles para el público general (sin login).
 * Solo retorna las que tienen 'public' en su array visibleTo.
 * Usa query simple (solo orderBy) para evitar requerir índice compuesto en Firestore.
 */
export async function getPublishedNews(limitCount = 20): Promise<NewsItem[]> {
  const q = query(
    collection(db, 'news'),
    orderBy('publishedAt', 'desc'),
    limit(limitCount * 3), // extra para compensar el filtro JS
  )
  const snap = await getDocs(q)
  return snap.docs
    .map(d => newsFromDoc(d.id, d.data()))
    .filter(n => n.published && n.visibleTo.includes('public'))
    .slice(0, limitCount)
}

/**
 * Noticias visibles para un rol específico (usuario autenticado).
 * Retorna las que tienen 'public' o el rol del usuario en visibleTo.
 */
export async function getNewsForRole(role: string, limitCount = 20): Promise<NewsItem[]> {
  const q = query(
    collection(db, 'news'),
    orderBy('publishedAt', 'desc'),
    limit(limitCount * 3),
  )
  const snap = await getDocs(q)
  return snap.docs
    .map(d => newsFromDoc(d.id, d.data()))
    .filter(n => n.published && (n.visibleTo.includes('public') || n.visibleTo.includes(role)))
    .slice(0, limitCount)
}

export async function getNewsBySlug(slug: string): Promise<NewsItem | null> {
  const q = query(
    collection(db, 'news'),
    where('slug', '==', slug),
    where('published', '==', true),
    limit(1),
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return newsFromDoc(d.id, d.data())
}

export async function getAllNews(): Promise<NewsItem[]> {
  const snap = await getDocs(query(collection(db, 'news'), orderBy('updatedAt', 'desc')))
  return snap.docs.map(d => newsFromDoc(d.id, d.data()))
}

export async function createNews(data: Record<string, unknown>) {
  return addDoc(collection(db, 'news'), {
    ...data,
    publishedAt: serverTimestamp(),
    updatedAt:   serverTimestamp(),
  })
}

export async function updateNews(id: string, data: Record<string, unknown>) {
  return updateDoc(doc(db, 'news', id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteNews(id: string) {
  return deleteDoc(doc(db, 'news', id))
}

// ── Firestore: Quote requests ─────────────────────────────────────
export async function createQuoteRequest(data: Record<string, unknown>) {
  return addDoc(collection(db, 'quotes'), {
    ...data,
    status:    'pending',
    createdAt: serverTimestamp(),
  })
}

export async function getQuoteRequests() {
  const snap = await getDocs(
    query(collection(db, 'quotes'), orderBy('createdAt', 'desc'))
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ── Firestore: Events ─────────────────────────────────────────────
export async function getUpcomingEvents(role: UserRole) {
  const q = query(
    collection(db, 'events'),
    where('visibleTo', 'array-contains', role),
    orderBy('date', 'asc'),
    limit(10)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => {
    const data = d.data()
    return {
      id: d.id,
      ...data,
      date: (data.date as Timestamp)?.toDate() ?? new Date(),
    }
  })
}

export async function createEvent(data: Record<string, unknown>) {
  return addDoc(collection(db, 'events'), {
    ...data,
    createdAt: serverTimestamp(),
  })
}

/**
 * Eventos públicos próximos (para la web pública).
 * Usa query simple para evitar requerir índice compuesto en Firestore.
 * Filtra isPublic === true y fecha >= hoy en JS.
 */
export async function getPublicUpcomingEvents(limitCount = 12) {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const q = query(
    collection(db, 'events'),
    orderBy('date', 'asc'),
    limit(limitCount * 4),
  )
  const snap = await getDocs(q)
  return snap.docs
    .map(d => {
      const data = d.data()
      return {
        id:          d.id,
        title:       (data.title       as string) ?? '',
        date:        (data.date        as string) ?? '',
        startTime:   (data.startTime   as string) ?? '',
        endTime:     (data.endTime     as string) ?? '',
        location:    (data.location    as string) ?? '',
        type:        (data.type        as string) ?? 'evento',
        description: (data.description as string) ?? '',
        isPublic:    (data.isPublic    as boolean) ?? false,
      }
    })
    .filter(ev => ev.isPublic && ev.date >= today)
    .slice(0, limitCount)
}

// ── Firestore: Ingreso requests ───────────────────────────────────
export async function createIngresoRequest(data: Record<string, unknown>) {
  return addDoc(collection(db, 'ingresos'), {
    ...data,
    status:    'nuevo',
    createdAt: serverTimestamp(),
  })
}

export async function getIngresoRequests() {
  const snap = await getDocs(
    query(collection(db, 'ingresos'), orderBy('createdAt', 'desc'))
  )
  return snap.docs.map(d => {
    const data = d.data()
    return {
      id: d.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
    }
  })
}

/**
 * Actualiza el estado y notas de una solicitud de ingreso.
 * Solo staff (admin/director/junta) puede hacerlo según las reglas de Firestore.
 */
export async function updateIngresoStatus(
  id: string,
  status: 'nuevo' | 'contactado' | 'aceptado' | 'rechazado',
  notes?: string,
  updatedBy?: string,
) {
  return updateDoc(doc(db, 'ingresos', id), {
    status,
    ...(notes !== undefined && { notes }),
    ...(updatedBy && { lastUpdatedBy: updatedBy }),
    updatedAt: serverTimestamp(),
  })
}

/** Elimina una solicitud de ingreso (solo admin por reglas). */
export async function deleteIngresoRequest(id: string) {
  return deleteDoc(doc(db, 'ingresos', id))
}

// ── Firestore: Gallery ────────────────────────────────────────────
export async function getGalleryItems(limitCount = 20) {
  const snap = await getDocs(
    query(collection(db, 'gallery'), orderBy('date', 'desc'), limit(limitCount))
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ── Firestore: Events (enhanced) ──────────────────────────────────
export async function getAllEvents() {
  const snap = await getDocs(query(collection(db, 'events'), orderBy('date', 'desc')))
  return snap.docs.map(d => {
    const data = d.data()
    return { id: d.id, ...data, createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date() }
  })
}

export async function updateEvent(id: string, data: Record<string, unknown>) {
  return updateDoc(doc(db, 'events', id), { ...data, updatedAt: serverTimestamp() })
}

export async function deleteEvent(id: string) {
  return deleteDoc(doc(db, 'events', id))
}

// ── Firestore: Ensayos ─────────────────────────────────────────────
export async function createEnsayo(data: Record<string, unknown>) {
  return addDoc(collection(db, 'ensayos'), { ...data, createdAt: serverTimestamp() })
}

export async function getAllEnsayos() {
  const snap = await getDocs(query(collection(db, 'ensayos'), orderBy('date', 'desc')))
  return snap.docs.map(d => {
    const data = d.data()
    return { id: d.id, ...data, createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date() }
  })
}

export async function getEnsayosForRole(role: string) {
  // Query simple para evitar índice compuesto; filtra por rol en JS
  const q = query(
    collection(db, 'ensayos'),
    orderBy('date', 'asc'),
    limit(100),
  )
  const snap = await getDocs(q)
  type EnsayoRaw = { id: string; visibleTo?: string[]; createdAt: Date; [k: string]: unknown }
  return snap.docs
    .map(d => {
      const data = d.data()
      return { id: d.id, ...data, createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date() } as EnsayoRaw
    })
    .filter(e => e.visibleTo ? e.visibleTo.includes(role) : false)
}

export async function updateEnsayo(id: string, data: Record<string, unknown>) {
  return updateDoc(doc(db, 'ensayos', id), data)
}

export async function deleteEnsayo(id: string) {
  return deleteDoc(doc(db, 'ensayos', id))
}

// ── Firestore + Storage: Repertorio / Partituras ──────────────────
function mapTema(id: string, d: Record<string, unknown>): Tema {
  return {
    id,
    numeroMarcacion: (d.numeroMarcacion as number) ?? undefined,
    titulo:      (d.titulo as string) ?? '',
    compositor:  (d.compositor as string) ?? '',
    arreglista:  (d.arreglista as string) ?? '',
    genero:      (d.genero as string) ?? '',
    tonalidad:   (d.tonalidad as string) ?? '',
    compas:      (d.compas as string) ?? '',
    tempo:       (d.tempo as string) ?? '',
    duracion:    (d.duracion as string) ?? '',
    ano:         (d.ano as string) ?? '',
    dificultad:  (d.dificultad as string) ?? '',
    notas:       (d.notas as string) ?? '',
    partituras:  (d.partituras as Partitura[]) ?? [],
    audioUrl:    (d.audioUrl as string) ?? undefined,
    activo:      (d.activo as boolean) ?? true,
    visibleTo:   (d.visibleTo as string[]) ?? ['integrante', 'director', 'junta', 'cm', 'admin'],
    createdAt:   (d.createdAt as Timestamp)?.toDate() ?? new Date(),
    updatedAt:   (d.updatedAt as Timestamp)?.toDate() ?? new Date(),
    uploadedBy:  (d.uploadedBy as string) ?? undefined,
  }
}

/** Temas subidos por directores (Firestore). No incluye los seed. */
export async function getRepertorio(): Promise<Tema[]> {
  const snap = await getDocs(collection(db, 'repertoire'))
  return snap.docs
    .map(d => mapTema(d.id, d.data()))
    .sort((a, b) => (a.numeroMarcacion ?? 999) - (b.numeroMarcacion ?? 999))
}

/** Director/admin: crea un tema nuevo. */
export async function createTema(data: Partial<Tema>, uid: string): Promise<string> {
  const ref = await addDoc(collection(db, 'repertoire'), {
    ...data,
    partituras: data.partituras ?? [],
    activo: data.activo ?? true,
    visibleTo: data.visibleTo ?? ['integrante', 'director', 'junta', 'cm', 'admin'],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    uploadedBy: uid,
  })
  return ref.id
}

export async function updateTema(id: string, data: Partial<Tema>, uid: string): Promise<void> {
  const clean = { ...data }
  delete (clean as Record<string, unknown>).id
  delete (clean as Record<string, unknown>).createdAt
  await updateDoc(doc(db, 'repertoire', id), { ...clean, updatedAt: serverTimestamp(), updatedBy: uid })
}

export async function deleteTema(id: string): Promise<void> {
  await deleteDoc(doc(db, 'repertoire', id))
}

/** Sube el PDF de una partitura a Storage y la agrega al tema. */
export async function subirPartitura(
  temaId: string, instrumento: string, file: File,
): Promise<Partitura> {
  const safe = file.name.replace(/\s+/g, '_')
  // Un solo nivel bajo /repertoire para coincidir con la regla de Storage existente.
  const storageRef = ref(storage, `repertoire/${temaId}_${instrumento}_${Date.now()}_${safe}`)
  await uploadBytes(storageRef, file)
  const url = await getDownloadURL(storageRef)
  const partitura: Partitura = { instrumento, url, filename: file.name }
  await updateDoc(doc(db, 'repertoire', temaId), { partituras: arrayUnion(partitura), updatedAt: serverTimestamp() })
  return partitura
}

/** Quita una partitura del tema (por url). */
export async function quitarPartitura(temaId: string, actuales: Partitura[], url: string): Promise<void> {
  await updateDoc(doc(db, 'repertoire', temaId), {
    partituras: actuales.filter(p => p.url !== url),
    updatedAt: serverTimestamp(),
  })
}

// ── Firestore: Gallery (enhanced) ─────────────────────────────────
export async function createGalleryMedia(data: Record<string, unknown>) {
  return addDoc(collection(db, 'gallery'), { ...data, createdAt: serverTimestamp() })
}

export async function getAllGalleryMedia(limitCount = 60) {
  const snap = await getDocs(
    query(collection(db, 'gallery'), orderBy('createdAt', 'desc'), limit(limitCount))
  )
  return snap.docs.map(d => {
    const data = d.data()
    return { id: d.id, ...data, createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date() }
  })
}

export async function getPublicGalleryMedia(limitCount = 40) {
  const q = query(
    collection(db, 'gallery'),
    where('visibleTo', 'array-contains', 'public'),
    limit(limitCount)
  )
  const snap = await getDocs(q)
  return snap.docs
    .map(d => {
      const data = d.data()
      return { id: d.id, ...data, createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date() }
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function deleteGalleryMedia(id: string) {
  return deleteDoc(doc(db, 'gallery', id))
}

// ── Firestore: Repertoire ──────────────────────────────────────────
export async function createRepertoireItem(data: Record<string, unknown>) {
  return addDoc(collection(db, 'repertoire'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function getAllRepertoireItems() {
  const snap = await getDocs(query(collection(db, 'repertoire'), orderBy('createdAt', 'desc')))
  return snap.docs.map(d => {
    const data = d.data()
    return { id: d.id, ...data, createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date() }
  })
}

export async function getRepertoireForRole(role: string) {
  const q = query(
    collection(db, 'repertoire'),
    where('visibleTo', 'array-contains', role),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => {
    const data = d.data()
    return { id: d.id, ...data, createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date() }
  })
}

export async function updateRepertoireItem(id: string, data: Record<string, unknown>) {
  return updateDoc(doc(db, 'repertoire', id), { ...data, updatedAt: serverTimestamp() })
}

export async function deleteRepertoireItem(id: string) {
  return deleteDoc(doc(db, 'repertoire', id))
}

// ── Firestore: Donations ──────────────────────────────────────────
export async function createDonation(data: Record<string, unknown>) {
  return addDoc(collection(db, 'donations'), {
    ...data,
    status: 'recibida',
    createdAt: serverTimestamp(),
  })
}

export async function getAllDonations() {
  const snap = await getDocs(query(collection(db, 'donations'), orderBy('createdAt', 'desc')))
  return snap.docs.map(d => {
    const data = d.data()
    return { id: d.id, ...data, createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date() }
  })
}

export async function updateDonationStatus(id: string, status: 'recibida' | 'verificada' | 'rechazada') {
  return updateDoc(doc(db, 'donations', id), { status })
}

export {
  app, auth, db, storage,
  onAuthStateChanged,
  serverTimestamp,
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, getDocs, addDoc, query, where, orderBy, limit,
}
