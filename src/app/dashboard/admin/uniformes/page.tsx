'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Shirt } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Tabs from '@/components/ui/Tabs'
import PrendaPanel, { type PrendaConfig } from '@/components/dashboard/uniformes/PrendaPanel'

const CONFIGS: Record<'chaquetas' | 'kepis', PrendaConfig> = {
  chaquetas: {
    prenda: 'chaqueta',
    titulo: 'Chaquetas',
    singular: 'chaqueta',
    descripcion:
      'Censo de quién tiene la chaqueta. Marca en persona, y cuando no puedas, solicita al ' +
      'integrante que confirme y firme desde su portal. El Color Guard no usa esta chaqueta, ' +
      'por eso no aparece en la lista.',
    mensajeItem: 'la chaqueta azul con blanco de la banda',
  },
  kepis: {
    prenda: 'kepis',
    titulo: 'Kepis',
    singular: 'kepis',
    descripcion:
      'Censo de quién tiene el kepis. Marca en persona, y cuando no puedas, solicita al integrante ' +
      'que confirme y firme desde su portal. Si responde que no lo tiene, queda registrado y podrás ' +
      'volver a preguntarle más adelante. El Color Guard no usa esta prenda.',
    mensajeItem: 'el kepis de la banda',
  },
}

const TABS = [
  { id: 'chaquetas', label: 'Chaquetas', icon: Shirt },
  { id: 'kepis',     label: 'Kepis',     icon: Shirt },
]

function UniformesHub() {
  const { profile } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const [tab, setTab] = useState<'chaquetas' | 'kepis'>('chaquetas')

  useEffect(() => {
    if (profile && profile.role !== 'admin') router.replace('/dashboard')
  }, [profile, router])

  useEffect(() => {
    const t = params.get('tab')
    if (t === 'chaquetas' || t === 'kepis') setTab(t)
  }, [params])

  const changeTab = (id: string) => {
    setTab(id as 'chaquetas' | 'kepis')
    router.replace(`/dashboard/admin/uniformes?tab=${id}`, { scroll: false })
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-navy text-2xl font-bold uppercase tracking-wider">Uniformes</h1>
        <p className="text-gray-400 text-sm mt-1">Control de prendas de la banda: quién las tiene y su confirmación firmada</p>
      </div>

      <Tabs tabs={TABS} activeTab={tab} onChange={changeTab} className="justify-start mb-6" />

      <PrendaPanel config={CONFIGS[tab]} />
    </div>
  )
}

export default function UniformesAdminPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-royal/30 border-t-royal rounded-full animate-spin" /></div>}>
      <UniformesHub />
    </Suspense>
  )
}
