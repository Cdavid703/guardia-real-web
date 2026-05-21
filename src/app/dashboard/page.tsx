'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth }   from '@/contexts/AuthContext'
import { getRoleDashboard } from '@/lib/utils'

export default function DashboardRedirect() {
  const { profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && profile) {
      router.replace(getRoleDashboard(profile.role))
    }
  }, [profile, loading, router])

  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-royal/30 border-t-royal rounded-full animate-spin" />
    </div>
  )
}
