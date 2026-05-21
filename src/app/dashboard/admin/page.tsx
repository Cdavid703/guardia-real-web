'use client'

import { useEffect, useState } from 'react'
import { Users, Clock, CheckCircle, ClipboardList, ChevronDown, ChevronUp, Newspaper, ArrowRight } from 'lucide-react'
import { getAllUsers, updateUserRole, getIngresoRequests, updateIngresoStatus } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { cn, getRoleLabel, getRoleBadgeColor, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import type { UserProfile, UserRole, IngresoRequest } from '@/types'
import Image from 'next/image'
import Link from 'next/link'

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'admin',      label: 'Administrador' },
  { value: 'director',   label: 'Director Musical' },
  { value: 'integrante', label: 'Integrante' },
  { value: 'junta',      label: 'Junta Directiva' },
  { value: 'visitante',  label: 'Visitante' },
  { value: 'pending',    label: 'Pendiente' },
]

const INGRESO_STATUS_COLORS: Record<string, string> = {
  nuevo:      'bg-blue-100 text-blue-700',
  contactado: 'bg-amber-100 text-amber-700',
  aceptado:   'bg-green-100 text-green-700',
  rechazado:  'bg-red-100 text-red-700',
}

const INGRESO_STATUS_LABELS: Record<string, string> = {
  nuevo:      'Nuevo',
  contactado: 'Contactado',
  aceptado:   'Aceptado',
  rechazado:  'Rechazado',
}

