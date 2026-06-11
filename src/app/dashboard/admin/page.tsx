'use client'

import { useEffect, useState } from 'react'
import { Users, Clock, CheckCircle, ClipboardList, Newspaper, Calendar, Image as ImageIcon, MessageSquare, Heart, ArrowRight } from 'lucide-react'
import { getAllUsers, getIngresoRequests } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { UserProfile, IngresoRequest } from '@/types'
import Link from 'next/link'

const QUICK_LINKS = [
  { href: '/dashboard/admin/integrantes', label: 'Integrantes',  desc: 'Solicitudes de ingreso, roles y usuarios', icon: Users },
  { href: '/dashboard/admin/noticias',    label: 'Noticias',     desc: 'Crear, editar y publicar',                 icon: Newspaper },
  { href: '/dashboard/admin/events',      label: 'Eventos',      desc: 'Agenda y presentaciones',                  icon: Calendar },
  { href: '/dashboard/admin/gallery',     label: 'Galería',      desc: 'Fotos, videos y enlaces',                  icon: ImageIcon },
  { href: '/dashboard/admin/quotes',      label: 'Cotizaciones', desc: 'Solicitudes de contratación',              icon: MessageSquare },
  { href: '/dashboard/admin/donaciones',  label: 'Donaciones',   desc: 'Aportes registrados y comprobantes',       icon: Heart },
]

export default function AdminPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [users,    setUsers]    = useState<UserProfile[]>([])
  const [ingresos, setIngresos] = useState<(IngresoRequest & { id: string })[]>([])

  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      router.replace('/dashboard')
    }
  }, [profile, router])

  useEffect(() => {
    (async () => {
      try {
        const [usersData, ingresosData] = await Promise.all([getAllUsers(), getIngresoRequests()])
        setUsers(usersData)
        setIngresos(ingresosData as (IngresoRequest & { id: string })[])
      } catch {
        toast.error('Error al cargar los datos del panel')
      }
    })()
  }, [])

  const stats = [
    { label: 'Total usuarios',       value: users.length,                                          icon: Users,          color: 'text-navy' },
    { label: 'Pendientes',           value: users.filter(u => u.role === 'pending').length,        icon: Clock,          color: 'text-amber-600' },
    { label: 'Activos',              value: users.filter(u => u.role !== 'pending').length,        icon: CheckCircle,    color: 'text-green-600' },
    { label: 'Solicitudes ingreso',  value: ingresos.filter(i => i.status === 'nuevo').length,     icon: ClipboardList,  color: 'text-blue-600' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-navy text-2xl font-bold uppercase tracking-wider">
          Panel de administración
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Resumen general y accesos rápidos a la gestión del portal
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
              <Icon size={18} className={color} />
            </div>
            <p className={`text-3xl font-bold font-display ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {QUICK_LINKS.map(({ href, label, desc, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="card p-4 flex items-center justify-between hover:border-royal transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-royal/10 flex items-center justify-center group-hover:bg-royal group-hover:text-white transition-colors">
                <Icon size={18} className="text-royal group-hover:text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm text-dark">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-gray-300 group-hover:text-royal transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  )
}
