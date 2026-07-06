'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ClipboardCheck, QrCode, Search, Camera, CameraOff, CheckCircle2, X, FileDown, Users2,
  MonitorSmartphone, ScanLine, BarChart3,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useAuth } from '@/contexts/AuthContext'
import Tabs from '@/components/ui/Tabs'
import ReportesAsistencia from '@/components/dashboard/ReportesAsistencia'

const VISTAS = [
  { id: 'tomar',    label: 'Tomar asistencia', icon: ClipboardCheck },
  { id: 'reportes', label: 'Reportes',         icon: BarChart3 },
]
import {
  getAllEnsayos, getAllIntegrantes, getAsistencia, marcarAsistencia, quitarAsistencia,
  type IntegranteBase, type AsistenciaEntry,
} from '@/lib/firebase'
import { getSeccion } from '@/lib/secciones'
import { descargarCSV } from '@/lib/integrantes-utils'
import QrScanner from '@/components/dashboard/QrScanner'
import { cn } from '@/lib/utils'

const norm = (s: string) => (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

interface EnsayoLite { id: string; title: string; date: string; startTime?: string; location?: string }

export default function AsistenciaPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [ensayos, setEnsayos] = useState<EnsayoLite[]>([])
  const [roster, setRoster] = useState<IntegranteBase[]>([])
  const [ensayoId, setEnsayoId] = useState('')
  const [presentes, setPresentes] = useState<Record<string, AsistenciaEntry>>({})
  const [loading, setLoading] = useState(true)
  const [vista, setVista] = useState<'tomar' | 'reportes'>('tomar')
  const [scanning, setScanning] = useState(false)
  const [kiosco, setKiosco] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const [ultimo, setUltimo] = useState('')
  const [search, setSearch] = useState('')
  const ultimoScan = useRef<{ id: string; t: number }>({ id: '', t: 0 })
  const selfUrl = typeof window !== 'undefined' && ensayoId ? `${window.location.origin}/asistencia/${ensayoId}` : ''

  useEffect(() => {
    if (profile && profile.role !== 'admin' && profile.role !== 'director') router.replace('/dashboard')
  }, [profile, router])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [e, r] = await Promise.all([getAllEnsayos(), getAllIntegrantes()])
      setEnsayos((e as unknown as EnsayoLite[]).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')))
      setRoster(r)
    } catch { toast.error('Error al cargar') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!ensayoId) { setPresentes({}); return }
    getAsistencia(ensayoId).then(setPresentes).catch(() => setPresentes({}))
  }, [ensayoId])

  // Refresca mientras se muestra el QR o el escáner (para ver auto-registros)
  useEffect(() => {
    if (!ensayoId || !(showQr || scanning)) return
    const t = setInterval(() => { getAsistencia(ensayoId).then(setPresentes).catch(() => {}) }, 15000)
    return () => clearInterval(t)
  }, [ensayoId, showQr, scanning])

  const rosterById = useMemo(() => new Map(roster.map(i => [i.id, i])), [roster])
  const totalPresentes = Object.keys(presentes).length

  const marcar = useCallback(async (i: IntegranteBase, via: 'qr' | 'manual') => {
    if (!ensayoId) { toast.error('Primero selecciona un ensayo'); return }
    if (presentes[i.id]) return
    const nombre = `${i.nombre} ${i.apellidos}`.trim()
    setPresentes(p => ({ ...p, [i.id]: { nombre, en: new Date().toISOString(), via } }))
    setUltimo(nombre)
    try { await marcarAsistencia(ensayoId, i.id, nombre, via) }
    catch { toast.error('No se pudo guardar'); setPresentes(p => { const n = { ...p }; delete n[i.id]; return n }) }
  }, [ensayoId, presentes])

  const quitar = async (id: string) => {
    setPresentes(p => { const n = { ...p }; delete n[id]; return n })
    try { await quitarAsistencia(ensayoId, id) } catch { toast.error('No se pudo quitar') }
  }

  const onScan = useCallback((text: string) => {
    const m = text.match(/ID:\s*([^\s]+)/)
    const id = m?.[1]
    if (!id) return
    // Anti-rebote: mismo QR en menos de 3s se ignora
    const now = Date.now()
    if (ultimoScan.current.id === id && now - ultimoScan.current.t < 3000) return
    ultimoScan.current = { id, t: now }
    const i = rosterById.get(id)
    if (!i) { toast.error('QR no reconocido en el roster'); return }
    if (presentes[id]) { toast.info(`${i.nombre} ya estaba marcado`); return }
    marcar(i, 'qr')
    toast.success(`✓ ${i.nombre} ${i.apellidos}`)
  }, [rosterById, presentes, marcar])

  const lista = useMemo(() => {
    const q = norm(search.trim())
    return roster.filter(i => !q || norm(`${i.nombre} ${i.apellidos} ${getSeccion(i.seccion)?.label ?? ''}`).includes(q))
  }, [roster, search])

  const exportar = () => {
    const ids = Object.keys(presentes)
    if (!ids.length) { toast.info('Aún no hay asistentes'); return }
    const ens = ensayos.find(e => e.id === ensayoId)
    descargarCSV(`asistencia-${norm(ens?.title ?? 'ensayo').replace(/\s+/g, '-')}-${ens?.date ?? ''}`,
      ['Apellidos', 'Nombre', 'Sección', 'Hora de marca', 'Vía'],
      ids.map(id => {
        const i = rosterById.get(id); const p = presentes[id]
        return [
          i?.apellidos ?? '', i?.nombre ?? p.nombre, getSeccion(i?.seccion)?.label ?? i?.seccion ?? '',
          new Date(p.en).toLocaleString('es-CO'), p.via === 'qr' ? 'QR' : p.via === 'auto' ? 'Auto-registro' : 'Manual',
        ]
      }))
    toast.success(`Asistencia de ${ids.length} exportada`)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-navy text-2xl font-bold uppercase tracking-wider flex items-center gap-2"><ClipboardCheck size={22} className="text-royal" /> Asistencia a ensayos</h1>
        <p className="text-gray-400 text-sm mt-1">Escanea el carné (QR) de cada integrante o márcalo a mano. Se guarda por ensayo.</p>
      </div>

      <Tabs tabs={VISTAS} activeTab={vista} onChange={v => setVista(v as 'tomar' | 'reportes')} className="justify-start mb-6" />

      {vista === 'reportes' ? <ReportesAsistencia /> : (
      <>
      {/* Selección de ensayo */}
      <div className="card p-4 mb-5">
        <label className="block text-xs font-semibold text-dark mb-1">Ensayo</label>
        <select value={ensayoId} onChange={e => setEnsayoId(e.target.value)} className="input">
          <option value="">— Selecciona un ensayo —</option>
          {ensayos.map(e => <option key={e.id} value={e.id}>{e.date} · {e.title}{e.startTime ? ` (${e.startTime})` : ''}</option>)}
        </select>
        {loading && <p className="text-xs text-gray-400 mt-2">Cargando ensayos...</p>}
      </div>

      {ensayoId && (
        <>
          {/* Stats + acciones */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="bg-white border border-gray-100 rounded-xl px-4 py-2.5">
              <span className="font-display text-2xl font-bold text-green-600">{totalPresentes}</span>
              <span className="text-xs text-gray-400 ml-1.5">de {roster.length} presentes</span>
            </div>
            <button onClick={() => { setScanning(s => !s); setKiosco(false) }} className={cn('btn btn-md', scanning ? 'btn-ghost text-red-500' : 'btn-primary')}>
              {scanning ? <><CameraOff size={16} /> Detener cámara</> : <><QrCode size={16} /> Escanear QR</>}
            </button>
            <button onClick={() => { setKiosco(true); setScanning(true) }} className="btn btn-ghost btn-md">
              <MonitorSmartphone size={16} /> Modo kiosco
            </button>
            <button onClick={() => setShowQr(true)} className="btn btn-ghost btn-md">
              <ScanLine size={16} /> QR del ensayo
            </button>
            <button onClick={exportar} className="btn btn-ghost btn-md ml-auto"><FileDown size={15} /> Exportar</button>
          </div>

          {/* Escáner */}
          {scanning && (
            <div className={cn('card p-4 mb-5', kiosco && 'border-2 border-royal')}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm text-royal"><Camera size={15} /> {kiosco ? 'Modo kiosco: cada integrante pasa su carné' : 'Apunta al código QR del carné del integrante'}</div>
                {kiosco && <button onClick={() => { setKiosco(false); setScanning(false) }} className="text-xs text-red-500 hover:underline">Salir del kiosco</button>}
              </div>
              <div className={cn('mx-auto', kiosco ? 'max-w-md' : 'max-w-sm')}>
                <QrScanner onScan={onScan} onError={() => toast.error('No se pudo iniciar la cámara. Revisa los permisos.')} />
              </div>
              {kiosco && (
                <div className="mt-4 text-center">
                  {ultimo ? (
                    <div className="inline-flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-6 py-4">
                      <CheckCircle2 size={32} className="text-green-600" />
                      <div className="text-left">
                        <p className="text-[11px] uppercase tracking-wide text-green-600 font-bold">Último registrado</p>
                        <p className="font-serif font-bold text-navy text-xl leading-tight">{ultimo}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Esperando el primer carné…</p>
                  )}
                  <p className="text-2xl font-display font-bold text-navy mt-3">{totalPresentes} <span className="text-sm text-gray-400 font-sans">presentes</span></p>
                </div>
              )}
            </div>
          )}

          {/* Roster */}
          <div className="relative mb-3">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" placeholder="Buscar para marcar a mano..." />
          </div>
          <div className="space-y-1.5">
            {lista.map(i => {
              const p = presentes[i.id]
              return (
                <div key={i.id} className={cn('flex items-center gap-3 border rounded-xl p-3', p ? 'border-green-200 bg-green-50/60' : 'border-gray-100 bg-white')}>
                  <div className="w-9 h-9 rounded-full bg-royal/10 flex items-center justify-center text-royal text-sm font-bold shrink-0">{(i.nombre[0] ?? '?').toUpperCase()}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-dark truncate">{i.nombre} {i.apellidos}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {getSeccion(i.seccion)?.label ?? i.seccion}
                      {p && <span className="text-green-600"> · {p.via === 'qr' ? 'QR' : p.via === 'auto' ? 'auto-registro' : 'manual'} {new Date(p.en).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>}
                    </p>
                  </div>
                  {p ? (
                    <button onClick={() => quitar(i.id)} className="btn btn-ghost btn-sm text-red-500 shrink-0"><X size={13} /> Quitar</button>
                  ) : (
                    <button onClick={() => marcar(i, 'manual')} className="btn btn-primary btn-sm shrink-0"><CheckCircle2 size={13} /> Presente</button>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {!ensayoId && !loading && (
        <div className="card text-center py-14 text-gray-400">
          <Users2 size={34} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Selecciona un ensayo para empezar a tomar asistencia.</p>
        </div>
      )}

      {/* QR del ensayo para auto-registro */}
      {showQr && (
        <div className="fixed inset-0 z-[999] bg-black/70 flex items-center justify-center p-4" onClick={() => setShowQr(false)}>
          <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-navy px-5 py-4 flex items-center justify-between">
              <p className="font-serif font-bold text-white">Auto-registro de asistencia</p>
              <button onClick={() => setShowQr(false)} className="text-white/70 hover:text-white"><X size={18} /></button>
            </div>
            <div className="p-6 text-center">
              <p className="text-sm text-gray-500 mb-4">Proyecta o muestra este código. Cada integrante lo escanea con su celular y marca su propia asistencia.</p>
              <div className="bg-white border-4 border-navy rounded-2xl p-4 inline-block">
                {selfUrl && <QRCodeSVG value={selfUrl} size={220} level="M" fgColor="#0a1a3f" />}
              </div>
              <p className="text-[11px] text-gray-400 mt-4 break-all">{selfUrl}</p>
              <p className="text-xs text-gray-500 mt-2">Los que se registren aparecen automáticamente en la lista (se actualiza sola).</p>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  )
}
