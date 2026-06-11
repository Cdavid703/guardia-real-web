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
  Timestamp,
} from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import type { UserProfile, UserRole } from '@/types'

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
