'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { Users, ShieldCheck, UserPlus, Search, ChevronLeft, ChevronRight, EyeOff, IdCard } from 'lucide-react'

const norm = (s: string) => (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
import { getAllUsers, getAllIntegrantes, updateUserRole, updateUserProfile, upsertIntegrante, setRolFicha, type IntegranteBase } from '@/lib/firebase'
import { getSeccion } from '@/lib/secciones'
import { cn, getRoleLabel, getRoleBadgeColor, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import type { UserProfile, UserRole, Integrante } from '@/types'

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Administrador' }, { value: 'director', label: 'Director Musical' },
  { value: 'integrante', label: 'Integrante' }, { value: 'junta', label: 'Junta Directiva' },
  { value: 'cm', label: 'Community Manager' }, { value: 'collector', label: 'Recaudador' },
  { value: 'visitante', label: 'Visitante' }, { value: 'pending', label: 'Pendiente' },
]

// Roles que pertenecen a la banda y deberían tener ficha en el roster
const ROLES_BANDA: UserRole[] = ['integrante', 'director', 'junta', 'cm']

const PAGE_SIZE = 25

export default function CuentasRolesPanel({ uid }: { uid: string }) {
  const [users, setUsers]         = useState<UserProfile[]>([])
  const [integrantes, setIntegrantes] = useState<IntegranteBase[]>([])
  const [linkedUids, setLinkedUids] = useState<Set<string>>(new Set())
  const [loading, setLoading]     = useState(true)
  const [creating, setCreating]   = useState<string | null>(null)
  const [filter, setFilter]       = useState<UserRole | 'all'>('all')
  const [search, setSearch]       = useState('')
  const [page, setPage]           = useState(1)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [us, ints] = await Promise.all([getAllUsers(), getAllIntegrantes()])
      setUsers(us)
      setIntegrantes(ints)
      setLinkedUids(new Set(ints.flatMap(i => i.linkedUids ?? [])))
    } catch { toast.error('Error al cargar usuarios') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchAll() }, [fetchAll])

  const handleRole = async (targetUid: string, role: UserRole) => {
    try { await updateUserRole(targetUid, role); setUsers(prev => prev.map(u => u.uid === targetUid ? { ...u, role } : u)); toast.success(`Rol actualizado a "${getRoleLabel(role)}"`) }
    catch { toast.error('Error al actualizar el rol') }
  }

  // Rol de una ficha sin cuenta (queda en la ficha y se aplica al iniciar sesión)
  const handleRolFicha = async (id: string, rol: UserRole) => {
    try { await setRolFicha(id, rol); setIntegrantes(prev => prev.map(i => i.id === id ? { ...i, rol } : i)); toast.success(`Rol de ficha: "${getRoleLabel(rol)}"`) }
    catch { toast.error('Error al actualizar el rol de la ficha') }
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

  const handleCrearFicha = async (u: UserProfile) => {
    setCreating(u.uid)
    try {
      const partes = (u.displayName ?? '').trim().split(/\s+/)
      const ficha: Partial<Integrante> = {
        nombre: partes[0] ?? u.displayName ?? '',
        apellidos: partes.slice(1).join(' '),
        correo: (u.email ?? '').toLowerCase(),
        whatsapp: u.phone ?? '',
        seccion: '', familia: '', secciones: [],
        direccion: '', tipoDoc: '', numDoc: '', fechaNacimiento: '',
        tipoSangre: '', eps: '', pasaporte: false, contactoEmergencia: '', diagnostico: '',
        linkedUid: u.uid, linkedUids: [u.uid], correosAutorizados: [(u.email ?? '').toLowerCase()], activo: true,
      }
      await upsertIntegrante(null, ficha, uid)
      toast.success(`Ficha creada y enlazada para ${u.displayName}. Pídele completar sus datos en "Mi ficha".`)
      fetchAll()
    } catch { toast.error('Error al crear la ficha') }
    finally { setCreating(null) }
  }

  const q = norm(search.trim())
  const filtered = users.filter(u => {
    const matchesSearch = !q || norm(`${u.displayName} ${u.email}`).includes(q)
    if (!matchesSearch) return false
    // La vista "Todos" oculta a los visitantes (salvo que estés buscando).
    if (filter === 'all') return q ? true : u.role !== 'visitante'
    return u.role === filter
  })
  const pendingApprovals = users.filter(u => u.role === 'pending' && u.requestedRole)
  // Fichas de integrante que aún no tienen una cuenta de usuario enlazada (no han iniciado sesión)
  const fichasSinCuenta = integrantes
    .filter(i => (i.linkedUids ?? []).length === 0)
    .filter(i => { if (!q) return true; return norm(`${i.nombre} ${i.apellidos} ${i.correo}`).includes(q) })
  const visitantesOcultos = filter === 'all' && !q ? users.filter(u => u.role === 'visitante').length : 0

  // Paginación — se reinicia al cambiar filtro o búsqueda
  useEffect(() => { setPage(1) }, [filter, search])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages)
  const paged = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE)

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

      {/* Fichas sin cuenta de usuario (tienen ficha pero no han iniciado sesión) */}
      {fichasSinCuenta.length > 0 && (
        <div className="mb-6">
          <h3 className="font-display text-navy text-lg font-bold uppercase tracking-wider flex items-center gap-2 mb-1">
            <IdCard size={18} className="text-royal" /> Fichas sin cuenta <span className="text-gray-400 font-normal normal-case tracking-normal text-sm">({fichasSinCuenta.length})</span>
          </h3>
          <p className="text-xs text-gray-500 mb-3 max-w-3xl">
            Estas personas ya registraron su ficha, pero <strong>aún no han iniciado sesión</strong>, por eso no tienen rol y no aparecen en la lista de abajo. En cuanto entren con su correo, su cuenta se crea y podrás asignarles el rol aquí.
          </p>
          <div className="bg-amber-50/60 border border-amber-100 rounded-xl divide-y divide-amber-100 max-h-72 overflow-y-auto">
            {fichasSinCuenta.map(i => (
              <div key={i.id} className="px-4 py-2.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center shrink-0">{i.nombre[0]?.toUpperCase() ?? '?'}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-dark truncate">{i.nombre} {i.apellidos}</p>
                  <p className="text-xs text-gray-400 truncate">{i.correo || 'sin correo'} · {getSeccion(i.seccion)?.label ?? i.seccion ?? '—'}</p>
                </div>
                <select value={i.rol ?? 'integrante'} onChange={e => handleRolFicha(i.id, e.target.value as UserRole)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-dark focus:outline-none focus:border-royal cursor-pointer shrink-0">
                  {ROLES.filter(r => r.value !== 'admin' && r.value !== 'pending').map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <span className="badge bg-amber-100 text-amber-700 text-xs shrink-0">Sin cuenta</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Buscador */}
      <div className="relative mb-3 max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" placeholder="Buscar por nombre o correo..." />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-2">
        {[['all','Todos'],['pending','Pendientes'],['admin','Administradores'],['director','Directores'],['integrante','Integrantes'],['junta','Junta'],['cm','Community Manager'],['collector','Recaudadores'],['visitante','Visitantes']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v as UserRole | 'all')} className={cn('px-3 py-1.5 rounded-full text-xs font-semibold border transition-all', filter === v ? 'bg-navy text-white border-navy' : 'bg-white text-gray-600 border-gray-200 hover:border-navy hover:text-navy')}>
            {l}<span className="ml-1.5 opacity-60">{v === 'all' ? users.filter(u => u.role !== 'visitante').length : users.filter(u => u.role === v).length}</span>
          </button>
        ))}
      </div>
      {visitantesOcultos > 0 && (
        <p className="text-xs text-gray-400 mb-4 flex items-center gap-1.5">
          <EyeOff size={12} />
          {visitantesOcultos} visitante{visitantesOcultos !== 1 ? 's' : ''} oculto{visitantesOcultos !== 1 ? 's' : ''} de esta vista.
          <button onClick={() => setFilter('visitante')} className="text-royal font-semibold hover:underline">Ver visitantes</button>
        </p>
      )}

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
                  <th className="px-4 py-3 text-left">Ficha</th>
                  <th className="px-4 py-3 text-left">Registro</th><th className="px-4 py-3 text-left">Cambiar rol</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((u, i) => {
                  const necesitaFicha = ROLES_BANDA.includes(u.role) && !linkedUids.has(u.uid)
                  return (
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
                    <td className="px-4 py-3">
                      {necesitaFicha ? (
                        <button onClick={() => handleCrearFicha(u)} disabled={creating === u.uid}
                          className="text-[11px] bg-gold/15 text-amber-700 hover:bg-gold hover:text-navy rounded-full px-2.5 py-1 font-semibold flex items-center gap-1 transition-colors disabled:opacity-60">
                          <UserPlus size={11} /> {creating === u.uid ? 'Creando...' : 'Crear ficha'}
                        </button>
                      ) : ROLES_BANDA.includes(u.role) ? (
                        <span className="text-[11px] bg-green-100 text-green-700 rounded-full px-2.5 py-1 font-medium">Con ficha</span>
                      ) : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatDate(u.createdAt, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    <td className="px-4 py-3">
                      <select value={u.role} onChange={e => handleRole(u.uid, e.target.value as UserRole)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-dark focus:outline-none focus:border-royal cursor-pointer">
                        {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-between gap-3 mt-3 text-xs text-gray-500">
          <span>
            Mostrando <strong className="text-dark">{(pageSafe - 1) * PAGE_SIZE + 1}–{Math.min(pageSafe * PAGE_SIZE, filtered.length)}</strong> de <strong className="text-dark">{filtered.length}</strong>
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={pageSafe <= 1}
                className="p-1.5 rounded-lg border border-gray-200 hover:border-navy disabled:opacity-40 disabled:hover:border-gray-200 transition-colors"><ChevronLeft size={15} /></button>
              <span className="px-2 font-semibold text-dark">{pageSafe} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={pageSafe >= totalPages}
                className="p-1.5 rounded-lg border border-gray-200 hover:border-navy disabled:opacity-40 disabled:hover:border-gray-200 transition-colors"><ChevronRight size={15} /></button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
