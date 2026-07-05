'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Search, CheckCircle2, Clock, Circle, XCircle, FileDown, Ruler } from 'lucide-react'
import { getAllIntegrantes, type IntegranteBase } from '@/lib/firebase'
import { getSeccion } from '@/lib/secciones'
import { descargarCSV } from '@/lib/integrantes-utils'
import { cn } from '@/lib/utils'
import type { ChaquetaInfo } from '@/types'

const norm = (s: string) => (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

function MiniChip({ info }: { info?: ChaquetaInfo }) {
  const e = info?.estado ?? 'sin_registrar'
  const base = 'text-[10px] rounded-full px-2 py-0.5 font-medium inline-flex items-center gap-1'
  if (e === 'confirmada') return <span className={cn(base, 'bg-green-100 text-green-700')}><CheckCircle2 size={10} /> Confirmada{info?.talla ? ` · ${info.talla}` : ''}</span>
  if (e === 'solicitada') return <span className={cn(base, 'bg-amber-100 text-amber-700')}><Clock size={10} /> Solicitada</span>
  if (e === 'no_tiene')   return <span className={cn(base, 'bg-red-100 text-red-600')}><XCircle size={10} /> No la tiene</span>
  if (info?.tiene)        return <span className={cn(base, 'bg-blue-100 text-blue-700')}><CheckCircle2 size={10} /> Tiene{info?.talla ? ` · ${info.talla}` : ''}</span>
  return <span className={cn(base, 'bg-gray-100 text-gray-400')}><Circle size={10} /> Sin registrar</span>
}

export default function ResumenUniformes() {
  const [items, setItems] = useState<IntegranteBase[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const todos = await getAllIntegrantes()
      setItems(todos.filter(i => i.familia !== 'colorguard'))
    } catch { toast.error('Error al cargar el resumen') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    const q = norm(search.trim())
    if (!q) return items
    return items.filter(i => norm(`${i.nombre} ${i.apellidos} ${getSeccion(i.seccion)?.label ?? ''}`).includes(q))
  }, [items, search])

  const stats = useMemo(() => ({
    total: items.length,
    completos: items.filter(i => i.chaqueta?.estado === 'confirmada' && i.kepis?.estado === 'confirmada').length,
    ninguna: items.filter(i => !i.chaqueta?.tiene && !i.kepis?.tiene).length,
  }), [items])

  const exportCSV = () => {
    const est = (c?: ChaquetaInfo) => c?.estado === 'confirmada' ? 'Confirmada' : c?.estado === 'solicitada' ? 'Solicitada' : c?.estado === 'no_tiene' ? 'No la tiene' : c?.tiene ? 'Tiene' : 'Sin registrar'
    descargarCSV('resumen-uniformes',
      ['Apellidos', 'Nombre', 'Sección', 'Chaqueta', 'Talla chaqueta', 'Kepis', 'Talla kepis'],
      items.map(i => [
        i.apellidos, i.nombre, getSeccion(i.seccion)?.label ?? i.seccion,
        est(i.chaqueta), i.chaqueta?.talla ?? '', est(i.kepis), i.kepis?.talla ?? '',
      ]))
    toast.success('Resumen de uniformes descargado')
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <Stat label="Integrantes" value={stats.total} color="text-navy" />
        <Stat label="Con ambas confirmadas" value={stats.completos} color="text-green-600" />
        <Stat label="Sin ninguna prenda" value={stats.ninguna} color="text-red-500" />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" placeholder="Buscar por nombre o sección..." />
        </div>
        <button onClick={exportCSV} className="btn btn-ghost btn-sm"><FileDown size={14} /> Exportar</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="w-7 h-7 border-2 border-royal/30 border-t-royal rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-14 text-gray-400 text-sm">Sin resultados.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="py-2 pr-3 font-semibold">Integrante</th>
                <th className="py-2 px-3 font-semibold hidden sm:table-cell">Sección</th>
                <th className="py-2 px-3 font-semibold flex items-center gap-1">👔 Chaqueta</th>
                <th className="py-2 pl-3 font-semibold">🎩 Kepis</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(i => {
                const sec = getSeccion(i.seccion)
                return (
                  <tr key={i.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {i.fotoURL ? (
                          <Image src={i.fotoURL} alt="" width={28} height={28} className="rounded-full w-7 h-7 object-cover shrink-0" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-royal/10 flex items-center justify-center text-royal text-xs font-bold shrink-0">{(i.nombre[0] ?? '?').toUpperCase()}</div>
                        )}
                        <span className="font-medium text-dark truncate">{i.nombre} {i.apellidos}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-gray-400 hidden sm:table-cell">{sec?.label ?? i.seccion}</td>
                    <td className="py-2 px-3"><MiniChip info={i.chaqueta} /></td>
                    <td className="py-2 pl-3"><MiniChip info={i.kepis} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4 flex items-center gap-1.5">
        <Ruler size={12} /> Las tallas aparecen junto a cada prenda confirmada. Para gestionar cada una usa las pestañas Chaquetas y Kepis.
      </p>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return <div className="bg-white border border-gray-100 rounded-xl p-4"><div className={cn('font-display text-2xl font-bold', color)}>{value}</div><div className="text-xs text-gray-400 leading-tight">{label}</div></div>
}
