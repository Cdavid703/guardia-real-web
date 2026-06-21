'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Shirt, Bell, ClipboardList, History, Lock, LogIn, IdCard } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import Tabs from '@/components/ui/Tabs'
import UniformesPanel from '@/components/dashboard/UniformesPanel'
import EquipoNoticiasPanel from '@/components/dashboard/EquipoNoticiasPanel'
import EquipoEnsayosPanel from '@/components/dashboard/EquipoEnsayosPanel'
import HistoriaPanel from '@/components/dashboard/HistoriaPanel'
import MiFichaIntegrante from '@/components/dashboard/MiFichaIntegrante'
import type { UserRole } from '@/types'

const ALLOWED_ROLES: UserRole[] = ['admin', 'director', 'junta', 'cm', 'integrante']

const TABS = [
  { id: 'ficha',     label: 'Mi ficha',   icon: IdCard },
  { id: 'uniformes', label: 'Uniformes',  icon: Shirt },
  { id: 'noticias',  label: 'Noticias',   icon: Bell },
  { id: 'ensayos',   label: 'Ensayos',    icon: ClipboardList },
  { id: 'historia',  label: 'Historia',   icon: History },
]

function IntegrantesContent() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const initial = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(
    TABS.some(t => t.id === initial) ? (initial as string) : 'ficha'
  )

  const handleChange = (id: string) => {
    setActiveTab(id)
    router.replace(`/integrantes?tab=${id}`, { scroll: false })
  }

  if (loading) {
    return (
      <div className="section-container py-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-royal/30 border-t-royal rounded-full animate-spin" />
      </div>
    )
  }

  if (!user || !profile || !ALLOWED_ROLES.includes(profile.role)) {
    return (
      <div className="section-container py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-navy/5 flex items-center justify-center mx-auto mb-4">
          <Lock size={28} className="text-navy" />
        </div>
        <h1 className="font-display text-navy text-2xl font-bold uppercase tracking-wider mb-2">
          Sección exclusiva para integrantes
        </h1>
        <p className="text-gray-500 max-w-md mx-auto mb-6">
          Esta sección está disponible solo para integrantes, directores, junta directiva y
          administración de la Corporación Musical Guardia Real de Antioquia.
        </p>
        <Link href="/login" className="btn btn-gold btn-lg">
          <LogIn size={18} /> Iniciar sesión
        </Link>
      </div>
    )
  }

  return (
    <div className="section-container py-12">
      <div className="mb-8">
        <h1 className="font-display text-navy text-2xl font-bold uppercase tracking-wider">
          Integrantes
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Espacio compartido del personal de la banda: uniformes, noticias internas, ensayos y viajes
        </p>
      </div>

      <Tabs tabs={TABS} activeTab={activeTab} onChange={handleChange} className="mb-8 justify-start" />

      {activeTab === 'ficha'     && <MiFichaIntegrante />}
      {activeTab === 'uniformes' && <UniformesPanel />}
      {activeTab === 'noticias'  && <EquipoNoticiasPanel role={profile.role} />}
      {activeTab === 'ensayos'   && <EquipoEnsayosPanel role={profile.role} />}
      {activeTab === 'historia'  && <HistoriaPanel />}
    </div>
  )
}

export default function IntegrantesPage() {
  return (
    <Suspense fallback={null}>
      <IntegrantesContent />
    </Suspense>
  )
}
