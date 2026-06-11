'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Shirt, Bell, ClipboardList, MapPin } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Tabs from '@/components/ui/Tabs'
import UniformesPanel from '@/components/dashboard/UniformesPanel'
import EquipoNoticiasPanel from '@/components/dashboard/EquipoNoticiasPanel'
import EquipoEnsayosPanel from '@/components/dashboard/EquipoEnsayosPanel'
import CalarcaPanel from '@/components/dashboard/CalarcaPanel'
import type { UserRole } from '@/types'

const ALLOWED_ROLES: UserRole[] = ['admin', 'director', 'junta', 'cm', 'integrante']

const TABS = [
  { id: 'uniformes', label: 'Uniformes',  icon: Shirt },
  { id: 'noticias',  label: 'Noticias',   icon: Bell },
  { id: 'ensayos',   label: 'Ensayos',    icon: ClipboardList },
  { id: 'calarca',   label: 'Viaje a Calarcá', icon: MapPin },
]

function EquipoContent() {
  const { profile } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const initial = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(
    TABS.some(t => t.id === initial) ? (initial as string) : 'uniformes'
  )

  useEffect(() => {
    if (profile && !ALLOWED_ROLES.includes(profile.role)) {
      router.replace('/dashboard')
    }
  }, [profile, router])

  const handleChange = (id: string) => {
    setActiveTab(id)
    router.replace(`/dashboard/equipo?tab=${id}`, { scroll: false })
  }

  if (!profile || !ALLOWED_ROLES.includes(profile.role)) return null

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-navy text-2xl font-bold uppercase tracking-wider">
          Integrantes
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Espacio compartido del personal de la banda: uniformes, noticias internas, ensayos y viajes
        </p>
      </div>

      <Tabs tabs={TABS} activeTab={activeTab} onChange={handleChange} className="mb-8 justify-start" />

      {activeTab === 'uniformes' && <UniformesPanel />}
      {activeTab === 'noticias'  && <EquipoNoticiasPanel role={profile.role} />}
      {activeTab === 'ensayos'   && <EquipoEnsayosPanel role={profile.role} />}
      {activeTab === 'calarca'   && <CalarcaPanel />}
    </div>
  )
}

export default function EquipoPage() {
  return (
    <Suspense fallback={null}>
      <EquipoContent />
    </Suspense>
  )
}
