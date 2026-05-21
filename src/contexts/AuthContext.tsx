'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { type User } from 'firebase/auth'
import {
  auth,
  onAuthStateChanged,
  getUserProfile,
  signInWithGoogle,
  signInWithMicrosoft,
  signOutUser,
} from '@/lib/firebase'
import type { UserProfile } from '@/types'

// ── Context types ─────────────────────────────────────────────────
interface AuthContextType {
  user:        User | null
  profile:     UserProfile | null
  loading:     boolean
  loginWithGoogle:    () => Promise<void>
  loginWithMicrosoft: () => Promise<void>
  logout:             () => Promise<void>
  refreshProfile:     () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

// ── Provider ──────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (u: User) => {
    try {
      const p = await getUserProfile(u.uid)
      setProfile(p)
    } catch (err) {
      console.error('Error loading profile:', err)
      setProfile(null)
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        await loadProfile(u)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [loadProfile])

  const loginWithGoogle = async () => {
    setLoading(true)
    try {
      const u = await signInWithGoogle()
      await loadProfile(u)
    } finally {
      setLoading(false)
    }
  }

  const loginWithMicrosoft = async () => {
    setLoading(true)
    try {
      const u = await signInWithMicrosoft()
      await loadProfile(u)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    await signOutUser()
    setUser(null)
    setProfile(null)
  }

  const refreshProfile = async () => {
    if (user) await loadProfile(user)
  }

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      loginWithGoogle, loginWithMicrosoft, logout, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
