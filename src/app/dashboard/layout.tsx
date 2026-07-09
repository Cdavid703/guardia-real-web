'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getRoleDashboard, PANEL_ROLES } from '@/lib/utils'
import DashboardSidebar from '@/components/dashboard/Sidebar'
import DashboardTopbar  from '@/components/dashboard/Topbar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()

  // Solo admin/director/CM tienen panel. El resto gestiona todo desde /integrantes.
  const sinPanel = !!profile && !PANEL_ROLES.includes(profile.role)
  useEffect(() => {
    if (sinPanel && profile) router.replace(getRoleDashboard(profile.role))
  }, [sinPanel, profile, router])

  if (loading || sinPanel) {
    return (
      <div className="min-h-screen bg-gradient-hero flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        <div className="text-white text-xs opacity-60">Cargando sesión...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-hero flex flex-col items-center justify-center gap-4 text-white p-6">
        <p>No autenticado.</p>
        <a href="/login" className="underline">Ir a login</a>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-hero flex flex-col items-center justify-center gap-4 text-white p-6">
        <p>Perfil no se pudo cargar.</p>
        <p className="text-xs opacity-60">UID: {user.uid}</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#F5F7FA]">
      {/* Overlay móvil */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — drawer en móvil, fijo en desktop */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transition-transform duration-300 md:static md:translate-x-0 md:z-auto
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <DashboardSidebar role={profile.role} onClose={() => setMobileOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar
          profile={profile}
          onMenuOpen={() => setMobileOpen(true)}
        />
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
