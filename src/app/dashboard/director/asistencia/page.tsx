'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ClipboardCheck, QrCode, Search, Camera, CameraOff, CheckCircle2, X, FileDown, Users2,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
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
  const [scanning, setScanning] = useState(false)
  const [search, setSearch] = useState('')
  const ultimoScan = useRef<{ id: string; t: number }>({ id: '', t: 0 })

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

  const rosterById = useMemo(() => new Map(roster.map(i => [i.id, i])), [roster])
  const totalPresentes = Object.keys(presentes).length

  const marcar = useCallback(async (i: IntegranteBase, via: 'qr' | 'manual') => {
    if (!ensayoId) { toast.error('Primero selecciona un ensayo'); return }
    if (presentes[i.id]) return
    setPresentes(p => ({ ...p, [i.id]: { nombre: `${i.nombre} ${i.apellidos}`.trim(), en: new Date().toISOString(), via } }))
    try { await marcarAsistencia(ensayoId, i.id, `${i.nombre} ${i.apellidos}`.trim(), via) }
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
          new Date(p.en).toLocaleString('es-CO'), p.via === 'qr' ? 'QR' : 'Manual',
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
            <button onClick={() => setScanning(s => !s)} className={cn('btn btn-md', scanning ? 'btn-ghost text-red-500' : 'btn-primary')}>
              {scanning ? <><CameraOff size={16} /> Detener cámara</> : <><QrCode size={16} /> Escanear QR</>}
            </button>
            <button onClick={exportar} className="btn btn-ghost btn-md ml-auto"><FileDown size={15} /> Exportar</button>
          </div>

          {/* Escáner */}
          {scanning && (
            <div className="card p-4 mb-5">
              <div className="flex items-center gap-2 text-sm text-royal mb-3"><Camera size={15} /> Apunta al código QR del carné del integrante</div>
              <div className="max-w-sm mx-auto">
                <QrScanner onScan={onScan} onError={() => toast.error('No se pudo iniciar la cámara. Revisa los permisos.')} />
              </div>
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
                      {p && <span className="text-green-600"> · {p.via === 'qr' ? 'QR' : 'manual'} {new Date(p.en).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>}
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
    </div>
  )
}
