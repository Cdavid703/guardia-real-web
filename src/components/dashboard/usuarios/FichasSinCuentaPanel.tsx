'use client'

import { useEffect, useState, useCallback } from 'react'
import { IdCard, Search, Users } from 'lucide-react'
import { getAllIntegrantes, setRolFicha, type IntegranteBase } from '@/lib/firebase'
import { getSeccion } from '@/lib/secciones'
import { getRoleLabel } from '@/lib/utils'
import { toast } from 'sonner'
import type { UserRole } from '@/types'

const norm = (s: string) => (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

// Roles asignables a una ficha (sin cuenta): se aplican cuando la persona inicia sesión
const ROLES_FICHA: { value: UserRole; label: string }[] = [
  { value: 'integrante', label: 'Integrante' }, { value: 'director', label: 'Director Musical' },
  { value: 'junta', label: 'Junta Directiva' }, { value: 'cm', label: 'Community Manager' },
  { value: 'collector', label: 'Recaudador' }, { value: 'staff', label: 'Staff' },
  { value: 'monitor', label: 'Monitor' }, { value: 'visitante', label: 'Visitante' },
]

/** Fichas de integrante que aún no tienen una cuenta de usuario enlazada (no han iniciado sesión). */
export default function FichasSinCuentaPanel() {
  const [integrantes, setIntegrantes] = useState<IntegranteBase[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try { setIntegrantes(await getAllIntegrantes()) }
    catch { toast.error('Error al cargar las fichas') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchAll() }, [fetchAll])

  const handleRolFicha = async (id: string, rol: UserRole) => {
    try { await setRolFicha(id, rol); setIntegrantes(prev => prev.map(i => i.id === id ? { ...i, rol } : i)); toast.success(`Rol de ficha: "${getRoleLabel(rol)}"`) }
    catch { toast.error('Error al actualizar el rol de la ficha') }
  }

  const q = norm(search.trim())
  const fichasSinCuenta = integrantes
    .filter(i => (i.linkedUids ?? []).length === 0)
    .filter(i => !q || norm(`${i.nombre} ${i.apellidos} ${i.correo}`).includes(q))
    .sort((a, b) => `${a.nombre} ${a.apellidos}`.localeCompare(`${b.nombre} ${b.apellidos}`))

  return (
    <div>
      <div className="mb-4">
        <h3 className="font-display text-navy text-lg font-bold uppercase tracking-wider flex items-center gap-2 mb-1">
          <IdCard size={18} className="text-royal" /> Fichas sin cuenta
          <span className="text-gray-400 font-normal normal-case tracking-normal text-sm">({fichasSinCuenta.length})</span>
        </h3>
        <p className="text-xs text-gray-500 max-w-3xl">
          Estas personas ya registraron su ficha, pero <strong>aún no han iniciado sesión</strong>, por eso no tienen cuenta ni rol y no aparecen en &ldquo;Cuentas y roles&rdquo;. En cuanto entren con su correo, su cuenta se crea automáticamente y podrás gestionar su rol allí. Mientras tanto, puedes dejar predefinido el rol que tomarán al entrar.
        </p>
      </div>

      <div className="relative mb-3 max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" placeholder="Buscar por nombre o correo..." />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="w-7 h-7 border-2 border-royal/30 border-t-royal rounded-full animate-spin" /></div>
        ) : fichasSinCuenta.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">{q ? 'Ninguna ficha sin cuenta coincide con la búsqueda' : 'No hay fichas sin cuenta — todas están enlazadas 🎉'}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {fichasSinCuenta.map(i => (
              <div key={i.id} className="px-4 py-2.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center shrink-0">{i.nombre[0]?.toUpperCase() ?? '?'}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-dark truncate">{i.nombre} {i.apellidos}</p>
                  <p className="text-xs text-gray-400 truncate">{i.correo || 'sin correo'} · {getSeccion(i.seccion)?.label ?? i.seccion ?? '—'}</p>
                </div>
                <select value={i.rol ?? 'integrante'} onChange={e => handleRolFicha(i.id, e.target.value as UserRole)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-dark focus:outline-none focus:border-royal cursor-pointer shrink-0">
                  {ROLES_FICHA.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <span className="badge bg-amber-100 text-amber-700 text-xs shrink-0">Sin cuenta</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
