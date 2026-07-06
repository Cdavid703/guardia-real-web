'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Wallet, Search, CheckCircle2, Clock, FileDown, MessageCircle, X, Coins,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getAllIntegrantes, getPagosPeriodo, setPago, deletePago, type IntegranteBase,
} from '@/lib/firebase'
import { FAMILIAS, getSeccion, type FamiliaKey } from '@/lib/secciones'
import { descargarCSV } from '@/lib/integrantes-utils'
import type { Pago } from '@/types'
import { cn } from '@/lib/utils'

const norm = (s: string) => (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

function periodoLabel(p: string) {
  const [y, m] = p.split('-')
  return `${MESES[Number(m) - 1] ?? ''} ${y}`
}
const fmtCOP = (n?: number) => n != null ? `$${n.toLocaleString('es-CO')}` : ''

export default function PagosAdminPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [periodo, setPeriodo] = useState(new Date().toISOString().slice(0, 7))
  const [cuota, setCuota] = useState<string>('')
  const [roster, setRoster] = useState<IntegranteBase[]>([])
  const [pagos, setPagos] = useState<Record<string, Pago>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [fam, setFam] = useState<FamiliaKey | 'all'>('all')
  const [soloPendientes, setSoloPendientes] = useState(false)

  useEffect(() => { if (profile && profile.role !== 'admin') router.replace('/dashboard') }, [profile, router])

  const loadRoster = useCallback(async () => {
    try { setRoster(await getAllIntegrantes()) } catch { toast.error('Error al cargar integrantes') }
  }, [])
  useEffect(() => { loadRoster() }, [loadRoster])

  const loadPagos = useCallback(async () => {
    setLoading(true)
    try { setPagos(await getPagosPeriodo(periodo)) }
    catch { toast.error('Error al cargar los pagos') }
    finally { setLoading(false) }
  }, [periodo])
  useEffect(() => { loadPagos() }, [loadPagos])

  const stats = useMemo(() => {
    const pagaron = roster.filter(i => pagos[i.id]?.pagado).length
    const recaudado = roster.reduce((s, i) => s + (pagos[i.id]?.monto ?? 0), 0)
    return { total: roster.length, pagaron, pendientes: roster.length - pagaron, recaudado }
  }, [roster, pagos])

  const lista = useMemo(() => {
    const q = norm(search.trim())
    return roster
      .filter(i => fam === 'all' || i.familia === fam)
      .filter(i => !soloPendientes || !pagos[i.id]?.pagado)
      .filter(i => !q || norm(`${i.nombre} ${i.apellidos} ${getSeccion(i.seccion)?.label ?? ''}`).includes(q))
      .sort((a, b) => `${a.apellidos}`.localeCompare(b.apellidos, 'es'))
  }, [roster, fam, soloPendientes, search, pagos])

  const marcar = async (i: IntegranteBase) => {
    if (!profile) return
    const monto = cuota ? Number(cuota) : undefined
    const nombre = `${i.nombre} ${i.apellidos}`.trim()
    setPagos(p => ({ ...p, [i.id]: { id: `${i.id}_${periodo}`, integranteId: i.id, integranteNombre: nombre, periodo, pagado: true, monto, fecha: new Date().toISOString().slice(0, 10), createdAt: new Date() } }))
    try { await setPago(i.id, periodo, { integranteNombre: nombre, monto }, profile.uid) }
    catch { toast.error('No se pudo guardar'); loadPagos() }
  }

  const desmarcar = async (i: IntegranteBase) => {
    setPagos(p => { const n = { ...p }; delete n[i.id]; return n })
    try { await deletePago(i.id, periodo) } catch { toast.error('No se pudo quitar'); loadPagos() }
  }

  const recordar = (i: IntegranteBase) => {
    const tel = (i.whatsapp || '').replace(/\D/g, '')
    if (!tel) { toast.info('Sin WhatsApp registrado'); return }
    const msg = encodeURIComponent(
      `Hola ${i.nombre}, desde la Guardia Real de Antioquia. Te recordamos el aporte de ${periodoLabel(periodo)}` +
      `${cuota ? ` (${fmtCOP(Number(cuota))})` : ''}. ¡Gracias por tu compromiso con la banda!`)
    window.open(`https://wa.me/57${tel}?text=${msg}`, '_blank', 'noopener')
  }

  const exportar = () => {
    descargarCSV(`pagos-${periodo}`,
      ['Apellidos', 'Nombre', 'Sección', 'Estado', 'Monto', 'Fecha de pago'],
      lista.map(i => {
        const p = pagos[i.id]
        return [i.apellidos, i.nombre, getSeccion(i.seccion)?.label ?? i.seccion, p?.pagado ? 'Pagó' : 'Pendiente', p?.monto != null ? String(p.monto) : '', p?.fecha ?? '']
      }))
    toast.success('Reporte de pagos descargado')
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-navy text-2xl font-bold uppercase tracking-wider flex items-center gap-2"><Wallet size={22} className="text-royal" /> Pagos y mensualidades</h1>
        <p className="text-gray-400 text-sm mt-1">Controla los aportes por periodo: quién está al día, cuánto se recaudó y recordatorios por WhatsApp</p>
      </div>

      {/* Periodo + cuota */}
      <div className="card p-4 mb-5 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-semibold text-dark mb-1">Periodo</label>
          <input type="month" value={periodo} onChange={e => setPeriodo(e.target.value)} className="input" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-dark mb-1">Cuota del mes <span className="font-normal text-gray-400">(opcional, para prellenar)</span></label>
          <div className="relative">
            <Coins size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="number" value={cuota} onChange={e => setCuota(e.target.value)} className="input pl-9 max-w-[160px]" placeholder="30000" />
          </div>
        </div>
        <p className="text-sm text-gray-500 ml-auto">Mostrando <strong className="text-navy">{periodoLabel(periodo)}</strong></p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Stat icon={CheckCircle2} label="Al día" value={String(stats.pagaron)} color="text-green-600" />
        <Stat icon={Clock} label="Pendientes" value={String(stats.pendientes)} color="text-amber-600" />
        <Stat icon={Coins} label="Recaudado" value={fmtCOP(stats.recaudado) || '$0'} color="text-royal" />
        <Stat icon={Wallet} label="Integrantes" value={String(stats.total)} color="text-navy" />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" placeholder="Buscar integrante..." />
        </div>
        <select value={fam} onChange={e => setFam(e.target.value as FamiliaKey | 'all')} className="input max-w-[180px]">
          <option value="all">Todas las familias</option>
          {(Object.keys(FAMILIAS) as FamiliaKey[]).map(fk => <option key={fk} value={fk}>{FAMILIAS[fk].emoji} {FAMILIAS[fk].label}</option>)}
        </select>
        <button onClick={() => setSoloPendientes(s => !s)} className={cn('btn btn-sm', soloPendientes ? 'btn-primary' : 'btn-ghost')}>
          <Clock size={14} /> {soloPendientes ? 'Viendo pendientes' : 'Solo pendientes'}
        </button>
        <button onClick={exportar} className="btn btn-ghost btn-sm"><FileDown size={14} /> Exportar</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-royal/30 border-t-royal rounded-full animate-spin" /></div>
      ) : lista.length === 0 ? (
        <div className="card text-center py-12 text-gray-400 text-sm">Sin resultados.</div>
      ) : (
        <div className="space-y-1.5">
          {lista.map(i => {
            const p = pagos[i.id]
            return (
              <div key={i.id} className={cn('flex items-center gap-3 border rounded-xl p-3', p?.pagado ? 'border-green-200 bg-green-50/60' : 'border-gray-100 bg-white')}>
                <div className="w-9 h-9 rounded-full bg-royal/10 flex items-center justify-center text-royal text-sm font-bold shrink-0">{(i.nombre[0] ?? '?').toUpperCase()}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-dark truncate">{i.nombre} {i.apellidos}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {getSeccion(i.seccion)?.label ?? i.seccion}
                    {p?.pagado && <span className="text-green-600"> · {fmtCOP(p.monto) || 'pagó'}{p.fecha ? ` · ${p.fecha}` : ''}</span>}
                  </p>
                </div>
                {p?.pagado ? (
                  <button onClick={() => desmarcar(i)} className="btn btn-ghost btn-sm text-red-500 shrink-0"><X size={13} /> Quitar</button>
                ) : (
                  <>
                    {i.whatsapp && (
                      <button onClick={() => recordar(i)} title="Recordar por WhatsApp" className="w-8 h-8 rounded-lg bg-[#25D366]/10 text-[#1ebd5a] hover:bg-[#25D366] hover:text-white flex items-center justify-center shrink-0"><MessageCircle size={14} /></button>
                    )}
                    <button onClick={() => marcar(i)} className="btn btn-primary btn-sm shrink-0"><CheckCircle2 size={13} /> Marcar pagado</button>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Stat({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return <div className="bg-white border border-gray-100 rounded-xl p-4"><Icon size={18} className={cn('mb-1', color)} /><div className={cn('font-display text-2xl font-bold', color)}>{value}</div><div className="text-xs text-gray-400 leading-tight">{label}</div></div>
}
