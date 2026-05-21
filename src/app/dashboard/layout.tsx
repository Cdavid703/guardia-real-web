'use client'

import { useAuth } from '@/contexts/AuthContext'
import DashboardSidebar from '@/components/dashboard/Sidebar'
import DashboardTopbar  from '@/components/dashboard/Topbar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
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
        <p className="text-xs opacity-60">user=null, profile={profile ? profile.role : 'null'}</p>
        <a href="/login" className="underline">Ir a login</a>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-hero flex flex-col items-center justify-center gap-4 text-white p-6">
        <p>Perfil no se pudo cargar.</p>
        <p className="text-xs opacity-60">UID: {user.uid}</p>
        <p className="text-xs opacity-60">Email: {user.email}</p>
        <p className="text-xs opacity-80 max-w-md text-center">
          Esto probablemente indica que las reglas de Firestore están bloqueando la lectura, o tu documento no existe en la colección <code>users</code>.
        </p>
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
