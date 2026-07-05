'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Shirt, Search, Send, MessageCircle, CheckCircle2, Clock, Circle,
  X, PenLine, FileDown, ShieldCheck,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getAllIntegrantes, setChaquetaTiene, solicitarConfirmacionChaqueta,
  getChaquetaFirma, type IntegranteBase,
} from '@/lib/firebase'
import { FAMILIAS, getSeccion, type FamiliaKey } from '@/lib/secciones'
import { descargarCSV } from '@/lib/integrantes-utils'
import { cn } from '@/lib/utils'

const norm = (s: string) => (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

type EstadoFilter = 'all' | 'tiene' | 'confirmada' | 'solicitada' | 'sin'

function estadoDe(i: IntegranteBase): 'sin_registrar' | 'solicitada' | 'confirmada' {
  return i.chaqueta?.estado ?? 'sin_registrar'
}

function fechaLegible(iso?: string) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
  catch { return iso }
}

export default function UniformesAdminPage() {
  const { profile } = useAuth()
  const router = useRouter()

  const [items, setItems] = useState<IntegranteBase[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [fam, setFam] = useState<FamiliaKey | 'all'>('all')
  const [estado, setEstado] = useState<EstadoFilter>('all')
  const [firmaModal, setFirmaModal] = useState<IntegranteBase | null>(null)

  useEffect(() => {
    if (profile && profile.role !== 'admin') router.replace('/dashboard')
  }, [profile, router])

  const load = useCallback(async () => {
    setLoading(true)
    try { setItems(await getAllIntegrantes()) }
    catch { toast.error('Error al cargar los integrantes') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const stats = useMemo(() => ({
    total: items.length,
    tiene: items.filter(i => i.chaqueta?.tiene).length,
    confirmadas: items.filter(i => estadoDe(i) === 'confirmada').length,
    solicitadas: items.filter(i => estadoDe(i) === 'solicitada').length,
  }), [items])

  const filtered = useMemo(() => {
    const q = norm(search.trim())
    return items.filter(i => {
      if (fam !== 'all' && i.familia !== fam) return false
      const e = estadoDe(i)
      if (estado === 'tiene' && !i.chaqueta?.tiene) return false
      if (estado === 'confirmada' && e !== 'confirmada') return false
      if (estado === 'solicitada' && e !== 'solicitada') return false
      if (estado === 'sin' && (i.chaqueta?.tiene || e !== 'sin_registrar')) return false
      if (!q) return true
      return norm(`${i.nombre} ${i.apellidos} ${getSeccion(i.seccion)?.label ?? ''}`).includes(q)
    })
  }, [items, search, fam, estado])

  // Actualiza una ficha en memoria sin recargar toda la lista.
  const patchLocal = (id: string, patch: Partial<IntegranteBase['chaqueta']>) =>
    setItems(prev => prev.map(i => i.id === id
      ? { ...i, chaqueta: { tiene: false, estado: 'sin_registrar', ...i.chaqueta, ...patch } as IntegranteBase['chaqueta'] }
      : i))

  const toggleTiene = async (i: IntegranteBase) => {
    if (!profile) return
    const nuevo = !i.chaqueta?.tiene
    patchLocal(i.id, { tiene: nuevo })
    try { await setChaquetaTiene(i.id, nuevo, profile.uid) }
    catch { toast.error('No se pudo guardar'); patchLocal(i.id, { tiene: !nuevo }) }
  }

  const solicitar = async (i: IntegranteBase) => {
    if (!profile) return
    setBusy(i.id)
    try {
      await solicitarConfirmacionChaqueta(i.id, profile.uid, profile.displayName || 'Administración')
      patchLocal(i.id, { estado: 'solicitada', solicitadaEn: new Date().toISOString(), solicitadaPorNombre: profile.displayName })
      toast.success(`Solicitud registrada para ${i.nombre}`)
      // Empuje por WhatsApp si hay número
      const tel = (i.whatsapp || '').replace(/\D/g, '')
      if (tel) {
        const msg = encodeURIComponent(
          `Hola ${i.nombre}, desde la Guardia Real de Antioquia. Por favor ingresa a tu portal de integrantes ` +
          `(pestaña Uniformes) y confirma con tu firma si tienes la chaqueta azul con blanco de la banda. ¡Gracias!`,
        )
        window.open(`https://wa.me/57${tel}?text=${msg}`, '_blank', 'noopener')
      } else {
        toast.info(`${i.nombre} no tiene WhatsApp registrado; el aviso quedó en su portal.`)
      }
    } catch { toast.error('No se pudo registrar la solicitud') }
    finally { setBusy(null) }
  }

  const exportCSV = () => {
    descargarCSV('control-chaquetas',
      ['Apellidos', 'Nombre', 'Sección', 'Tiene chaqueta', 'Estado', 'Solicitada', 'Confirmada', 'Firmó como'],
      items.map(i => {
        const c = i.chaqueta
        const e = estadoDe(i)
        return [
          i.apellidos, i.nombre, getSeccion(i.seccion)?.label ?? i.seccion,
          c?.tiene ? 'Sí' : 'No',
          e === 'confirmada' ? 'Confirmada' : e === 'solicitada' ? 'Solicitada' : 'Sin registrar',
          fechaLegible(c?.solicitadaEn), fechaLegible(c?.confirmadaEn), c?.firmaNombre ?? '',
        ]
      }))
    toast.success('Censo de chaquetas descargado')
  }

  return (
    <div>
      {/* Encabezado con marca */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy to-[#0a2350] p-6 sm:p-7 mb-6">
        <div className="absolute -right-6 -bottom-6 opacity-10"><Image src="/images/escudo.png" alt="" width={150} height={150} /></div>
        <div className="absolute right-4 top-4 opacity-90 hidden sm:block"><Image src="/images/mascota.png" alt="" width={64} height={64} className="drop-shadow-lg" /></div>
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-gold/15 border border-gold/30 text-gold text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
            <Shirt size={12} /> Control de uniformes
          </div>
          <h1 className="font-display text-white text-2xl font-bold uppercase tracking-wider">Chaquetas</h1>
          <p className="text-gray-300 text-sm mt-1 max-w-lg">
            Censo de quién tiene la chaqueta. Marca en persona, y cuando no puedas, solicita al
            integrante que confirme y firme desde su portal.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Stat icon={Shirt} label="Integrantes" value={stats.total} color="text-navy" />
        <Stat icon={CheckCircle2} label="Con chaqueta" value={stats.tiene} color="text-green-600" />
        <Stat icon={PenLine} label="Confirmadas con firma" value={stats.confirmadas} color="text-royal" />
        <Stat icon={Clock} label="Solicitudes pendientes" value={stats.solicitadas} color="text-amber-600" />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" placeholder="Buscar por nombre o sección..." />
        </div>
        <select value={fam} onChange={e => setFam(e.target.value as FamiliaKey | 'all')} className="input max-w-[190px]">
          <option value="all">Todas las familias</option>
          {(Object.keys(FAMILIAS) as FamiliaKey[]).map(fk => <option key={fk} value={fk}>{FAMILIAS[fk].emoji} {FAMILIAS[fk].label}</option>)}
        </select>
        <select value={estado} onChange={e => setEstado(e.target.value as EstadoFilter)} className="input max-w-[190px]">
          <option value="all">Todos los estados</option>
          <option value="tiene">Con chaqueta</option>
          <option value="confirmada">Confirmadas con firma</option>
          <option value="solicitada">Solicitud pendiente</option>
          <option value="sin">Sin registrar</option>
        </select>
        <button onClick={exportCSV} className="btn btn-ghost btn-sm"><FileDown size={14} /> Exportar</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="w-7 h-7 border-2 border-royal/30 border-t-royal rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-14 text-gray-400 text-sm">Sin resultados.</div>
      ) : (
        <div className="space-y-1.5">
          <p className="text-xs text-gray-400 mb-1">Mostrando <strong className="text-gray-600">{filtered.length}</strong> de {items.length}</p>
          {filtered.map(i => {
            const e = estadoDe(i)
            const sec = getSeccion(i.seccion)
            return (
              <div key={i.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-3">
                {/* Checkbox "tiene" */}
                <label className="flex items-center shrink-0 cursor-pointer" title="Tiene la chaqueta">
                  <input type="checkbox" checked={!!i.chaqueta?.tiene} onChange={() => toggleTiene(i)} className="w-5 h-5 accent-green-600" />
                </label>
                {i.fotoURL ? (
                  <Image src={i.fotoURL} alt="" width={36} height={36} className="rounded-full w-9 h-9 object-cover shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-royal/10 flex items-center justify-center text-royal text-sm font-bold shrink-0">{(i.nombre[0] ?? '?').toUpperCase()}</div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-dark truncate">{i.nombre} {i.apellidos}</p>
                  <p className="text-xs text-gray-400 truncate">{sec?.label ?? i.seccion}</p>
                </div>

                {/* Estado */}
                <EstadoChip estado={e} />

                {/* Acciones */}
                {e === 'confirmada' ? (
                  <button onClick={() => setFirmaModal(i)} className="btn btn-ghost btn-sm text-royal shrink-0">
                    <PenLine size={13} /> Ver firma
                  </button>
                ) : (
                  <button onClick={() => solicitar(i)} disabled={busy === i.id} className="btn btn-ghost btn-sm shrink-0 disabled:opacity-50">
                    {i.whatsapp ? <MessageCircle size={13} /> : <Send size={13} />}
                    {busy === i.id ? '...' : e === 'solicitada' ? 'Reenviar' : 'Solicitar'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {firmaModal && <FirmaModal integrante={firmaModal} onClose={() => setFirmaModal(null)} />}
    </div>
  )
}

function EstadoChip({ estado }: { estado: 'sin_registrar' | 'solicitada' | 'confirmada' }) {
  if (estado === 'confirmada') return <span className="text-[10px] bg-green-100 text-green-700 rounded-full px-2 py-1 font-medium flex items-center gap-1 shrink-0"><CheckCircle2 size={11} /> Confirmada</span>
  if (estado === 'solicitada') return <span className="text-[10px] bg-amber-100 text-amber-700 rounded-full px-2 py-1 font-medium flex items-center gap-1 shrink-0"><Clock size={11} /> Solicitada</span>
  return <span className="text-[10px] bg-gray-100 text-gray-400 rounded-full px-2 py-1 font-medium flex items-center gap-1 shrink-0"><Circle size={11} /> Sin registrar</span>
}

function FirmaModal({ integrante, onClose }: { integrante: IntegranteBase; onClose: () => void }) {
  const [firma, setFirma] = useState<string | null | 'loading'>('loading')
  useEffect(() => { getChaquetaFirma(integrante.id).then(setFirma).catch(() => setFirma(null)) }, [integrante.id])
  const c = integrante.chaqueta

  return (
    <div className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-navy px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <ShieldCheck size={18} className="text-gold" />
            <div>
              <p className="font-serif font-bold leading-tight">{integrante.nombre} {integrante.apellidos}</p>
              <p className="text-gray-300 text-xs">Confirmación de chaqueta</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Info label="Firmó como" value={c?.firmaNombre ?? '—'} />
            <Info label="Fecha y hora" value={c?.confirmadaEn ? fechaLegible(c.confirmadaEn) : '—'} />
            <Info label="Solicitada por" value={c?.solicitadaPorNombre ?? '—'} />
            <Info label="Solicitada el" value={c?.solicitadaEn ? fechaLegible(c.solicitadaEn) : '—'} />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">Firma</p>
            {firma === 'loading' ? (
              <div className="h-40 flex items-center justify-center border border-gray-100 rounded-xl"><div className="w-6 h-6 border-2 border-royal/30 border-t-royal rounded-full animate-spin" /></div>
            ) : firma ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={firma} alt="Firma" className="w-full border border-gray-200 rounded-xl bg-white" />
            ) : (
              <p className="text-sm text-gray-400 text-center py-8 border border-gray-100 rounded-xl">No se encontró la imagen de la firma.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[11px] text-gray-400 uppercase tracking-wide">{label}</p><p className="text-dark font-medium break-words">{value}</p></div>
}

function Stat({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return <div className="bg-white border border-gray-100 rounded-xl p-4"><Icon size={18} className={cn('mb-1', color)} /><div className={cn('font-display text-2xl font-bold', color)}>{value}</div><div className="text-xs text-gray-400 leading-tight">{label}</div></div>
}
