'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { ClipboardCheck, Search, Star, Music2, Users } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getRepertorio, getAllIntegrantes, getCalificacionesTema, setCalificacion, type IntegranteBase,
} from '@/lib/firebase'
import { REPERTORIO_SEED, REPERTORIO_SEMANA_SANTA, REPERTORIO_EJERCICIOS } from '@/lib/repertorio'
import { getSeccion } from '@/lib/secciones'
import { cn } from '@/lib/utils'
import type { Tema, Calificacion, UserRole } from '@/types'

const norm = (s: string) => (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const CAT_LABEL: Record<string, string> = { temporada: 'Repertorio 2026', 'semana-santa': 'Semana Santa', ejercicios: 'Ejercicios' }

export default function RevisionTemasPanel() {
  const { profile } = useAuth()
  const role = (profile?.role ?? 'integrante') as UserRole
  const esMonitor = role === 'monitor'
  const seccionesMonitor = profile?.seccionesMonitor ?? []

  const [dynTemas, setDynTemas] = useState<Tema[]>([])
  const [roster, setRoster] = useState<IntegranteBase[]>([])
  const [temaId, setTemaId] = useState('')
  const [califs, setCalifs] = useState<Record<string, Calificacion>>({})
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getRepertorio().catch(() => []), getAllIntegrantes().catch(() => [])])
      .then(([d, r]) => { setDynTemas(d); setRoster(r) })
      .finally(() => setLoading(false))
  }, [])

  // Todos los temas: dinámicos + seeds no duplicados
  const temas = useMemo(() => {
    const seeds = [...REPERTORIO_SEED, ...REPERTORIO_SEMANA_SANTA, ...REPERTORIO_EJERCICIOS]
    const titulosDyn = new Set(dynTemas.map(t => t.titulo.trim().toLowerCase()))
    const faltantes = seeds.filter(s => !titulosDyn.has(s.titulo.trim().toLowerCase()))
    return [...dynTemas, ...faltantes].sort((a, b) => {
      const ca = a.categoria ?? 'temporada', cb = b.categoria ?? 'temporada'
      if (ca !== cb) return ca.localeCompare(cb)
      return (a.numeroMarcacion ?? 999) - (b.numeroMarcacion ?? 999)
    })
  }, [dynTemas])

  const temaSel = temas.find(t => t.id === temaId)

  // Integrantes que el usuario puede revisar
  const integrantes = useMemo(() => {
    const q = norm(search.trim())
    return roster
      .filter(i => {
        if (!esMonitor) return true // director/admin → todos
        const secs = new Set([i.seccion, ...(i.secciones ?? [])].filter(Boolean))
        return seccionesMonitor.some(s => secs.has(s))
      })
      .filter(i => !q || norm(`${i.nombre} ${i.apellidos} ${getSeccion(i.seccion)?.label ?? ''}`).includes(q))
      .sort((a, b) => `${a.apellidos}`.localeCompare(b.apellidos, 'es'))
  }, [roster, esMonitor, seccionesMonitor, search])

  const loadCalifs = useCallback(async (tid: string) => {
    if (!tid) { setCalifs({}); return }
    try { setCalifs(await getCalificacionesTema(tid)) } catch { /* noop */ }
  }, [])
  useEffect(() => { loadCalifs(temaId) }, [temaId, loadCalifs])

  const guardar = async (i: IntegranteBase, patch: { calificacion?: number; comentario?: string }) => {
    if (!profile || !temaSel) return
    const prev = califs[i.id]
    // Optimista
    setCalifs(c => ({ ...c, [i.id]: { ...(prev ?? { id: `${i.id}__${temaId}`, integranteId: i.id, temaId, calificacion: 0 }), ...patch } as Calificacion }))
    try {
      await setCalificacion(i.id, temaId, { ...patch, temaTitulo: temaSel.titulo }, profile.uid, profile.displayName || 'Revisión')
    } catch { toast.error('No se pudo guardar'); loadCalifs(temaId) }
  }

  const promedio = useMemo(() => {
    const vals = integrantes.map(i => califs[i.id]?.calificacion).filter((v): v is number => !!v && v > 0)
    return vals.length ? (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) : '—'
  }, [integrantes, califs])

  return (
    <div>
      {/* Encabezado */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy to-[#0a2350] p-6 sm:p-7 mb-6">
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-gold/15 border border-gold/30 text-gold text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
            <ClipboardCheck size={12} /> Revisión de temas
          </div>
          <h1 className="font-display text-white text-2xl font-bold uppercase tracking-wider">Revisión de temas</h1>
          <p className="text-gray-300 text-sm mt-1 max-w-lg">Califica (1–5) y comenta cómo va cada integrante en cada tema. {esMonitor ? 'Ves los integrantes de tus secciones asignadas.' : 'Ves a todos los integrantes.'}</p>
        </div>
      </div>

      {esMonitor && seccionesMonitor.length === 0 ? (
        <div className="card p-6 text-center text-gray-500 text-sm">
          Aún no tienes secciones asignadas. Pídele al administrador que te asigne tus secciones en <strong>Cuentas y Roles</strong>.
        </div>
      ) : (
        <>
          {/* Selector de tema */}
          <div className="card p-4 mb-5 flex flex-wrap items-end gap-4">
            <div className="min-w-[240px]">
              <label className="block text-xs font-semibold text-dark mb-1 flex items-center gap-1"><Music2 size={13} className="text-royal" /> Tema a revisar</label>
              <select value={temaId} onChange={e => setTemaId(e.target.value)} className="input">
                <option value="">— Elige un tema —</option>
                {Object.keys(CAT_LABEL).map(cat => {
                  const grupo = temas.filter(t => (t.categoria ?? 'temporada') === cat)
                  if (grupo.length === 0) return null
                  return (
                    <optgroup key={cat} label={CAT_LABEL[cat]}>
                      {grupo.map(t => <option key={t.id} value={t.id}>{t.numeroMarcacion ? `${t.numeroMarcacion}. ` : ''}{t.titulo}</option>)}
                    </optgroup>
                  )
                })}
              </select>
            </div>
            {temaSel && (
              <div className="flex items-center gap-4 text-sm text-gray-500 ml-auto">
                <span className="inline-flex items-center gap-1"><Users size={14} /> {integrantes.length} integrante(s)</span>
                <span className="inline-flex items-center gap-1"><Star size={14} className="text-gold" /> Promedio: <strong className="text-navy">{promedio}</strong></span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-royal/30 border-t-royal rounded-full animate-spin" /></div>
          ) : !temaSel ? (
            <div className="card text-center py-14 text-gray-400 text-sm"><Music2 size={30} className="mx-auto mb-3 opacity-30" />Elige un tema arriba para empezar a calificar.</div>
          ) : (
            <>
              <div className="relative mb-4 max-w-md">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" placeholder="Buscar integrante..." />
              </div>

              {integrantes.length === 0 ? (
                <div className="card text-center py-12 text-gray-400 text-sm">No hay integrantes para revisar.</div>
              ) : (
                <div className="space-y-2">
                  {integrantes.map(i => {
                    const c = califs[i.id]
                    return (
                      <div key={i.id} className="border border-gray-100 bg-white rounded-xl p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-royal/10 flex items-center justify-center text-royal text-sm font-bold shrink-0">{(i.nombre[0] ?? '?').toUpperCase()}</div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-dark truncate">{i.nombre} {i.apellidos}</p>
                            <p className="text-xs text-gray-400 truncate">{getSeccion(i.seccion)?.label ?? i.seccion}</p>
                          </div>
                          {/* Estrellas 1–5 */}
                          <div className="flex items-center gap-0.5 shrink-0">
                            {[1, 2, 3, 4, 5].map(n => (
                              <button key={n} onClick={() => guardar(i, { calificacion: (c?.calificacion === n ? 0 : n) })} title={`${n} de 5`} className="p-0.5">
                                <Star size={20} className={cn('transition-colors', (c?.calificacion ?? 0) >= n ? 'fill-gold text-gold' : 'text-gray-300 hover:text-gold/50')} />
                              </button>
                            ))}
                          </div>
                        </div>
                        <input
                          defaultValue={c?.comentario ?? ''}
                          onBlur={e => { if (e.target.value !== (c?.comentario ?? '')) guardar(i, { comentario: e.target.value }) }}
                          placeholder="Comentario (ej. le falta la parte del coro)..."
                          className="mt-2 w-full text-xs px-3 py-2 border border-gray-200 rounded-lg bg-gray-50/60 focus:outline-none focus:border-royal focus:bg-white"
                        />
                        {c?.calificadoPorNombre && <p className="text-[10px] text-gray-300 mt-1">Última revisión: {c.calificadoPorNombre}</p>}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