export default function AdminPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [users,     setUsers]     = useState<UserProfile[]>([])
  const [loading,   setLoading]   = useState(true)
  const [filter,    setFilter]    = useState<UserRole | 'all'>('all')
  const [ingresos,  setIngresos]  = useState<(IngresoRequest & { id: string })[]>([])
  const [ingLoading,setIngLoading]= useState(true)
  const [expanded,  setExpanded]  = useState<string | null>(null)

  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      router.replace('/dashboard')
    }
  }, [profile, router])

  useEffect(() => {
    fetchUsers()
    fetchIngresos()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const data = await getAllUsers()
      setUsers(data)
    } catch {
      toast.error('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  const fetchIngresos = async () => {
    setIngLoading(true)
    try {
      const data = await getIngresoRequests()
      setIngresos(data as (IngresoRequest & { id: string })[])
    } catch {
      toast.error('Error al cargar solicitudes de ingreso')
    } finally {
      setIngLoading(false)
    }
  }

  const handleIngresoStatusChange = async (id: string, newStatus: 'nuevo' | 'contactado' | 'aceptado' | 'rechazado') => {
    try {
      await updateIngresoStatus(id, newStatus, undefined, profile?.uid)
      setIngresos(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i))
      toast.success(`Estado actualizado a "${INGRESO_STATUS_LABELS[newStatus]}"`)
    } catch {
      toast.error('Error al actualizar el estado')
    }
  }

  const handleIngresoNotesChange = async (id: string, notes: string) => {
    try {
      const ing = ingresos.find(i => i.id === id)
      if (!ing) return
      await updateIngresoStatus(id, ing.status, notes, profile?.uid)
      setIngresos(prev => prev.map(i => i.id === id ? { ...i, notes } : i))
      toast.success('Nota guardada')
    } catch {
      toast.error('Error al guardar la nota')
    }
  }

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    try {
      await updateUserRole(uid, newRole)
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole } : u))
      toast.success(`Rol actualizado a "${getRoleLabel(newRole)}"`)
    } catch {
      toast.error('Error al actualizar el rol')
    }
  }

  const filtered = filter === 'all' ? users : users.filter(u => u.role === filter)

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
          Gestión de usuarios
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Asigna y gestiona los roles de todos los integrantes del portal
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/dashboard/admin/noticias"
          className="card p-4 flex items-center justify-between hover:border-royal transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-royal/10 flex items-center justify-center group-hover:bg-royal group-hover:text-white transition-colors">
              <Newspaper size={18} className="text-royal group-hover:text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm text-dark">Gestionar noticias</p>
              <p className="text-xs text-gray-400">Crear, editar y publicar</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-gray-300 group-hover:text-royal transition-colors" />
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { value: 'all',       label: 'Todos' },
          { value: 'pending',   label: 'Pendientes' },
          { value: 'admin',     label: 'Administradores' },
          { value: 'director',  label: 'Directores' },
          { value: 'integrante',label: 'Integrantes' },
          { value: 'junta',     label: 'Junta' },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value as UserRole | 'all')}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
              filter === value
                ? 'bg-navy text-white border-navy'
                : 'bg-white text-gray-600 border-gray-200 hover:border-navy hover:text-navy'
            )}
          >
            {label}
            <span className="ml-1.5 opacity-60">
              {value === 'all'
                ? users.length
                : users.filter(u => u.role === value).length}
            </span>
          </button>
        ))}
      </div>

      {/* Ingresos section */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-navy text-xl font-bold uppercase tracking-wider">
              Solicitudes de ingreso
            </h2>
            <p className="text-gray-400 text-xs mt-0.5">
              {ingresos.filter(i => i.status === 'nuevo').length} nuevas solicitudes sin revisar
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {ingLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-royal/30 border-t-royal rounded-full animate-spin" />
            </div>
          ) : ingresos.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ClipboardList size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No hay solicitudes de ingreso todavía</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {ingresos.map(ing => (
                <div key={ing.id} className="px-5 py-4">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpanded(expanded === ing.id ? null : ing.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-navy text-white text-sm font-bold flex items-center justify-center shrink-0">
                        {ing.nombreCompleto?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-dark">{ing.nombreCompleto}</p>
                        <p className="text-xs text-gray-400">{ing.instrumentoInteres} · {ing.telefono}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn('badge text-xs', INGRESO_STATUS_COLORS[ing.status] ?? 'bg-gray-100 text-gray-600')}>
                        {INGRESO_STATUS_LABELS[ing.status] ?? ing.status}
                      </span>
                      <p className="text-xs text-gray-400 hidden sm:block">
                        {formatDate(ing.createdAt as Date, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      {expanded === ing.id
                        ? <ChevronUp size={16} className="text-gray-400" />
                        : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                  </div>

                  {expanded === ing.id && (
                    <div className="mt-4 ml-12 space-y-4">
                      {/* Datos del aspirante */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                        {[
                          ['Email',              ing.email],
                          ['Teléfono',           ing.telefono],
                          ['Identificación',     ing.identificacion],
                          ['Fecha nacimiento',   ing.fechaNacimiento],
                          ['Barrio / Ciudad',    `${ing.barrio}, ${ing.ciudad}`],
                          ['Instrumento',        ing.instrumentoInteres],
                          ['Experiencia',        ing.experienciaPrevia ? `Sí — ${ing.nivelExperiencia}` : 'No'],
                          ['Disponibilidad',     ing.disponibilidad],
                          ['Cómo se enteró',     ing.comoSeEntero],
                        ].map(([label, value]) => (
                          <div key={label}>
                            <p className="font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                            <p className="text-dark break-words">{value}</p>
                          </div>
                        ))}
                        {ing.mensaje && (
                          <div className="col-span-full">
                            <p className="font-bold text-gray-400 uppercase tracking-wider mb-0.5">Mensaje</p>
                            <p className="text-dark italic">{ing.mensaje}</p>
                          </div>
                        )}
                      </div>

                      {/* Acciones rápidas de contacto */}
                      <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                        <a
                          href={`https://wa.me/57${ing.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${ing.nombreCompleto.split(' ')[0]}, te escribo de la Corporación Musical Guardia Real de Antioquia sobre tu solicitud de ingreso.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#1ebd5a] text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                          WhatsApp
                        </a>
                        <a
                          href={`tel:+57${ing.telefono.replace(/\D/g, '')}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-navy hover:bg-navy/90 text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                          Llamar
                        </a>
                        <a
                          href={`mailto:${ing.email}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors"
                        >
                          Email
                        </a>
                      </div>

                      {/* Cambio de estado */}
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px] mb-2">
                          Cambiar estado
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(['nuevo', 'contactado', 'aceptado', 'rechazado'] as const).map(s => (
                            <button
                              key={s}
                              onClick={() => handleIngresoStatusChange(ing.id, s)}
                              disabled={ing.status === s}
                              className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                                ing.status === s
                                  ? `${INGRESO_STATUS_COLORS[s]} cursor-default ring-2 ring-offset-1 ring-navy/30`
                                  : 'bg-white text-gray-600 border border-gray-200 hover:border-navy hover:text-navy'
                              )}
                            >
                              {INGRESO_STATUS_LABELS[s]}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Notas internas */}
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px] mb-2">
                          Notas internas
                        </p>
                        <textarea
                          defaultValue={ing.notes ?? ''}
                          onBlur={e => {
                            const newNotes = e.target.value.trim()
                            if (newNotes !== (ing.notes ?? '')) {
                              handleIngresoNotesChange(ing.id, newNotes)
                            }
                          }}
                          rows={2}
                          placeholder="Ej. Llamado el 5 de mayo, no contestó. Audición agendada para el 10 de mayo..."
                          className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-royal focus:ring-1 focus:ring-royal/20 resize-none"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">
                          Las notas se guardan automáticamente cuando sales del campo.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-royal/30 border-t-royal rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No hay usuarios en esta categoría</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-navy text-white text-xs font-bold uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Usuario</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Rol actual</th>
                  <th className="px-4 py-3 text-left">Registro</th>
                  <th className="px-4 py-3 text-left">Cambiar rol</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr
                    key={u.uid}
                    className={cn('border-t border-gray-100', i % 2 === 0 ? 'bg-white' : 'bg-gray-50')}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {u.photoURL ? (
                          <Image src={u.photoURL} alt={u.displayName} width={32} height={32}
                            className="rounded-full shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {u.displayName[0]?.toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm font-medium text-dark truncate max-w-[140px]">
                          {u.displayName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 truncate max-w-[180px]">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={cn('badge', getRoleBadgeColor(u.role))}>
                        {getRoleLabel(u.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {formatDate(u.createdAt, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={e => handleRoleChange(u.uid, e.target.value as UserRole)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-dark focus:outline-none focus:border-royal focus:ring-1 focus:ring-royal/20 cursor-pointer"
                      >
                        {ROLES.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
