'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Users, ShieldCheck } from 'lucide-react'
import { getAllUsers, updateUserRole, updateUserProfile } from '@/lib/firebase'
import { cn, getRoleLabel, getRoleBadgeColor, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import type { UserProfile, UserRole } from '@/types'

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Administrador' }, { value: 'director', label: 'Director Musical' },
  { value: 'integrante', label: 'Integrante' }, { value: 'junta', label: 'Junta Directiva' },
  { value: 'cm', label: 'Community Manager' }, { value: 'visitante', label: 'Visitante' },
  { value: 'pending', label: 'Pendiente' },
]

export default function CuentasRolesPanel() {
  const [users, setUsers]     = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState<UserRole | 'all'>('all')

  const fetchUsers = async () => {
    setLoading(true)
    try { setUsers(await getAllUsers()) }
    catch { toast.error('Error al cargar usuarios') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchUsers() }, [])

  const handleRole = async (uid: string, role: UserRole) => {
    try { await updateUserRole(uid, role); setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role } : u)); toast.success(`Rol actualizado a "${getRoleLabel(role)}"`) }
    catch { toast.error('Error al actualizar el rol') }
  }

  const handleApprove = async (u: UserProfile) => {
    if (!u.requestedRole) return
    try {
      await updateUserRole(u.uid, u.requestedRole)
      await updateUserProfile(u.uid, { requestedRole: null })
      setUsers(prev => prev.map(p => p.uid === u.uid ? { ...p, role: u.requestedRole as UserRole, requestedRole: undefined } : p))
      toast.success(`${u.displayName} ahora es ${getRoleLabel(u.requestedRole)}`)
    } catch { toast.error('Error al aprobar la solicitud') }
  }

  const filtered = filter === 'all' ? users : users.filter(u => u.role === filter)
  const pendingApprovals = users.filter(u => u.role === 'pending' && u.requestedRole)

  return (
    <div>
      {/* Roles solicitados pendientes */}
      {pendingApprovals.length > 0 && (
        <div className="mb-6">
          <h3 className="font-display text-navy text-lg font-bold uppercase tracking-wider flex items-center gap-2 mb-3">
            <ShieldCheck size={18} className="text-royal" /> Roles solicitados pendientes
          </h3>
          <div className="space-y-2">
            {pendingApprovals.map(u => (
              <div key={u.uid} className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {u.photoURL ? <Image src={u.photoURL} alt={u.displayName} width={36} height={36} className="rounded-full shrink-0" /> : <div className="w-9 h-9 rounded-full bg-navy text-white text-sm font-bold flex items-center justify-center shrink-0">{u.displayName[0]?.toUpperCase()}</div>}
                  <div><p className="text-sm font-semibold text-dark">{u.displayName}</p><p className="text-xs text-gray-400">{u.email}</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="badge bg-amber-100 text-amber-700">Solicita: {getRoleLabel(u.requestedRole as UserRole)}</span>
                  <button onClick={() => handleApprove(u)} className="btn btn-primary btn-sm">Aprobar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[['all','Todos'],['pending','Pendientes'],['admin','Administradores'],['director','Directores'],['integrante','Integrantes'],['junta','Junta'],['cm','Community Manager'],['visitante','Visitantes']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v as UserRole | 'all')} className={cn('px-3 py-1.5 rounded-full text-xs font-semibold border transition-all', filter === v ? 'bg-navy text-white border-navy' : 'bg-white text-gray-600 border-gray-200 hover:border-navy hover:text-navy')}>
            {l}<span className="ml-1.5 opacity-60">{v === 'all' ? users.length : users.filter(u => u.role === v).length}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="w-7 h-7 border-2 border-royal/30 border-t-royal rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400"><Users size={36} className="mx-auto mb-3 opacity-30" /><p className="text-sm">No hay usuarios en esta categoría</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-navy text-white text-xs font-bold uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Usuario</th><th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Rol actual</th><th className="px-4 py-3 text-left">Rol solicitado</th>
                  <th className="px-4 py-3 text-left">Registro</th><th className="px-4 py-3 text-left">Cambiar rol</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u.uid} className={cn('border-t border-gray-100', i % 2 === 0 ? 'bg-white' : 'bg-gray-50')}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {u.photoURL ? <Image src={u.photoURL} alt={u.displayName} width={32} height={32} className="rounded-full shrink-0" /> : <div className="w-8 h-8 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center shrink-0">{u.displayName[0]?.toUpperCase()}</div>}
                        <span className="text-sm font-medium text-dark truncate max-w-[140px]">{u.displayName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 truncate max-w-[180px]">{u.email}</td>
                    <td className="px-4 py-3"><span className={cn('badge', getRoleBadgeColor(u.role))}>{getRoleLabel(u.role)}</span></td>
                    <td className="px-4 py-3">
                      {u.requestedRole ? (
                        <div className="flex items-center gap-2">
                          <span className="badge bg-amber-100 text-amber-700 text-xs">{getRoleLabel(u.requestedRole)}</span>
                          <button onClick={() => handleApprove(u)} className="text-xs font-semibold text-royal hover:underline">Aprobar</button>
                        </div>
                      ) : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatDate(u.createdAt, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    <td className="px-4 py-3">
                      <select value={u.role} onChange={e => handleRole(u.uid, e.target.value as UserRole)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-dark focus:outline-none focus:border-royal cursor-pointer">
                        {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
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
