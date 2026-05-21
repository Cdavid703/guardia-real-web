'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth }   from '@/contexts/AuthContext'
import DashboardSidebar from '@/components/dashboard/Sidebar'
import DashboardTopbar  from '@/components/dashboard/Topbar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [waitedEnough, setWaitedEnough] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setWaitedEnough(true), 3000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!loading && waitedEnough) {
      if (!user) { router.replace('/login'); return }
      if (profile?.role === 'pending') { router.replace('/pending'); return }
    }
  }, [user, profile, loading, waitedEnough, router])

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-gradient-hero flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        <div className="text-white text-xs opacity-60">
          loading: {String(loading)} · user: {user ? 'sí' : 'no'} · profile: {profile ? profile.role : 'null'}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#F5F7FA]">
      <DashboardSidebar role={profile.role} />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar profile={profile} />
        <main className="flex-1 p-6 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
