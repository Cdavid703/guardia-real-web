'use client'

import { useEffect, useState } from 'react'
import { Users, Clock, CheckCircle, XCircle, Shield } from 'lucide-react'
import { getAllUsers, updateUserRole } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { cn, getRoleLabel, getRoleBadgeColor, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import type { UserProfile, UserRole } from '@/types'
import Image from 'next/image'

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'admin',      label: 'Administrador' },
  { value: 'director',   label: 'Director Musical' },
  { value: 'integrante', label: 'Integrante' },
  { value: 'junta',      label: 'Junta Directiva' },
  { value: 'pending',    label: 'Pendiente' },
]

export default function AdminPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [users,   setUsers]   = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState<UserRole | 'all'>('all')

  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      router.replace('/dashboard')
    }
  }, [profile, router])

  useEffect(() => {
    fetchUsers()
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
    { label: 'Total usuarios',    value: users.length,                                     icon: Users,        color: 'text-navy' },
    { label: 'Pendientes',        value: users.filter(u => u.role === 'pending').length,   icon: Clock,        color: 'text-amber-600' },
    { label: 'Activos',           value: users.filter(u => u.role !== 'pending').length,   icon: CheckCircle,  color: 'text-green-600' },
    { label: 'Administradores',   value: users.filter(u => u.role === 'admin').length,     icon: Shield,       color: 'text-red-600' },
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
