'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import {
  Search, Send, MessageCircle, CheckCircle2, Clock, Circle, XCircle,
  X, PenLine, FileDown, ShieldCheck, Package, Ruler, Users2, Boxes,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getAllIntegrantes, setPrendaTiene, solicitarConfirmacionPrenda,
  getPrendaFirma, setPrendaInventario, type IntegranteBase,
} from '@/lib/firebase'
import { FAMILIAS, getSeccion, type FamiliaKey } from '@/lib/secciones'
import { descargarCSV } from '@/lib/integrantes-utils'
import { descargarConstancia } from '@/lib/constancia'
import { cn } from '@/lib/utils'
import type { PrendaKey } from '@/types'

const norm = (s: string) => (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

type EstadoFilter = 'all' | 'tiene' | 'confirmada' | 'solicitada' | 'no_tiene' | 'sin'
type EstadoPrenda = 'sin_registrar' | 'solicitada' | 'confirmada' | 'no_tiene'

export interface PrendaConfig {
  prenda:      PrendaKey
  titulo:      string   // "Chaquetas"
  singular:    string   // "chaqueta"
  descripcion: string   // texto del hero
  mensajeItem: string   // "la chaqueta azul con blanco de la banda" (para WhatsApp)
}

function fechaLegible(iso?: string) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
  catch { return iso }
}
function fechaCorta(iso?: string) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return iso }
}

