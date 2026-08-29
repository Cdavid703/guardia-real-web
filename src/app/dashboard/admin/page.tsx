'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  Users, Clock, CheckCircle, ClipboardList, Contact, Eye, TrendingUp, LayoutDashboard, IdCard,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getAllUsers, getIngresoRequests, getAllIntegrantes } from '@/lib/firebase'
import Tabs from '@/components/ui/Tabs'
import IntegrantesPanel from '@/components/dashboard/usuarios/IntegrantesPanel'
import SolicitudesPanel from '@/components/dashboard/usuarios/SolicitudesPanel'
import CuentasRolesPanel from '@/components/dashboard/usuarios/CuentasRolesPanel'
import FichasSinCuentaPanel from '@/components/dashboard/usuarios/FichasSinCuentaPanel'

const TABS = [
  { id: 'resumen',     label: 'Resumen',      icon: LayoutDashboard },
  { id: 'integrantes', label: 'Integrantes',  icon: Contact },
  { id: 'solicitudes', label: 'Solicitudes',  icon: ClipboardList },
  { id: 'cuentas',     label: 'Cuentas y roles', icon: Users },
  { id: 'sincuenta',   label: 'Fichas sin cuenta', icon: IdCard },
]

function AdminHub() {
  const { profile } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const [tab, setTab] = useState('resumen')

  useEffect(() => {
    if (profile && profile.role !== 'admin') router.replace('/dashboard')
  }, [profile, router])

  useEffect(() => {
    const t = params.get('tab')
    if (t && TABS.some(x => x.id === t)) setTab(t)
  }, [params])

  const changeTab = (id: string) => {
    setTab(id)
    router.replace(`/dashboard/admin?tab=${id}`, { scroll: false })
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-navy text-2xl font-bold uppercase tracking-wider">Gestión de usuarios</h1>
        <p className="text-gray-400 text-sm mt-1">Integrantes, solicitudes de ingreso, cuentas y roles — todo en un solo lugar</p>
      </div>

      <Tabs tabs={TABS} activeTab={tab} onChange={changeTab} className="justify-start mb-6" />

      {tab === 'resumen'     && <ResumenPanel />}
      {tab === 'integrantes' && profile && <IntegrantesPanel uid={profile.uid} />}
      {tab === 'solicitudes' && profile && <SolicitudesPanel uid={profile.uid} />}
      {tab === 'cuentas'     && profile && <CuentasRolesPanel uid={profile.uid} />}
    </div>
  )
}

function ResumenPanel() {
  const [counts, setCounts] = useState<{ users: number; pending: number; activos: number; ingresos: number; integrantes: number; incompletos: number } | null>(null)
  const [visits, setVisits] = useState<{ total: number; today: number } | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const [users, ingresos, ints] = await Promise.all([getAllUsers(), getIngresoRequests(), getAllIntegrantes()])
        setCounts({
          users: users.length,
          pending: users.filter(u => u.role === 'pending').length,
          activos: users.filter(u => u.role !== 'pending').length,
          ingresos: (ingresos as unknown as { status: string }[]).filter(i => i.status === 'nuevo').length,
          integrantes: ints.length,
          incompletos: ints.filter(i => i.datosCompletos === false).length,
        })
      } catch { toast.error('Error al cargar el resumen') }
    })()
    fetch('/api/visits').then(r => r.json()).then(d => setVisits({ total: d.total ?? 0, today: d.today ?? 0 })).catch(() => {})
  }, [])

  const cards = [
    { label: 'Total usuarios',     value: counts?.users ?? '—',       icon: Users,         color: 'text-navy' },
    { label: 'Pendientes',         value: counts?.pending ?? '—',     icon: Clock,         color: 'text-amber-600' },
    { label: 'Activos',            value: counts?.activos ?? '—',     icon: CheckCircle,   color: 'text-green-600' },
    { label: 'Solicitudes nuevas', value: counts?.ingresos ?? '—',    icon: ClipboardList, color: 'text-blue-600' },
    { label: 'Integrantes',        value: counts?.integrantes ?? '—', icon: Contact,       color: 'text-royal' },
    { label: 'Datos incompletos',  value: counts?.incompletos ?? '—', icon: Clock,         color: 'text-red-500' },
    { label: 'Visitas totales',    value: visits?.total ?? '—',       icon: Eye,           color: 'text-royal' },
    { label: 'Visitas hoy',        value: visits?.today ?? '—',       icon: TrendingUp,    color: 'text-gold' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
            <Icon size={18} className={color} />
          </div>
          <p className={`text-3xl font-bold font-display ${color}`}>{value}</p>
        </div>
      ))}
    </div>
  )
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-royal/30 border-t-royal rounded-full animate-spin" /></div>}>
      <AdminHub />
    </Suspense>
  )
}
