'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { BarChart3, Search, FileDown, TrendingDown, CalendarDays } from 'lucide-react'
import {
  getAllEnsayos, getAllIntegrantes, getAsistencia, type IntegranteBase,
} from '@/lib/firebase'
import { FAMILIAS, getSeccion, type FamiliaKey } from '@/lib/secciones'
import { descargarCSV } from '@/lib/integrantes-utils'
import { cn } from '@/lib/utils'

const norm = (s: string) => (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

interface EnsayoLite { id: string; title: string; date: string }

export default function ReportesAsistencia() {
  const [ensayos, setEnsayos] = useState<EnsayoLite[]>([])
  const [roster, setRoster] = useState<IntegranteBase[]>([])
  const [presentesPorEnsayo, setPresentesPorEnsayo] = useState<Record<string, Set<string>>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [fam, setFam] = useState<FamiliaKey | 'all'>('all')
  const [ultimos, setUltimos] = useState<number>(0) // 0 = todos

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [e, r] = await Promise.all([getAllEnsayos(), getAllIntegrantes()])
      const ens = (e as unknown as EnsayoLite[]).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
      setEnsayos(ens); setRoster(r)
      const entradas = await Promise.all(ens.map(async x => [x.id, new Set(Object.keys(await getAsistencia(x.id)))] as const))
      setPresentesPorEnsayo(Object.fromEntries(entradas))
    } catch { toast.error('No se pudo cargar el reporte') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  // Ensayos considerados (todos o los últimos N)
  const ensayosCons = useMemo(() => ultimos > 0 ? ensayos.slice(0, ultimos) : ensayos, [ensayos, ultimos])
  const totalEnsayos = ensayosCons.length

  const filas = useMemo(() => {
    const q = norm(search.trim())
    return roster
      .filter(i => fam === 'all' || i.familia === fam)
      .filter(i => !q || norm(`${i.nombre} ${i.apellidos} ${getSeccion(i.seccion)?.label ?? ''}`).includes(q))
      .map(i => {
        const asistidos = ensayosCons.reduce((n, e) => n + (presentesPorEnsayo[e.id]?.has(i.id) ? 1 : 0), 0)
        const pct = totalEnsayos ? Math.round((asistidos / totalEnsayos) * 100) : 0
        return { i, asistidos, pct }
      })
      .sort((a, b) => a.pct - b.pct || `${a.i.apellidos}`.localeCompare(b.i.apellidos, 'es'))
  }, [roster, fam, search, ensayosCons, presentesPorEnsayo, totalEnsayos])

  const promedio = useMemo(() => {
    if (!filas.length || !totalEnsayos) return 0
    return Math.round(filas.reduce((s, f) => s + f.pct, 0) / filas.length)
  }, [filas, totalEnsayos])

  const enRiesgo = filas.filter(f => f.pct < 60).length

  const exportar = () => {
    descargarCSV('reporte-asistencia',
      ['Apellidos', 'Nombre', 'Sección', 'Asistencias', 'Total ensayos', '% asistencia'],
      filas.map(({ i, asistidos, pct }) => [
        i.apellidos, i.nombre, getSeccion(i.seccion)?.label ?? i.seccion, String(asistidos), String(totalEnsayos), `${pct}%`,
      ]))
    toast.success('Reporte de asistencia descargado')
  }

  if (loading) return <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-royal/30 border-t-royal rounded-full animate-spin" /></div>

  if (totalEnsayos === 0) {
    return (
      <div className="card text-center py-14 text-gray-400">
        <CalendarDays size={34} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">Aún no hay ensayos con asistencia registrada.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <Stat icon={CalendarDays} label="Ensayos" value={String(totalEnsayos)} color="text-navy" />
        <Stat icon={BarChart3} label="Asistencia promedio" value={`${promedio}%`} color="text-green-600" />
        <Stat icon={TrendingDown} label="Bajo 60%" value={String(enRiesgo)} color="text-red-500" />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" placeholder="Buscar integrante..." />
        </div>
        <select value={fam} onChange={e => setFam(e.target.value as FamiliaKey | 'all')} className="input max-w-[180px]">
          <option value="all">Todas las familias</option>
          {(Object.keys(FAMILIAS) as FamiliaKey[]).map(fk => <option key={fk} value={fk}>{FAMILIAS[fk].emoji} {FAMILIAS[fk].label}</option>)}
        </select>
        <select value={ultimos} onChange={e => setUltimos(Number(e.target.value))} className="input max-w-[170px]">
          <option value={0}>Todos los ensayos</option>
          <option value={4}>Últimos 4</option>
          <option value={8}>Últimos 8</option>
          <option value={12}>Últimos 12</option>
        </select>
        <button onClick={exportar} className="btn btn-ghost btn-sm"><FileDown size={14} /> Exportar</button>
      </div>

      <p className="text-xs text-gray-400 mb-2">Ordenado por menor asistencia (para detectar quién falta seguido).</p>
      <div className="space-y-1.5">
        {filas.map(({ i, asistidos, pct }) => (
          <div key={i.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-3">
            <div className="w-9 h-9 rounded-full bg-royal/10 flex items-center justify-center text-royal text-sm font-bold shrink-0">{(i.nombre[0] ?? '?').toUpperCase()}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-dark truncate">{i.nombre} {i.apellidos}</p>
              <p className="text-xs text-gray-400 truncate">{getSeccion(i.seccion)?.label ?? i.seccion} · {asistidos}/{totalEnsayos} ensayos</p>
              <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full', pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-amber-400' : 'bg-red-400')} style={{ width: `${pct}%` }} />
              </div>
            </div>
            <span className={cn('text-sm font-bold shrink-0 w-12 text-right', pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-amber-600' : 'text-red-500')}>{pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Stat({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return <div className="bg-white border border-gray-100 rounded-xl p-4"><Icon size={18} className={cn('mb-1', color)} /><div className={cn('font-display text-2xl font-bold', color)}>{value}</div><div className="text-xs text-gray-400 leading-tight">{label}</div></div>
}
