'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ClipboardCheck, Search, Music2, Users, Gauge } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getRepertorio, getAllIntegrantes, getCalificacionesTodas, setCalificacion, type IntegranteBase,
} from '@/lib/firebase'
import { REPERTORIO_SEED, REPERTORIO_SEMANA_SANTA, REPERTORIO_EJERCICIOS } from '@/lib/repertorio'
import { getSeccion } from '@/lib/secciones'
import { cn } from '@/lib/utils'
import type { Tema, Calificacion, UserRole } from '@/types'

const norm = (s: string) => (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const CAT_LABEL: Record<string, string> = { temporada: 'Repertorio 2026', 'semana-santa': 'Semana Santa', ejercicios: 'Ejercicios' }
const fmt = (n: number) => (Math.round(n * 10) / 10).toFixed(1)
// Color según nota /5
const notaColor = (n: number) => n >= 4 ? 'text-green-600' : n >= 3 ? 'text-amber-600' : n > 0 ? 'text-red-500' : 'text-gray-300'

export default function RevisionTemasPanel() {
  const { profile } = useAuth()
  const role = (profile?.role ?? 'integrante') as UserRole
  const esMonitor = role === 'monitor'
  const seccionesMonitor = profile?.seccionesMonitor ?? []

  const [dynTemas, setDynTemas] = useState<Tema[]>([])
  const [roster, setRoster] = useState<IntegranteBase[]>([])
  const [todas, setTodas] = useState<Calificacion[]>([])
  const [temaId, setTemaId] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getRepertorio().catch(() => []), getAllIntegrantes().catch(() => []), getCalificacionesTodas().catch(() => [])])
      .then(([d, r, c]) => { setDynTemas(d); setRoster(r); setTodas(c) })
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

  // Ficha del propio monitor → sección automática
  const miFicha = useMemo(
    () => roster.find(i => (i.linkedUids ?? []).includes(profile?.uid ?? '') || i.linkedUid === profile?.uid),
    [roster, profile?.uid],
  )
  const misSecciones = useMemo(() => {
    if (seccionesMonitor.length > 0) return seccionesMonitor
    return [...new Set([miFicha?.seccion, ...(miFicha?.secciones ?? [])].filter(Boolean))] as string[]
  }, [seccionesMonitor, miFicha])

  const integrantes = useMemo(() => {
    const q = norm(search.trim())
    return roster
      .filter(i => {
        if (!esMonitor) return true
        const secs = new Set([i.seccion, ...(i.secciones ?? [])].filter(Boolean))
        return misSecciones.some(s => secs.has(s))
      })
      .filter(i => !q || norm(`${i.nombre} ${i.apellidos} ${getSeccion(i.seccion)?.label ?? ''}`).includes(q))
      .sort((a, b) => `${a.apellidos}`.localeCompare(b.apellidos, 'es'))
  }, [roster, esMonitor, misSecciones, search])

  // Calificaciones del tema seleccionado (mapa integranteId → Calificacion)
  const califsTema = useMemo(() => {
    const out: Record<string, Calificacion> = {}
    for (const c of todas) if (c.temaId === temaId) out[c.integranteId] = c
    return out
  }, [todas, temaId])

  // Promedio acumulado por integrante (sobre todos los temas calificados)
  const promedios = useMemo(() => {
    const m: Record<string, { suma: number; n: number }> = {}
    for (const c of todas) {
      if (!c.calificacion || c.calificacion <= 0) continue
      const g = (m[c.integranteId] ??= { suma: 0, n: 0 })
      g.suma += c.calificacion; g.n += 1
    }
    const out: Record<string, { prom: number; n: number }> = {}
    for (const [id, g] of Object.entries(m)) out[id] = { prom: g.suma / g.n, n: g.n }
    return out
  }, [todas])

  const guardar = async (i: IntegranteBase, patch: { calificacion?: number; comentario?: string }) => {
    if (!profile || !temaSel) return
    const base = califsTema[i.id] ?? { id: `${i.id}__${temaId}`, integranteId: i.id, temaId, calificacion: 0 }
    const nueva = { ...base, ...patch, temaTitulo: temaSel.titulo } as Calificacion
    setTodas(prev => [...prev.filter(c => !(c.integranteId === i.id && c.temaId === temaId)), nueva])
    try { await setCalificacion(i.id, temaId, { ...patch, temaTitulo: temaSel.titulo }, profile.uid, profile.displayName || 'Revisión') }
    catch { toast.error('No se pudo guardar'); getCalificacionesTodas().then(setTodas).catch(() => {}) }
  }

  const promSeccion = useMemo(() => {
    const vals = integrantes.map(i => califsTema[i.id]?.calificacion).filter((v): v is number => !!v && v > 0)
    return vals.length ? fmt(vals.reduce((s, v) => s + v, 0) / vals.length) : '—'
  }, [integrantes, califsTema])

  const sinSecciones = esMonitor && misSecciones.length === 0

  return (
    <div>
      {/* Encabezado */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy to-[#0a2350] p-6 sm:p-7 mb-6">
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-gold/15 border border-gold/30 text-gold text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
            <ClipboardCheck size={12} /> Revisión de temas
          </div>
          <h1 className="font-display text-white text-2xl font-bold uppercase tracking-wider">Revisión de temas</h1>
          <p className="text-gray-300 text-sm mt-1 max-w-lg">Califica de <strong>0 a 5</strong> (con decimales: 4.2, 4.3…) y comenta cómo va cada integrante en cada tema. Cada quien acumula un promedio de todos los temas.</p>
          {esMonitor && misSecciones.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-3">
              <span className="text-[11px] text-gray-300">Revisas:</span>
              {misSecciones.map(s => <span key={s} className="text-[11px] bg-white/10 border border-white/20 text-white rounded-full px-2 py-0.5">{getSeccion(s)?.label ?? s}</span>)}
            </div>
          )}
        </div>
      </div>

      {sinSecciones ? (
        <div className="card p-6 text-center text-gray-500 text-sm">
          No pudimos deducir tu sección automáticamente (tu ficha no tiene sección). Pídele al administrador que asigne tus secciones en <strong>Cuentas y Roles</strong> o que complete tu ficha.
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
                <span className="inline-flex items-center gap-1"><Users size={14} /> {integrantes.length}</span>
                <span className="inline-flex items-center gap-1"><Gauge size={14} className="text-royal" /> Prom. tema: <strong className="text-navy">{promSeccion}</strong></span>
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
                    const c = califsTema[i.id]
                    const p = promedios[i.id]
                    return (
                      <div key={i.id} className="border border-gray-100 bg-white rounded-xl p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-royal/10 flex items-center justify-center text-royal text-sm font-bold shrink-0">{(i.nombre[0] ?? '?').toUpperCase()}</div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-dark truncate">{i.nombre} {i.apellidos}</p>
                            <p className="text-xs text-gray-400 truncate">
                              {getSeccion(i.seccion)?.label ?? i.seccion}
                              {p && <span className="text-gray-400"> · Prom: <strong className={notaColor(p.prom)}>{fmt(p.prom)}</strong> <span className="text-gray-300">({p.n} tema{p.n !== 1 ? 's' : ''})</span></span>}
                            </p>
                          </div>
                          {/* Nota numérica de este tema */}
                          <div className="shrink-0 text-right">
                            <div className="flex items-center gap-1">
                              <input
                                type="number" min={0} max={5} step={0.1} inputMode="decimal"
                                key={`${temaId}_${i.id}`} defaultValue={c?.calificacion ? String(c.calificacion) : ''}
                                onBlur={e => {
                                  const raw = e.target.value.trim().replace(',', '.')
                                  if (raw === '') { if (c?.calificacion) guardar(i, { calificacion: 0 }); return }
                                  let v = parseFloat(raw); if (isNaN(v)) return
                                  v = Math.max(0, Math.min(5, Math.round(v * 10) / 10))
                                  e.target.value = String(v)
                                  if (v !== (c?.calificacion ?? 0)) guardar(i, { calificacion: v })
                                }}
                                className={cn('w-16 text-center font-bold text-lg border rounded-lg px-1 py-1 focus:outline-none focus:border-royal', c?.calificacion ? notaColor(c.calificacion) + ' border-gray-300' : 'text-gray-400 border-gray-200')}
                                placeholder="—"
                              />
                              <span className="text-xs text-gray-400">/5</span>
                            </div>
                          </div>
                        </div>
                        <input
                          defaultValue={c?.comentario ?? ''} key={`cmt_${temaId}_${i.id}`}
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
