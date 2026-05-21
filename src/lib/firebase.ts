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
export async function getPublishedNews(limitCount = 10) {
  const q = query(
    collection(db, 'news'),
    where('published', '==', true),
    orderBy('publishedAt', 'desc'),
    limit(limitCount)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function createNews(data: Record<string, unknown>) {
  return addDoc(collection(db, 'news'), {
    ...data,
    published:   false,
    publishedAt: serverTimestamp(),
    updatedAt:   serverTimestamp(),
  })
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
 * Filtra los que tienen isPublic === true y fecha >= hoy.
 */
export async function getPublicUpcomingEvents(limitCount = 12) {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const q = query(
    collection(db, 'events'),
    where('isPublic', '==', true),
    where('date', '>=', today),
    orderBy('date', 'asc'),
    limit(limitCount),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => {
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
    }
  })
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

// ── Firestore: Gallery ────────────────────────────────────────────
export async function getGalleryItems(limitCount = 20) {
  const snap = await getDocs(
    query(collection(db, 'gallery'), orderBy('date', 'desc'), limit(limitCount))
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export {
  app, auth, db, storage,
  onAuthStateChanged,
  serverTimestamp,
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, getDocs, addDoc, query, where, orderBy, limit,
}