export default function PrendaPanel({ config }: { config: PrendaConfig }) {
  const { prenda } = config
  const { profile } = useAuth()

  const [items, setItems] = useState<IntegranteBase[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [fam, setFam] = useState<FamiliaKey | 'all'>('all')
  const [estado, setEstado] = useState<EstadoFilter>('all')
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [firmaModal, setFirmaModal] = useState<IntegranteBase | null>(null)
  const [invModal, setInvModal] = useState<IntegranteBase | null>(null)
  const [batchModal, setBatchModal] = useState<IntegranteBase[] | null>(null)

  const infoDe = (i: IntegranteBase) => i[prenda]
  const estadoDe = (i: IntegranteBase): EstadoPrenda => infoDe(i)?.estado ?? 'sin_registrar'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // El Color Guard no usa estas prendas: se excluye del censo.
      const todos = await getAllIntegrantes()
      setItems(todos.filter(i => i.familia !== 'colorguard'))
    }
    catch { toast.error('Error al cargar los integrantes') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  // Al cambiar de prenda (pestaña), limpia selección.
  useEffect(() => { setSel(new Set()) }, [prenda])

  const stats = useMemo(() => ({
    total: items.length,
    tiene: items.filter(i => infoDe(i)?.tiene).length,
    confirmadas: items.filter(i => estadoDe(i) === 'confirmada').length,
    solicitadas: items.filter(i => estadoDe(i) === 'solicitada').length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [items, prenda])

  const filtered = useMemo(() => {
    const q = norm(search.trim())
    return items.filter(i => {
      if (fam !== 'all' && i.familia !== fam) return false
      const e = estadoDe(i)
      if (estado === 'tiene' && !infoDe(i)?.tiene) return false
      if (estado === 'confirmada' && e !== 'confirmada') return false
      if (estado === 'solicitada' && e !== 'solicitada') return false
      if (estado === 'no_tiene' && e !== 'no_tiene') return false
      if (estado === 'sin' && (infoDe(i)?.tiene || e !== 'sin_registrar')) return false
      if (!q) return true
      return norm(`${i.nombre} ${i.apellidos} ${getSeccion(i.seccion)?.label ?? ''}`).includes(q)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, search, fam, estado, prenda])

  const patchLocal = (id: string, patch: Partial<IntegranteBase['chaqueta']>) =>
    setItems(prev => prev.map(i => i.id === id
      ? { ...i, [prenda]: { tiene: false, estado: 'sin_registrar', ...infoDe(i), ...patch } }
      : i))

  const toggleSel = (id: string) => setSel(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
  })

  const toggleTiene = async (i: IntegranteBase) => {
    if (!profile) return
    const nuevo = !infoDe(i)?.tiene
    patchLocal(i.id, { tiene: nuevo })
    try { await setPrendaTiene(i.id, prenda, nuevo, profile.uid) }
    catch { toast.error('No se pudo guardar'); patchLocal(i.id, { tiene: !nuevo }) }
  }

  const marcarSolicitada = async (i: IntegranteBase) => {
    await solicitarConfirmacionPrenda(i.id, prenda, profile!.uid, profile!.displayName || 'Administración')
    patchLocal(i.id, { estado: 'solicitada', solicitadaEn: new Date().toISOString(), solicitadaPorNombre: profile!.displayName })
  }

  const waLink = (i: IntegranteBase): string | null => {
    const tel = (i.whatsapp || '').replace(/\D/g, '')
    if (!tel) return null
    const nombre = `${i.nombre} ${i.apellidos}`.trim()
    const link = `${window.location.origin}/integrantes?tab=uniformes`
    const msg = encodeURIComponent(
      `Hola ${nombre}, desde la Guardia Real de Antioquia. Por favor confirma con tu firma si tienes ` +
      `${config.mensajeItem}. Ingresa aquí (pestaña Uniformes):\n${link}\n¡Gracias!`,
    )
    return `https://wa.me/57${tel}?text=${msg}`
  }

  const solicitar = async (i: IntegranteBase) => {
    if (!profile) return
    setBusy(i.id)
    try {
      await marcarSolicitada(i)
      toast.success(`Solicitud registrada para ${i.nombre}`)
      const link = waLink(i)
      if (link) window.open(link, '_blank', 'noopener')
      else toast.info(`${i.nombre} no tiene WhatsApp registrado; el aviso quedó en su portal.`)
    } catch { toast.error('No se pudo registrar la solicitud') }
    finally { setBusy(null) }
  }

  const solicitarLote = async () => {
    if (!profile || sel.size === 0) return
    const elegidos = items.filter(i => sel.has(i.id))
    setBusy('lote')
    try {
      for (const i of elegidos) await marcarSolicitada(i)
      toast.success(`${elegidos.length} solicitud(es) registradas`)
      setBatchModal(elegidos)   // modal con los enlaces de WhatsApp para enviar uno por uno
      setSel(new Set())
    } catch { toast.error('No se pudieron registrar todas las solicitudes') }
    finally { setBusy(null) }
  }

  const guardarInventario = async (
    i: IntegranteBase,
    patch: { numero?: string | null; entregadaEn?: string | null; devueltaEn?: string | null },
  ) => {
    await setPrendaInventario(i.id, prenda, patch, profile!.uid, profile!.displayName || 'Administración')
    // Refleja en el grid (null → undefined para el tipo local).
    const local: Partial<IntegranteBase['chaqueta']> = {}
    if ('numero' in patch)      local!.numero      = patch.numero ?? undefined
    if ('entregadaEn' in patch) local!.entregadaEn = patch.entregadaEn ?? undefined
    if ('devueltaEn' in patch)  local!.devueltaEn  = patch.devueltaEn ?? undefined
    patchLocal(i.id, local)
  }

  const exportCSV = () => {
    descargarCSV(`control-${prenda}s`,
      ['Apellidos', 'Nombre', 'Sección', `Tiene ${config.singular}`, 'Estado', 'Talla', 'N.º prenda', 'Entregada', 'Devuelta', 'Solicitada', 'Confirmada', 'Firmó como'],
      items.map(i => {
        const c = infoDe(i)
        const e = estadoDe(i)
        return [
          i.apellidos, i.nombre, getSeccion(i.seccion)?.label ?? i.seccion,
          c?.tiene ? 'Sí' : 'No',
          e === 'confirmada' ? 'Confirmada' : e === 'solicitada' ? 'Solicitada' : e === 'no_tiene' ? 'Respondió que no' : 'Sin registrar',
          c?.talla ?? '', c?.numero ?? '', fechaCorta(c?.entregadaEn), fechaCorta(c?.devueltaEn),
          fechaLegible(c?.solicitadaEn), fechaLegible(c?.confirmadaEn), c?.firmaNombre ?? '',
        ]
      }))
    toast.success(`Censo de ${config.titulo.toLowerCase()} descargado`)
  }

  return (
    <div>
      {/* Encabezado con marca */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy to-[#0a2350] p-6 sm:p-7 mb-6">
        <div className="absolute -right-6 -bottom-6 opacity-10"><Image src="/images/escudo.png" alt="" width={150} height={150} /></div>
        <div className="absolute right-4 top-4 opacity-90 hidden sm:block"><Image src="/images/mascota.png" alt="" width={64} height={64} className="drop-shadow-lg" /></div>
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-gold/15 border border-gold/30 text-gold text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
            👕 Control de uniformes
          </div>
          <h2 className="font-display text-white text-2xl font-bold uppercase tracking-wider">{config.titulo}</h2>
          <p className="text-gray-300 text-sm mt-1 max-w-lg">{config.descripcion}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Stat icon={CheckCircle2} label={`Con ${config.singular}`} value={stats.tiene} color="text-green-600" />
        <Stat icon={PenLine} label="Confirmadas con firma" value={stats.confirmadas} color="text-royal" />
        <Stat icon={Clock} label="Solicitudes pendientes" value={stats.solicitadas} color="text-amber-600" />
        <Stat icon={Circle} label="Integrantes" value={stats.total} color="text-navy" />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" placeholder="Buscar por nombre o sección..." />
        </div>
        <select value={fam} onChange={e => setFam(e.target.value as FamiliaKey | 'all')} className="input max-w-[190px]">
          <option value="all">Todas las familias</option>
          {(Object.keys(FAMILIAS) as FamiliaKey[]).filter(fk => fk !== 'colorguard').map(fk => <option key={fk} value={fk}>{FAMILIAS[fk].emoji} {FAMILIAS[fk].label}</option>)}
        </select>
        <select value={estado} onChange={e => setEstado(e.target.value as EstadoFilter)} className="input max-w-[190px]">
          <option value="all">Todos los estados</option>
          <option value="tiene">Con {config.singular}</option>
          <option value="confirmada">Confirmadas con firma</option>
          <option value="solicitada">Solicitud pendiente</option>
          <option value="no_tiene">Respondió que no</option>
          <option value="sin">Sin registrar</option>
        </select>
        <button onClick={exportCSV} className="btn btn-ghost btn-sm"><FileDown size={14} /> Exportar</button>
      </div>

      {/* Barra de selección múltiple */}
      {sel.size > 0 && (
        <div className="flex items-center gap-3 mb-3 px-4 py-2.5 bg-royal/10 border border-royal/20 rounded-xl">
          <span className="text-sm font-semibold text-royal">{sel.size} seleccionado(s)</span>
          <button onClick={solicitarLote} disabled={busy === 'lote'} className="btn btn-primary btn-sm disabled:opacity-60">
            <Users2 size={13} /> {busy === 'lote' ? 'Enviando...' : 'Solicitar confirmación'}
          </button>
          <button onClick={() => setSel(new Set())} className="text-xs text-gray-500 hover:text-navy ml-auto">Limpiar selección</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="w-7 h-7 border-2 border-royal/30 border-t-royal rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-14 text-gray-400 text-sm">Sin resultados.</div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-xs text-gray-400">Mostrando <strong className="text-gray-600">{filtered.length}</strong> de {items.length}</p>
            <button
              onClick={() => setSel(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(i => i.id)))}
              className="text-xs text-royal hover:underline">
              {sel.size === filtered.length ? 'Quitar todos' : 'Seleccionar todos'}
            </button>
          </div>
          {filtered.map(i => {
            const e = estadoDe(i)
            const c = infoDe(i)
            const sec = getSeccion(i.seccion)
            return (
              <div key={i.id} className={cn('flex items-center gap-2.5 bg-white border rounded-xl p-3', sel.has(i.id) ? 'border-royal/40 bg-royal/5' : 'border-gray-100')}>
                {/* Selección para lote */}
                <input type="checkbox" checked={sel.has(i.id)} onChange={() => toggleSel(i.id)} title="Seleccionar para solicitar en lote"
                  className="w-4 h-4 accent-royal shrink-0" />
                {/* Tiene la prenda */}
                <label className="flex items-center shrink-0 cursor-pointer" title={`Tiene ${config.singular}`}>
                  <input type="checkbox" checked={!!c?.tiene} onChange={() => toggleTiene(i)} className="w-5 h-5 accent-green-600" />
                </label>
                {i.fotoURL ? (
                  <Image src={i.fotoURL} alt="" width={36} height={36} className="rounded-full w-9 h-9 object-cover shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-royal/10 flex items-center justify-center text-royal text-sm font-bold shrink-0">{(i.nombre[0] ?? '?').toUpperCase()}</div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-dark truncate">{i.nombre} {i.apellidos}</p>
                  <p className="text-xs text-gray-400 truncate flex items-center gap-1.5">
                    {sec?.label ?? i.seccion}
                    {c?.talla && <span className="inline-flex items-center gap-0.5 text-[10px] bg-navy/8 text-navy rounded-full px-1.5 py-0.5"><Ruler size={9} /> {c.talla}</span>}
                    {c?.numero && <span className="inline-flex items-center gap-0.5 text-[10px] bg-navy/8 text-navy rounded-full px-1.5 py-0.5"><Package size={9} /> #{c.numero}</span>}
                    {c?.entregadaEn && !c?.devueltaEn && <span className="text-[10px] bg-blue-100 text-blue-600 rounded-full px-1.5 py-0.5">Entregada</span>}
                    {c?.devueltaEn && <span className="text-[10px] bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5">Devuelta</span>}
                  </p>
                </div>

                <EstadoChip estado={e} />

                <button onClick={() => setInvModal(i)} title="Inventario / entrega" className="w-8 h-8 rounded-lg text-navy hover:bg-navy/10 flex items-center justify-center shrink-0">
                  <Boxes size={15} />
                </button>

                {e === 'confirmada' ? (
                  <button onClick={() => setFirmaModal(i)} className="btn btn-ghost btn-sm text-royal shrink-0">
                    <PenLine size={13} /> Ver firma
                  </button>
                ) : (
                  <button onClick={() => solicitar(i)} disabled={busy === i.id} className="btn btn-ghost btn-sm shrink-0 disabled:opacity-50">
                    {i.whatsapp ? <MessageCircle size={13} /> : <Send size={13} />}
                    {busy === i.id ? '...' : e === 'solicitada' ? 'Reenviar' : e === 'no_tiene' ? 'Volver a preguntar' : 'Solicitar'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {firmaModal && <FirmaModal integrante={firmaModal} prenda={prenda} onClose={() => setFirmaModal(null)} />}
      {invModal && <InventarioModal integrante={invModal} prenda={prenda} singular={config.singular} onGuardar={guardarInventario} onClose={() => setInvModal(null)} />}
      {batchModal && <BatchModal integrantes={batchModal} waLink={waLink} onClose={() => setBatchModal(null)} />}
    </div>
  )
}

function EstadoChip({ estado }: { estado: EstadoPrenda }) {
  if (estado === 'confirmada') return <span className="text-[10px] bg-green-100 text-green-700 rounded-full px-2 py-1 font-medium flex items-center gap-1 shrink-0"><CheckCircle2 size={11} /> Confirmada</span>
  if (estado === 'solicitada') return <span className="text-[10px] bg-amber-100 text-amber-700 rounded-full px-2 py-1 font-medium flex items-center gap-1 shrink-0"><Clock size={11} /> Solicitada</span>
  if (estado === 'no_tiene')   return <span className="text-[10px] bg-red-100 text-red-600 rounded-full px-2 py-1 font-medium flex items-center gap-1 shrink-0"><XCircle size={11} /> No la tiene</span>
  return <span className="text-[10px] bg-gray-100 text-gray-400 rounded-full px-2 py-1 font-medium flex items-center gap-1 shrink-0"><Circle size={11} /> Sin registrar</span>
}

function FirmaModal({ integrante, prenda, onClose }: { integrante: IntegranteBase; prenda: PrendaKey; onClose: () => void }) {
  const [firma, setFirma] = useState<string | null | 'loading'>('loading')
  useEffect(() => { getPrendaFirma(integrante.id, prenda).then(setFirma).catch(() => setFirma(null)) }, [integrante.id, prenda])
  const c = integrante[prenda]

  return (
    <div className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-navy px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <ShieldCheck size={18} className="text-gold" />
            <div>
              <p className="font-serif font-bold leading-tight">{integrante.nombre} {integrante.apellidos}</p>
              <p className="text-gray-300 text-xs">Confirmación de {prenda === 'kepis' ? 'kepis' : 'chaqueta'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Info label="Firmó como" value={c?.firmaNombre ?? '—'} />
            <Info label="Talla" value={c?.talla ?? '—'} />
            <Info label="Fecha y hora" value={c?.confirmadaEn ? fechaLegible(c.confirmadaEn) : '—'} />
            <Info label="Solicitada por" value={c?.solicitadaPorNombre ?? '—'} />
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
          <button
            onClick={() => descargarConstancia({
              nombre: `${integrante.nombre} ${integrante.apellidos}`.trim(),
              seccion: getSeccion(integrante.seccion)?.label ?? integrante.seccion,
              prenda, talla: c?.talla, numero: c?.numero,
              firmaDataUrl: typeof firma === 'string' ? firma : null,
              confirmadaEn: c?.confirmadaEn, solicitadaPorNombre: c?.solicitadaPorNombre,
            })}
            className="btn btn-primary btn-md w-full">
            <FileDown size={15} /> Descargar constancia (PDF)
          </button>
        </div>
      </div>
    </div>
  )
}

function InventarioModal({ integrante, prenda, singular, onGuardar, onClose }: {
  integrante: IntegranteBase; prenda: PrendaKey; singular: string
  onGuardar: (i: IntegranteBase, patch: { numero?: string | null; entregadaEn?: string | null; devueltaEn?: string | null }) => Promise<void>
  onClose: () => void
}) {
  const c = integrante[prenda]
  const [numero, setNumero] = useState(c?.numero ?? '')
  const [entregadaEn, setEntregadaEn] = useState<string | null>(c?.entregadaEn ?? null)
  const [devueltaEn, setDevueltaEn] = useState<string | null>(c?.devueltaEn ?? null)
  const [guardando, setGuardando] = useState(false)

  const accion = async (patch: { numero?: string | null; entregadaEn?: string | null; devueltaEn?: string | null }) => {
    setGuardando(true)
    try {
      await onGuardar(integrante, patch)
      if ('entregadaEn' in patch) setEntregadaEn(patch.entregadaEn ?? null)
      if ('devueltaEn' in patch)  setDevueltaEn(patch.devueltaEn ?? null)
      toast.success('Inventario actualizado')
    }
    catch { toast.error('No se pudo guardar') }
    finally { setGuardando(false) }
  }

  return (
    <div className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-navy px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Boxes size={18} className="text-gold" />
            <div>
              <p className="font-serif font-bold leading-tight">{integrante.nombre} {integrante.apellidos}</p>
              <p className="text-gray-300 text-xs">Inventario de {singular}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* Número físico */}
          <div>
            <label className="block text-xs font-semibold text-dark mb-1">N.º de la prenda física</label>
            <div className="flex gap-2">
              <input className="input" value={numero} onChange={e => setNumero(e.target.value)} placeholder="Ej: 042" />
              <button onClick={() => accion({ numero: numero.trim() || null })} disabled={guardando} className="btn btn-ghost btn-sm shrink-0">Guardar n.º</button>
            </div>
          </div>

          {/* Entrega */}
          <div className="rounded-xl border border-gray-100 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-dark">Entrega</p>
                <p className="text-xs text-gray-400">{entregadaEn ? `Entregada el ${fechaLegible(entregadaEn)}` : 'Aún no entregada'}</p>
              </div>
              {entregadaEn ? (
                <button onClick={() => accion({ entregadaEn: null })} disabled={guardando} className="btn btn-ghost btn-sm text-red-500">Quitar</button>
              ) : (
                <button onClick={() => accion({ entregadaEn: new Date().toISOString() })} disabled={guardando} className="btn btn-primary btn-sm">Marcar entregada</button>
              )}
            </div>
          </div>

          {/* Devolución */}
          <div className="rounded-xl border border-gray-100 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-dark">Devolución</p>
                <p className="text-xs text-gray-400">{devueltaEn ? `Devuelta el ${fechaLegible(devueltaEn)}` : 'Aún no devuelta'}</p>
              </div>
              {devueltaEn ? (
                <button onClick={() => accion({ devueltaEn: null })} disabled={guardando} className="btn btn-ghost btn-sm text-red-500">Quitar</button>
              ) : (
                <button onClick={() => accion({ devueltaEn: new Date().toISOString() })} disabled={guardando} className="btn btn-ghost btn-sm">Marcar devuelta</button>
              )}
            </div>
          </div>

          {/* Historial */}
          <Historial eventos={c?.historial} />
        </div>
      </div>
    </div>
  )
}

const EVENTO_LABEL: Record<string, string> = {
  solicitada: 'Se solicitó confirmación',
  confirmada: 'Confirmó y firmó',
  no_tiene: 'Respondió que no la tiene',
  entregada: 'Se marcó entregada',
  devuelta: 'Se marcó devuelta',
  entrega_anulada: 'Se anuló la entrega',
  devolucion_anulada: 'Se anuló la devolución',
}

function Historial({ eventos }: { eventos?: { tipo: string; en: string; por?: string }[] }) {
  if (!eventos || eventos.length === 0) return null
  const orden = [...eventos].sort((a, b) => (b.en ?? '').localeCompare(a.en ?? ''))
  return (
    <div>
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Historial</p>
      <ol className="relative border-l border-gray-200 ml-1 space-y-3">
        {orden.map((e, idx) => (
          <li key={idx} className="ml-4">
            <span className="absolute -left-[5px] w-2.5 h-2.5 rounded-full bg-royal" />
            <p className="text-sm text-dark leading-tight">{EVENTO_LABEL[e.tipo] ?? e.tipo}</p>
            <p className="text-[11px] text-gray-400">{fechaLegible(e.en)}{e.por ? ` · ${e.por}` : ''}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}

function BatchModal({ integrantes, waLink, onClose }: {
  integrantes: IntegranteBase[]; waLink: (i: IntegranteBase) => string | null; onClose: () => void
}) {
  const conWa = integrantes.filter(i => waLink(i))
  const sinWa = integrantes.filter(i => !waLink(i))
  return (
    <div className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-navy px-5 py-4 flex items-center justify-between">
          <div className="text-white">
            <p className="font-serif font-bold">Enviar por WhatsApp</p>
            <p className="text-gray-300 text-xs">La solicitud ya quedó registrada. Toca cada uno para enviarle el mensaje.</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-4 space-y-1.5">
          {conWa.map(i => (
            <a key={i.id} href={waLink(i)!} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 hover:border-[#25D366] hover:bg-[#25D366]/5 transition-colors">
              <div className="w-8 h-8 rounded-full bg-[#25D366]/10 text-[#1ebd5a] flex items-center justify-center shrink-0"><MessageCircle size={15} /></div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-dark truncate">{i.nombre} {i.apellidos}</p>
                <p className="text-xs text-gray-400">{i.whatsapp}</p>
              </div>
              <span className="text-xs text-[#1ebd5a] font-semibold shrink-0">Enviar →</span>
            </a>
          ))}
          {sinWa.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-[11px] text-gray-400 mb-1">Sin WhatsApp registrado (el aviso quedó en su portal):</p>
              {sinWa.map(i => <p key={i.id} className="text-sm text-gray-500">{i.nombre} {i.apellidos}</p>)}
            </div>
          )}
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
