'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { toast } from 'sonner'
import {
  Wallet, Search, CheckCircle2, Clock, FileDown, MessageCircle, X, Coins, Tag,
  Receipt, PenLine, ImageUp, Plus, ChevronDown, ChevronUp, Trash2, PiggyBank,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getAllIntegrantes, getPagosPeriodoConcepto, setPago, deletePago,
  addAbono, getAbonosPeriodoConcepto, deleteAbono, getTotalConcepto,
  getFirmaRecibo, setFirmaRecibo, getPagosPorFecha, type IntegranteBase,
} from '@/lib/firebase'
import SignaturePad from '@/components/dashboard/SignaturePad'
import { FAMILIAS, getSeccion, type FamiliaKey } from '@/lib/secciones'
import { descargarCSV } from '@/lib/integrantes-utils'
import type { Pago } from '@/types'
import { cn } from '@/lib/utils'

const norm = (s: string) => (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const CONCEPTOS = ['Mensualidad', 'Abono viaje de México', 'Inscripción', 'Otro']

function periodoLabel(p: string) { const [y, m] = p.split('-'); return `${MESES[Number(m) - 1] ?? ''} ${y}` }
const fmtCOP = (n?: number) => n != null ? `$${n.toLocaleString('es-CO')}` : ''
// Conceptos "Abono …" admiten varios pagos independientes en el mismo mes (se suman)
const esAcumulable = (c: string) => /^abono/i.test((c ?? '').trim())

export default function PagosPanel() {
  const { profile } = useAuth()
  const [periodo, setPeriodo] = useState(new Date().toISOString().slice(0, 7))
  const [conceptoSel, setConceptoSel] = useState('Mensualidad')
  const [conceptoOtro, setConceptoOtro] = useState('')
  const concepto = conceptoSel === 'Otro' ? conceptoOtro.trim() : conceptoSel
  const [cuota, setCuota] = useState<string>('')
  const [roster, setRoster] = useState<IntegranteBase[]>([])
  const [pagos, setPagos] = useState<Record<string, Pago>>({})
  const [abonos, setAbonos] = useState<Record<string, Pago[]>>({})
  const [totalConcepto, setTotalConcepto] = useState<{ total: number; count: number } | null>(null)
  const [expandAbono, setExpandAbono] = useState<string | null>(null)
  const [abonoModal, setAbonoModal] = useState<IntegranteBase | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [fam, setFam] = useState<FamiliaKey | 'all'>('all')
  const [soloPendientes, setSoloPendientes] = useState(false)
  // Firma del recaudador (para el recibo). Se pide la primera vez.
  const [firma, setFirma] = useState<string | null>(null)
  const [firmaCargada, setFirmaCargada] = useState(false)
  const [firmaModal, setFirmaModal] = useState(false)
  const [pendienteFirma, setPendienteFirma] = useState<IntegranteBase | null>(null)
  const [pendienteAbono, setPendienteAbono] = useState<IntegranteBase | null>(null)
  const [cierreOpen, setCierreOpen] = useState(false)

  const acumulable = esAcumulable(concepto)

  useEffect(() => {
    if (!profile) return
    getFirmaRecibo(profile.uid).then(f => { setFirma(f); setFirmaCargada(true) }).catch(() => setFirmaCargada(true))
  }, [profile])

  const loadRoster = useCallback(async () => {
    try { setRoster(await getAllIntegrantes()) } catch { toast.error('Error al cargar integrantes') }
  }, [])
  useEffect(() => { loadRoster() }, [loadRoster])

  const loadPagos = useCallback(async () => {
    const c = concepto.trim()
    if (!c) return
    setLoading(true)
    try {
      if (esAcumulable(c)) {
        const [lista, total] = await Promise.all([getAbonosPeriodoConcepto(periodo, c), getTotalConcepto(c)])
        const grouped: Record<string, Pago[]> = {}
        for (const p of lista) (grouped[p.integranteId] ??= []).push(p)
        setAbonos(grouped); setTotalConcepto(total); setPagos({})
      } else {
        setPagos(await getPagosPeriodoConcepto(periodo, c)); setAbonos({}); setTotalConcepto(null)
      }
    }
    catch { toast.error('Error al cargar los pagos') }
    finally { setLoading(false) }
  }, [periodo, concepto])
  useEffect(() => { loadPagos() }, [loadPagos])

  const sumaAbonos = useCallback((id: string) => (abonos[id] ?? []).reduce((s, p) => s + (p.monto ?? 0), 0), [abonos])
  const tieneAbono = useCallback((id: string) => (abonos[id]?.length ?? 0) > 0, [abonos])

  const stats = useMemo(() => {
    if (acumulable) {
      const conAbono = roster.filter(i => tieneAbono(i.id)).length
      const recaudado = Object.values(abonos).flat().reduce((s, p) => s + (p.monto ?? 0), 0)
      return { total: roster.length, pagaron: conAbono, pendientes: roster.length - conAbono, recaudado }
    }
    const pagaron = roster.filter(i => pagos[i.id]?.pagado).length
    const recaudado = roster.reduce((s, i) => s + (pagos[i.id]?.monto ?? 0), 0)
    return { total: roster.length, pagaron, pendientes: roster.length - pagaron, recaudado }
  }, [roster, pagos, abonos, acumulable, tieneAbono])

  const lista = useMemo(() => {
    const q = norm(search.trim())
    const pendiente = (i: IntegranteBase) => acumulable ? !tieneAbono(i.id) : !pagos[i.id]?.pagado
    return roster
      .filter(i => fam === 'all' || i.familia === fam)
      .filter(i => !soloPendientes || pendiente(i))
      .filter(i => !q || norm(`${i.nombre} ${i.apellidos} ${getSeccion(i.seccion)?.label ?? ''}`).includes(q))
      .sort((a, b) => `${a.apellidos}`.localeCompare(b.apellidos, 'es'))
  }, [roster, fam, soloPendientes, search, pagos, abonos, acumulable, tieneAbono])

  const linkRecibo = (p?: Pago) => p?.token ? `${window.location.origin}/recibo/${p.id}?t=${p.token}` : null

  const abrirWhatsAppRecibo = (i: IntegranteBase, p: Pago) => {
    const tel = (i.whatsapp || '').replace(/\D/g, '')
    const url = linkRecibo(p)
    if (!tel || !url) return false
    const monto = p.monto != null ? ` por ${fmtCOP(p.monto)}` : ''
    const msg = encodeURIComponent(
      `Hola ${i.nombre}, ✅ registramos tu pago de ${p.concepto} de ${periodoLabel(p.periodo)}${monto}.\n` +
      `Este es tu recibo oficial de la Guardia Real de Antioquia:\n${url}\n¡Gracias por tu aporte! 🎺`)
    window.open(`https://wa.me/57${tel}?text=${msg}`, '_blank', 'noopener')
    return true
  }

  // Blindaje: nunca registrar un pago/abono sin un integrante claramente identificado.
  const integranteValido = (i?: IntegranteBase | null): i is IntegranteBase => {
    if (!i || !i.id || !`${i.nombre ?? ''} ${i.apellidos ?? ''}`.trim()) {
      toast.error('Debes seleccionar un integrante válido. La ficha no tiene nombre o no está seleccionada.')
      return false
    }
    return true
  }

  const marcar = async (i: IntegranteBase) => {
    if (!profile || !integranteValido(i)) return
    // La primera vez se anexa la firma del recaudador (va en cada recibo).
    if (firmaCargada && !firma) { setPendienteFirma(i); setFirmaModal(true); return }
    const monto = cuota ? Number(cuota) : undefined
    const nombre = `${i.nombre} ${i.apellidos}`.trim()
    try {
      const { id, reciboNumero, token } = await setPago(i.id, periodo, concepto.trim(), { integranteNombre: nombre, monto }, profile.uid)
      const pago: Pago = { id, integranteId: i.id, integranteNombre: nombre, periodo, concepto, pagado: true, monto, fecha: new Date().toISOString().slice(0, 10), pagadoEn: new Date().toISOString(), reciboNumero, token, createdAt: new Date() }
      setPagos(p => ({ ...p, [i.id]: pago }))
      // Correo automático con el recibo (no bloquea la UI)
      fetch('/api/recibos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pagoId: id }) }).catch(() => {})
      // WhatsApp con el recibo listo para enviar (1 toque)
      const abierto = abrirWhatsAppRecibo(i, pago)
      toast.success(`Recibo ${reciboNumero} generado${abierto ? ' · WhatsApp abierto para enviarlo' : ''} · correo enviado`)
    } catch { toast.error('No se pudo guardar'); loadPagos() }
  }

  const desmarcar = async (i: IntegranteBase) => {
    setPagos(p => { const n = { ...p }; delete n[i.id]; return n })
    try { await deletePago(i.id, periodo, concepto.trim()) } catch { toast.error('No se pudo quitar'); loadPagos() }
  }

  // ── Abonos acumulables ──
  const abrirAbono = (i: IntegranteBase) => {
    if (!integranteValido(i)) return
    // La firma del recaudador se pide una sola vez (va en cada recibo)
    if (firmaCargada && !firma) { setPendienteAbono(i); setFirmaModal(true); return }
    setAbonoModal(i)
  }

  const registrarAbono = async (i: IntegranteBase, vals: { monto: number; metodo?: string; fecha: string }) => {
    if (!profile || !integranteValido(i)) return
    const nombre = `${i.nombre} ${i.apellidos}`.trim()
    try {
      const { id, reciboNumero, token } = await addAbono(i.id, periodo, concepto.trim(), { integranteNombre: nombre, monto: vals.monto, metodo: vals.metodo, fecha: vals.fecha }, profile.uid)
      const pago: Pago = { id, integranteId: i.id, integranteNombre: nombre, periodo, concepto, pagado: true, monto: vals.monto, fecha: vals.fecha, pagadoEn: new Date().toISOString(), reciboNumero, token, metodo: vals.metodo, createdAt: new Date() }
      setAbonos(prev => ({ ...prev, [i.id]: [...(prev[i.id] ?? []), pago] }))
      setTotalConcepto(t => t ? { total: t.total + vals.monto, count: t.count + 1 } : t)
      setAbonoModal(null)
      fetch('/api/recibos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pagoId: id }) }).catch(() => {})
      const abierto = abrirWhatsAppRecibo(i, pago)
      toast.success(`Abono de ${fmtCOP(vals.monto)} registrado · Recibo ${reciboNumero}${abierto ? ' · WhatsApp abierto' : ''}`)
    } catch { toast.error('No se pudo registrar el abono') }
  }

  const quitarAbono = async (i: IntegranteBase, pago: Pago) => {
    if (!confirm(`¿Eliminar este abono${pago.monto != null ? ` de ${fmtCOP(pago.monto)}` : ''}? No se puede deshacer.`)) return
    setAbonos(prev => ({ ...prev, [i.id]: (prev[i.id] ?? []).filter(p => p.id !== pago.id) }))
    setTotalConcepto(t => t ? { total: t.total - (pago.monto ?? 0), count: Math.max(0, t.count - 1) } : t)
    try { await deleteAbono(pago.id) } catch { toast.error('No se pudo eliminar'); loadPagos() }
  }

  const recordar = (i: IntegranteBase) => {
    const tel = (i.whatsapp || '').replace(/\D/g, '')
    if (!tel) { toast.info('Sin WhatsApp registrado'); return }
    const msg = encodeURIComponent(
      `Hola ${i.nombre}, desde la Guardia Real de Antioquia. Te recordamos el pago de ${concepto} de ${periodoLabel(periodo)}` +
      `${cuota ? ` (${fmtCOP(Number(cuota))})` : ''}. ¡Gracias por tu compromiso con la banda!`)
    window.open(`https://wa.me/57${tel}?text=${msg}`, '_blank', 'noopener')
  }

  const exportar = () => {
    if (acumulable) {
      descargarCSV(`abonos-${slugCsv(concepto)}-${periodo}`,
        ['Apellidos', 'Nombre', 'Sección', 'Concepto', 'Recibo', 'Monto', 'Fecha', 'Método'],
        lista.flatMap(i => (abonos[i.id] ?? []).map(p =>
          [i.apellidos, i.nombre, getSeccion(i.seccion)?.label ?? i.seccion, concepto, p.reciboNumero ?? '', p.monto != null ? String(p.monto) : '', p.fecha ?? '', p.metodo ?? ''])))
      toast.success('Reporte de abonos descargado')
      return
    }
    descargarCSV(`pagos-${slugCsv(concepto)}-${periodo}`,
      ['Apellidos', 'Nombre', 'Sección', 'Concepto', 'Estado', 'Monto', 'Fecha de pago'],
      lista.map(i => {
        const p = pagos[i.id]
        return [i.apellidos, i.nombre, getSeccion(i.seccion)?.label ?? i.seccion, concepto, p?.pagado ? 'Pagó' : 'Pendiente', p?.monto != null ? String(p.monto) : '', p?.fecha ?? '']
      }))
    toast.success('Reporte descargado')
  }

  return (
    <div>
      {/* Periodo + concepto + cuota */}
      <div className="card p-4 mb-5 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-semibold text-dark mb-1">Periodo (mes)</label>
          <input type="month" value={periodo} onChange={e => setPeriodo(e.target.value)} className="input" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-dark mb-1">Concepto</label>
          <div className="relative">
            <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
            <select value={conceptoSel} onChange={e => setConceptoSel(e.target.value)} className="input pl-9 pr-8 max-w-[220px] cursor-pointer">
              {CONCEPTOS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        {conceptoSel === 'Otro' && (
          <div>
            <label className="block text-xs font-semibold text-dark mb-1">¿Cuál concepto?</label>
            <input autoFocus value={conceptoOtro} onChange={e => setConceptoOtro(e.target.value)} className="input max-w-[200px]" placeholder="Escribe el concepto" />
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-dark mb-1">{acumulable ? 'Monto sugerido' : 'Cuota'} <span className="font-normal text-gray-400">(opcional)</span></label>
          <div className="relative">
            <Coins size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="number" value={cuota} onChange={e => setCuota(e.target.value)} className="input pl-9 max-w-[150px]" placeholder="30000" />
          </div>
        </div>
        <p className="text-sm text-gray-500 ml-auto"><strong className="text-navy">{concepto || '—'}</strong> · {periodoLabel(periodo)}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Stat icon={CheckCircle2} label={acumulable ? 'Con abono' : 'Pagaron'} value={String(stats.pagaron)} color="text-green-600" />
        <Stat icon={Clock} label={acumulable ? 'Sin abono' : 'Pendientes'} value={String(stats.pendientes)} color="text-amber-600" />
        <Stat icon={Coins} label={acumulable ? 'Recaudado del mes' : 'Recaudado'} value={fmtCOP(stats.recaudado) || '$0'} color="text-royal" />
        <Stat icon={Wallet} label="Integrantes" value={String(stats.total)} color="text-navy" />
      </div>

      {/* Total histórico del concepto acumulable */}
      {acumulable && totalConcepto && (
        <div className="bg-gradient-to-br from-navy to-[#0a2350] rounded-xl px-4 py-3 mb-5 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <PiggyBank size={20} className="text-gold" />
            <div>
              <p className="text-[10px] font-bold text-gold uppercase tracking-widest">Total acumulado · {concepto}</p>
              <p className="text-xs text-gray-300">{totalConcepto.count} abono(s) en total (todos los meses)</p>
            </div>
          </div>
          <span className="font-display text-2xl font-bold">{fmtCOP(totalConcepto.total) || '$0'}</span>
        </div>
      )}

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
        <button onClick={() => setCierreOpen(true)} className="btn btn-ghost btn-sm"><Receipt size={14} /> Cierre de caja</button>
        <button onClick={exportar} className="btn btn-ghost btn-sm"><FileDown size={14} /> Exportar</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-royal/30 border-t-royal rounded-full animate-spin" /></div>
      ) : lista.length === 0 ? (
        <div className="card text-center py-12 text-gray-400 text-sm">Sin resultados.</div>
      ) : (
        <div className="space-y-1.5">
          {lista.map(i => {
            // Concepto acumulable: varios abonos independientes por integrante
            if (acumulable) {
              const mis = abonos[i.id] ?? []
              const suma = sumaAbonos(i.id)
              const abierto = expandAbono === i.id
              return (
                <div key={i.id} className={cn('border rounded-xl', mis.length ? 'border-green-200 bg-green-50/40' : 'border-gray-100 bg-white')}>
                  <div className="flex items-center gap-3 p-3">
                    <div className="w-9 h-9 rounded-full bg-royal/10 flex items-center justify-center text-royal text-sm font-bold shrink-0">{(i.nombre[0] ?? '?').toUpperCase()}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-dark truncate">{i.nombre} {i.apellidos}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {getSeccion(i.seccion)?.label ?? i.seccion}
                        {mis.length > 0 && <span className="text-green-600 font-semibold"> · {fmtCOP(suma)} en {mis.length} abono{mis.length !== 1 ? 's' : ''}</span>}
                      </p>
                    </div>
                    {mis.length > 0 && (
                      <button onClick={() => setExpandAbono(abierto ? null : i.id)} className="btn btn-ghost btn-sm shrink-0">
                        {abierto ? <ChevronUp size={14} /> : <ChevronDown size={14} />} {mis.length}
                      </button>
                    )}
                    {mis.length === 0 && i.whatsapp && (
                      <button onClick={() => recordar(i)} title="Recordar por WhatsApp" className="w-8 h-8 rounded-lg bg-[#25D366]/10 text-[#1ebd5a] hover:bg-[#25D366] hover:text-white flex items-center justify-center shrink-0"><MessageCircle size={14} /></button>
                    )}
                    <button onClick={() => abrirAbono(i)} className="btn btn-primary btn-sm shrink-0"><Plus size={13} /> Abonar</button>
                  </div>
                  {abierto && mis.length > 0 && (
                    <div className="px-3 pb-3 sm:pl-14 space-y-1">
                      {mis.map(p => (
                        <div key={p.id} className="flex items-center gap-2 text-xs border-t border-green-100 pt-1.5">
                          <span className="text-gray-400 tabular-nums shrink-0">{p.pagadoEn ? new Date(p.pagadoEn).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : p.fecha}</span>
                          <span className="font-semibold text-navy">{fmtCOP(p.monto)}</span>
                          {p.metodo && <span className="text-gray-400">· {p.metodo}</span>}
                          <div className="ml-auto flex items-center gap-2 shrink-0">
                            {p.token && <a href={linkRecibo(p) ?? '#'} target="_blank" rel="noopener noreferrer" className="text-royal" title="Ver recibo"><Receipt size={14} /></a>}
                            {p.token && i.whatsapp && <button onClick={() => abrirWhatsAppRecibo(i, p)} title="Enviar recibo por WhatsApp" className="text-[#1ebd5a]"><MessageCircle size={14} /></button>}
                            <button onClick={() => quitarAbono(i, p)} title="Eliminar abono" className="text-red-500 hover:text-red-600"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            }
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
                  <>
                    {p.token && (
                      <>
                        <a href={linkRecibo(p) ?? '#'} target="_blank" rel="noopener noreferrer" title="Ver recibo"
                          className="btn btn-ghost btn-sm text-royal shrink-0"><Receipt size={13} /> Recibo</a>
                        {i.whatsapp && (
                          <button onClick={() => abrirWhatsAppRecibo(i, p)} title="Reenviar recibo por WhatsApp"
                            className="w-8 h-8 rounded-lg bg-[#25D366]/10 text-[#1ebd5a] hover:bg-[#25D366] hover:text-white flex items-center justify-center shrink-0"><MessageCircle size={14} /></button>
                        )}
                      </>
                    )}
                    <button onClick={() => desmarcar(i)} className="btn btn-ghost btn-sm text-red-500 shrink-0"><X size={13} /> Quitar</button>
                  </>
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

      {cierreOpen && <CierreCajaModal onClose={() => setCierreOpen(false)} />}

      {firmaModal && profile && (
        <FirmaReciboModal
          nombre={profile.displayName || 'Recaudador'}
          onClose={() => { setFirmaModal(false); setPendienteFirma(null); setPendienteAbono(null) }}
          onSaved={async (dataUrl) => {
            try {
              await setFirmaRecibo(profile.uid, dataUrl)
              setFirma(dataUrl)
              setFirmaModal(false)
              toast.success('Firma guardada. Aparecerá en todos tus recibos.')
              const pend = pendienteFirma
              const pendA = pendienteAbono
              setPendienteFirma(null); setPendienteAbono(null)
              if (pend) setTimeout(() => marcar(pend), 100)
              if (pendA) setTimeout(() => setAbonoModal(pendA), 100)
            } catch { toast.error('No se pudo guardar la firma') }
          }}
        />
      )}

      {abonoModal && (
        <AbonoModal
          integrante={abonoModal}
          concepto={concepto}
          periodoTxt={periodoLabel(periodo)}
          montoSugerido={cuota}
          onClose={() => setAbonoModal(null)}
          onSave={(vals) => registrarAbono(abonoModal, vals)}
        />
      )}
    </div>
  )
}

// ── Modal: registrar un abono ───────────────────────────────────────
function AbonoModal({ integrante, concepto, periodoTxt, montoSugerido, onClose, onSave }: {
  integrante: IntegranteBase; concepto: string; periodoTxt: string; montoSugerido: string
  onClose: () => void; onSave: (vals: { monto: number; metodo?: string; fecha: string }) => Promise<void>
}) {
  const [monto, setMonto] = useState(montoSugerido)
  const [metodo, setMetodo] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [guardando, setGuardando] = useState(false)
  const nombre = `${integrante.nombre ?? ''} ${integrante.apellidos ?? ''}`.trim()
  const sinIntegrante = !integrante.id || !nombre

  const guardar = async () => {
    if (sinIntegrante) { toast.error('Este abono no tiene un integrante identificado'); return }
    const n = Number(monto)
    if (!n || n <= 0) { toast.error('Ingresa el monto del abono'); return }
    setGuardando(true)
    await onSave({ monto: n, metodo: metodo.trim() || undefined, fecha })
    setGuardando(false)
  }

  return (
    <div className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-serif font-bold text-navy text-lg flex items-center gap-2"><PiggyBank size={18} className="text-royal" /> Registrar abono</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-navy"><X size={18} /></button>
        </div>
        <p className="text-sm text-gray-500 mb-4"><strong className="text-dark">{nombre || '⚠ Sin nombre'}</strong> · {concepto} · {periodoTxt}</p>

        {sinIntegrante && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 mb-4">
            Esta ficha no tiene nombre o no está seleccionada. No se puede registrar el abono hasta completar la ficha del integrante.
          </div>
        )}

        <label className="block text-xs font-semibold text-dark mb-1">Monto del abono</label>
        <div className="relative mb-3">
          <Coins size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input autoFocus type="number" value={monto} onChange={e => setMonto(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') guardar() }} className="input pl-9" placeholder="50000" />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div>
            <label className="block text-xs font-semibold text-dark mb-1">Fecha</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark mb-1">Método <span className="font-normal text-gray-400">(opc.)</span></label>
            <input value={metodo} onChange={e => setMetodo(e.target.value)} className="input" placeholder="Efectivo" />
          </div>
        </div>

        <button onClick={guardar} disabled={guardando || sinIntegrante} className="btn btn-primary btn-md w-full justify-center disabled:opacity-50">
          {guardando ? 'Registrando...' : 'Registrar abono y generar recibo'}
        </button>
      </div>
    </div>
  )
}

// ── Modal: firma del recaudador (primera vez) ───────────────────────
function FirmaReciboModal({ nombre, onClose, onSaved }: {
  nombre: string; onClose: () => void; onSaved: (dataUrl: string) => Promise<void>
}) {
  const [firma, setFirmaLocal] = useState('')
  const [guardando, setGuardando] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Foto de la firma → se reduce y convierte a PNG
  const subirFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Debe ser una imagen'); return }
    const img = new window.Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scale = Math.min(1, 600 / img.width)
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      setFirmaLocal(canvas.toDataURL('image/png'))
      toast.success('Foto de firma cargada')
    }
    img.src = URL.createObjectURL(file)
    e.target.value = ''
  }

  const guardar = async () => {
    if (!firma) { toast.error('Dibuja tu firma o sube una foto') ; return }
    setGuardando(true)
    await onSaved(firma)
    setGuardando(false)
  }

  return (
    <div className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-serif font-bold text-navy text-lg flex items-center gap-2"><PenLine size={17} className="text-royal" /> Tu firma para los recibos</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-navy"><X size={18} /></button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Solo se pide una vez. Aparecerá en cada recibo como <strong>&ldquo;Recibido: {nombre}&rdquo;</strong>.
        </p>

        {firma ? (
          <div className="border-2 border-dashed border-green-300 bg-green-50/50 rounded-xl p-3 text-center mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={firma} alt="Firma" className="h-20 mx-auto object-contain" />
            <button onClick={() => setFirmaLocal('')} className="text-xs text-red-500 hover:underline mt-1">Cambiar</button>
          </div>
        ) : (
          <SignaturePad onChange={setFirmaLocal} />
        )}

        <div className="flex items-center gap-3 my-3">
          <div className="flex-1 h-px bg-gray-200" /><span className="text-xs text-gray-400 uppercase">o</span><div className="flex-1 h-px bg-gray-200" />
        </div>
        <button onClick={() => fileRef.current?.click()} className="btn btn-ghost btn-md w-full justify-center">
          <ImageUp size={16} /> Subir foto de mi firma
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={subirFoto} />

        <div className="flex gap-3 mt-5">
          <button onClick={guardar} disabled={guardando || !firma} className="btn btn-primary btn-md flex-1 justify-center disabled:opacity-50">
            {guardando ? 'Guardando...' : 'Guardar firma y continuar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Cierre de caja del día ──────────────────────────────────────────
function CierreCajaModal({ onClose }: { onClose: () => void }) {
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [pagos, setPagos] = useState<Pago[] | null>(null)

  useEffect(() => {
    setPagos(null)
    getPagosPorFecha(fecha).then(setPagos).catch(() => setPagos([]))
  }, [fecha])

  const total = (pagos ?? []).reduce((s, p) => s + (p.monto ?? 0), 0)
  const porConcepto = useMemo(() => {
    const m: Record<string, { n: number; monto: number }> = {}
    for (const p of pagos ?? []) {
      const k = p.concepto || 'Mensualidad'
      m[k] = { n: (m[k]?.n ?? 0) + 1, monto: (m[k]?.monto ?? 0) + (p.monto ?? 0) }
    }
    return Object.entries(m).sort((a, b) => b[1].monto - a[1].monto)
  }, [pagos])

  const exportar = () => {
    if (!pagos?.length) return
    descargarCSV(`cierre-caja-${fecha}`,
      ['Recibo', 'Hora', 'Integrante', 'Concepto', 'Periodo', 'Monto'],
      pagos.map(p => [
        p.reciboNumero ?? '', p.pagadoEn ? new Date(p.pagadoEn).toLocaleTimeString('es-CO') : '',
        p.integranteNombre ?? '', p.concepto, p.periodo, p.monto != null ? String(p.monto) : '',
      ]))
    toast.success('Cierre de caja descargado')
  }

  return (
    <div className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-navy px-5 py-4 flex items-center justify-between">
          <div className="text-white">
            <p className="font-serif font-bold flex items-center gap-2"><Receipt size={17} className="text-gold" /> Cierre de caja</p>
            <p className="text-gray-300 text-xs">Pagos registrados por fecha</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <label className="text-xs font-semibold text-dark">Fecha</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="input max-w-[180px]" />
            <button onClick={exportar} className="btn btn-ghost btn-sm ml-auto"><FileDown size={13} /> CSV</button>
          </div>

          {pagos === null ? (
            <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-royal/30 border-t-royal rounded-full animate-spin" /></div>
          ) : pagos.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-10">No hay pagos registrados en esta fecha.</p>
          ) : (
            <>
              {/* Total */}
              <div className="bg-[#F2C100]/10 border border-[#F2C100]/40 rounded-xl px-4 py-3 flex items-center justify-between mb-4">
                <div><p className="text-[10px] font-bold text-[#8a6d00] uppercase tracking-widest">Total recaudado</p><p className="text-xs text-gray-500">{pagos.length} pago(s)</p></div>
                <span className="font-display text-navy text-2xl font-bold">{fmtCOP(total) || '$0'}</span>
              </div>

              {/* Por concepto */}
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Por concepto</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {porConcepto.map(([c, v]) => (
                  <span key={c} className="text-xs bg-navy/8 text-navy rounded-lg px-2.5 py-1">{c}: <strong>{fmtCOP(v.monto) || v.n}</strong> <span className="text-gray-400">({v.n})</span></span>
                ))}
              </div>

              {/* Lista */}
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Recibos</p>
              <div className="space-y-1">
                {pagos.map(p => (
                  <div key={p.id} className="flex items-center gap-2 text-sm py-1.5 border-b border-gray-50">
                    <span className="text-[10px] text-gray-400 tabular-nums shrink-0">{p.pagadoEn ? new Date(p.pagadoEn).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                    <span className="text-dark truncate flex-1">{p.integranteNombre}</span>
                    <span className="text-gray-400 text-xs shrink-0">{p.concepto}</span>
                    <span className="font-semibold text-navy shrink-0">{fmtCOP(p.monto)}</span>
                    {p.token && <a href={`/recibo/${p.id}?t=${p.token}`} target="_blank" rel="noopener noreferrer" className="text-royal shrink-0"><Receipt size={13} /></a>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function slugCsv(s: string) { return (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-') }

function Stat({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return <div className="bg-white border border-gray-100 rounded-xl p-4"><Icon size={18} className={cn('mb-1', color)} /><div className={cn('font-display text-2xl font-bold', color)}>{value}</div><div className="text-xs text-gray-400 leading-tight">{label}</div></div>
}
