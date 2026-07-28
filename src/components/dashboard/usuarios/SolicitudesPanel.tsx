'use client'

import { useEffect, useState, useMemo } from 'react'
import { ClipboardList, ChevronDown, ChevronUp, Trash2, Sparkles, History, Send, MessageSquare, ArrowRightLeft, GitMerge, Copy } from 'lucide-react'
import {
  getIngresoRequests, updateIngresoEstado, agregarComentarioIngreso, deleteIngresoRequest,
  mergeIngresoRequests, getIntegranteByCorreo, upsertIntegrante,
} from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { getSeccion } from '@/lib/secciones'
import { cn, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import type { IngresoRequest, Integrante, IngresoHistorial } from '@/types'

type Estado = 'nuevo' | 'contactado' | 'aceptado' | 'rechazado' | 'cancelado'
const STATUS_COLORS: Record<string, string> = {
  nuevo: 'bg-blue-100 text-blue-700', contactado: 'bg-amber-100 text-amber-700',
  aceptado: 'bg-green-100 text-green-700', rechazado: 'bg-red-100 text-red-700', cancelado: 'bg-gray-200 text-gray-600',
}
const STATUS_LABELS: Record<string, string> = { nuevo: 'Nueva', contactado: 'Contactado', aceptado: 'Aceptado', rechazado: 'Rechazado', cancelado: 'Cancelado' }
// Recientes = en gestión; Historial = cerradas
const EN_GESTION: Estado[] = ['nuevo', 'contactado']
const EN_HISTORIAL: Estado[] = ['aceptado', 'rechazado', 'cancelado']

function fechaCorta(iso: string) {
  try { return new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) } catch { return iso }
}

type Ingreso = IngresoRequest & { id: string }
const normTxt = (s?: string) => (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
const soloDigitos = (s?: string) => (s ?? '').replace(/\D/g, '')
// Prioridad de estado al elegir cuál solicitud queda como principal
const RANK: Record<string, number> = { aceptado: 4, contactado: 3, nuevo: 2, cancelado: 1, rechazado: 0 }

/** Agrupa solicitudes que parecen la misma persona (mismo correo, teléfono o identificación). */
function detectarDuplicados(reqs: Ingreso[]): Ingreso[][] {
  const parent: Record<string, string> = {}
  const find = (x: string): string => (parent[x] === x ? x : (parent[x] = find(parent[x])))
  const union = (a: string, b: string) => { parent[find(a)] = find(b) }
  reqs.forEach(r => { parent[r.id] = r.id })
  const porCorreo: Record<string, string> = {}, porTel: Record<string, string> = {}, porId: Record<string, string> = {}
  reqs.forEach(r => {
    const e = normTxt(r.email), t = soloDigitos(r.telefono), d = normTxt(r.identificacion)
    if (e) { if (porCorreo[e]) union(r.id, porCorreo[e]); else porCorreo[e] = r.id }
    if (t && t.length >= 7) { if (porTel[t]) union(r.id, porTel[t]); else porTel[t] = r.id }
    if (d) { if (porId[d]) union(r.id, porId[d]); else porId[d] = r.id }
  })
  const grupos: Record<string, Ingreso[]> = {}
  reqs.forEach(r => { const root = find(r.id); (grupos[root] ??= []).push(r) })
  return Object.values(grupos).filter(g => g.length > 1)
}

export default function SolicitudesPanel({ uid }: { uid: string }) {
  const { profile } = useAuth()
  const actor = profile?.displayName || 'Administración'
  const [ingresos, setIngresos] = useState<Ingreso[]>([])
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [tab, setTab]           = useState<'recientes' | 'historial'>('recientes')
  const [comentario, setComentario] = useState<Record<string, string>>({})
  const [merging, setMerging]   = useState<string | null>(null)
  const [showDup, setShowDup]   = useState(true)

  const fetchIngresos = async () => {
    setLoading(true)
    try { setIngresos(await getIngresoRequests() as Ingreso[]) }
    catch { toast.error('Error al cargar solicitudes de ingreso') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchIngresos() }, [])

  const pushHist = (id: string, h: IngresoHistorial) =>
    setIngresos(prev => prev.map(i => i.id === id ? { ...i, historial: [...(i.historial ?? []), h] } : i))

  const handleStatus = async (id: string, status: Estado) => {
    try {
      await updateIngresoEstado(id, status, actor, uid)
      setIngresos(prev => prev.map(i => i.id === id ? { ...i, status } : i))
      pushHist(id, { tipo: 'estado', estado: status, por: actor, porUid: uid, en: new Date().toISOString() })
      toast.success(`Estado actualizado a "${STATUS_LABELS[status]}"`)
      if (status === 'aceptado') {
        const ing = ingresos.find(i => i.id === id)
        if (ing) await crearFicha(ing)
      }
    } catch { toast.error('Error al actualizar el estado') }
  }

  const crearFicha = async (ing: IngresoRequest & { id: string }) => {
    try {
      const correo = ing.email?.toLowerCase() ?? ''
      if (correo && await getIntegranteByCorreo(correo)) { toast.info(`${ing.nombreCompleto} ya tenía ficha`); return }
      const partes = (ing.nombreCompleto ?? '').trim().split(/\s+/)
      const sec = getSeccion(ing.instrumentoInteres)
      const ficha: Partial<Integrante> = {
        nombre: partes[0] ?? ing.nombreCompleto, apellidos: partes.slice(1).join(' '),
        correo, whatsapp: ing.telefono ?? '', numDoc: ing.identificacion ?? '', fechaNacimiento: ing.fechaNacimiento ?? '',
        seccion: sec?.key ?? '', familia: sec?.familia ?? '', secciones: sec ? [sec.key] : [],
        direccion: [ing.barrio, ing.ciudad].filter(Boolean).join(', '),
        tipoDoc: '', tipoSangre: '', eps: '', pasaporte: false, contactoEmergencia: '', diagnostico: '', activo: true,
      }
      await upsertIntegrante(null, ficha, uid)
      toast.success(`Ficha creada para ${ing.nombreCompleto}. Pídele completar sus datos.`)
    } catch { toast.error('La solicitud se aceptó, pero no se pudo crear la ficha') }
  }

  const handleComentario = async (id: string) => {
    const texto = (comentario[id] ?? '').trim()
    if (!texto) return
    try {
      await agregarComentarioIngreso(id, texto, actor, uid)
      pushHist(id, { tipo: 'comentario', texto, por: actor, porUid: uid, en: new Date().toISOString() })
      setComentario(c => ({ ...c, [id]: '' }))
      toast.success('Comentario guardado')
    } catch { toast.error('Error al guardar el comentario') }
  }

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar la solicitud de ${nombre}? Se borra también su historial.`)) return
    try { await deleteIngresoRequest(id); setIngresos(prev => prev.filter(i => i.id !== id)); toast.success('Solicitud eliminada') }
    catch { toast.error('Error al eliminar') }
  }

  const handleMerge = async (grupo: Ingreso[]) => {
    // Principal = estado más avanzado; a igualdad, la más reciente
    const orden = [...grupo].sort((a, b) => (RANK[b.status] - RANK[a.status]) || (b.createdAt.getTime() - a.createdAt.getTime()))
    const principal = orden[0]
    const otras = orden.slice(1)
    if (!confirm(`¿Fusionar ${grupo.length} solicitudes de "${principal.nombreCompleto}" en una sola? Se conserva toda la bitácora y se eliminan las duplicadas. No se puede deshacer.`)) return

    setMerging(principal.id)
    try {
      // Completa campos vacíos de la principal con datos de las duplicadas
      const pick = (f: keyof IngresoRequest): string => {
        const propio = principal[f]
        if (propio !== undefined && propio !== null && propio !== '') return String(propio)
        const alt = grupo.map(g => g[f]).find(v => v !== undefined && v !== null && v !== '')
        return alt !== undefined ? String(alt) : ''
      }
      const historialCombinado = [
        ...grupo.flatMap(g => g.historial ?? []),
        { tipo: 'comentario' as const, texto: `Se fusionaron ${grupo.length} solicitudes duplicadas en esta.`, por: actor, porUid: uid, en: new Date().toISOString() },
      ].sort((a, b) => new Date(a.en).getTime() - new Date(b.en).getTime())

      const merged: Record<string, unknown> = {
        nombreCompleto: pick('nombreCompleto'), identificacion: pick('identificacion'),
        email: pick('email'), telefono: pick('telefono'),
        instrumentoInteres: pick('instrumentoInteres'), nivelExperiencia: pick('nivelExperiencia') || 'ninguna',
        fechaNacimiento: pick('fechaNacimiento'), barrio: pick('barrio'), ciudad: pick('ciudad'),
        disponibilidad: pick('disponibilidad'), comoSeEntero: pick('comoSeEntero'),
        instrumentosExperiencia: pick('instrumentosExperiencia'), mensaje: pick('mensaje'),
        instrumentoPropio: grupo.some(g => g.instrumentoPropio),
        experienciaPrevia: grupo.some(g => g.experienciaPrevia),
        status: principal.status,
        historial: historialCombinado,
        createdAt: new Date(Math.min(...grupo.map(g => g.createdAt.getTime()))),
        lastUpdatedBy: uid,
      }

      await mergeIngresoRequests(principal.id, merged, otras.map(o => o.id))
      const otrasIds = new Set(otras.map(o => o.id))
      setIngresos(prev => prev
        .filter(i => !otrasIds.has(i.id))
        .map(i => i.id === principal.id ? { ...i, ...merged, createdAt: merged.createdAt as Date, historial: historialCombinado } as Ingreso : i))
      if (otrasIds.has(expanded ?? '')) setExpanded(null)
      toast.success('Solicitudes fusionadas en una sola')
    } catch { toast.error('Error al fusionar las solicitudes') }
    finally { setMerging(null) }
  }

  const duplicados = useMemo(() => detectarDuplicados(ingresos), [ingresos])
  const recientes = useMemo(() => ingresos.filter(i => EN_GESTION.includes(i.status as Estado)), [ingresos])
  const historial = useMemo(() => ingresos.filter(i => EN_HISTORIAL.includes(i.status as Estado)), [ingresos])
  const lista = tab === 'recientes' ? recientes : historial

  return (
    <div>
      {/* Duplicados detectados */}
      {duplicados.length > 0 && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
          <button onClick={() => setShowDup(s => !s)} className="w-full flex items-center gap-2 px-4 py-3 text-left">
            <Copy size={16} className="text-amber-600 shrink-0" />
            <span className="text-sm font-semibold text-amber-800">
              {duplicados.length} posible{duplicados.length !== 1 ? 's' : ''} duplicad{duplicados.length !== 1 ? 'os' : 'o'} detectado{duplicados.length !== 1 ? 's' : ''}
            </span>
            <span className="text-xs text-amber-600 ml-auto">{showDup ? 'Ocultar' : 'Ver'}</span>
            {showDup ? <ChevronUp size={15} className="text-amber-600" /> : <ChevronDown size={15} className="text-amber-600" />}
          </button>
          {showDup && (
            <div className="px-4 pb-4 space-y-3">
              {duplicados.map((grupo, gi) => (
                <div key={gi} className="bg-white rounded-lg border border-amber-100 p-3">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="text-sm font-semibold text-dark">{grupo[0].nombreCompleto} <span className="font-normal text-gray-400">· {grupo.length} solicitudes</span></p>
                    <button onClick={() => handleMerge(grupo)} disabled={merging === grupo[0].id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-navy hover:bg-navy/90 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60 shrink-0">
                      <GitMerge size={13} /> {merging ? 'Fusionando...' : 'Fusionar en una'}
                    </button>
                  </div>
                  <div className="space-y-1">
                    {grupo.map(g => (
                      <div key={g.id} className="flex items-center gap-2 text-xs text-gray-500">
                        <span className={cn('badge text-[10px]', STATUS_COLORS[g.status])}>{STATUS_LABELS[g.status]}</span>
                        <span className="truncate">{g.email} · {g.telefono}</span>
                        <span className="text-gray-300 ml-auto shrink-0">{formatDate(g.createdAt as Date, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <p className="text-[11px] text-amber-700/80">Se conserva la solicitud con el estado más avanzado, se rellenan los datos faltantes con los de las otras y se unifica la bitácora.</p>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('recientes')} className={cn('px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5', tab === 'recientes' ? 'bg-navy text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:border-navy')}>
          <ClipboardList size={14} /> Recientes <span className="opacity-60">{recientes.length}</span>
        </button>
        <button onClick={() => setTab('historial')} className={cn('px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5', tab === 'historial' ? 'bg-navy text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:border-navy')}>
          <History size={14} /> Historial <span className="opacity-60">{historial.length}</span>
        </button>
        <p className="text-gray-400 text-xs self-center ml-auto">{ingresos.filter(i => i.status === 'nuevo').length} nueva(s) sin revisar</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-10"><div className="w-6 h-6 border-2 border-royal/30 border-t-royal rounded-full animate-spin" /></div>
        ) : lista.length === 0 ? (
          <div className="text-center py-12 text-gray-400"><ClipboardList size={32} className="mx-auto mb-3 opacity-30" /><p className="text-sm">{tab === 'recientes' ? 'No hay solicitudes en gestión.' : 'El historial está vacío.'}</p></div>
        ) : (
          <div className="divide-y divide-gray-100">
            {lista.map(ing => (
              <div key={ing.id} className="px-5 py-4">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(expanded === ing.id ? null : ing.id)}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-navy text-white text-sm font-bold flex items-center justify-center shrink-0">{ing.nombreCompleto?.[0]?.toUpperCase() ?? '?'}</div>
                    <div><p className="text-sm font-semibold text-dark">{ing.nombreCompleto}</p><p className="text-xs text-gray-400">{ing.instrumentoInteres} · {ing.telefono}</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    {(ing.historial?.length ?? 0) > 0 && <span className="text-[10px] text-gray-400 hidden sm:flex items-center gap-1"><MessageSquare size={11} /> {ing.historial!.length}</span>}
                    <span className={cn('badge text-xs', STATUS_COLORS[ing.status] ?? 'bg-gray-100 text-gray-600')}>{STATUS_LABELS[ing.status] ?? ing.status}</span>
                    <p className="text-xs text-gray-400 hidden sm:block">{formatDate(ing.createdAt as Date, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    {expanded === ing.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>
                {expanded === ing.id && (
                  <div className="mt-4 ml-0 sm:ml-12 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      {[['Email', ing.email],['Teléfono', ing.telefono],['Identificación', ing.identificacion],['Fecha nacimiento', ing.fechaNacimiento],['Barrio / Ciudad', `${ing.barrio}, ${ing.ciudad}`],['Instrumento', ing.instrumentoInteres],['Instrumento propio', ing.instrumentoPropio ? 'Sí' : 'No'],['Experiencia', ing.experienciaPrevia ? `Sí — ${ing.nivelExperiencia}` : 'No'],['Disponibilidad', ing.disponibilidad],['Cómo se enteró', ing.comoSeEntero]].map(([l, v]) => (
                        <div key={l}><p className="font-bold text-gray-400 uppercase tracking-wider mb-0.5">{l}</p><p className="text-dark break-words">{v}</p></div>
                      ))}
                      {ing.mensaje && <div className="col-span-full"><p className="font-bold text-gray-400 uppercase tracking-wider mb-0.5">Mensaje</p><p className="text-dark italic">{ing.mensaje}</p></div>}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                      <a href={`https://wa.me/57${ing.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${ing.nombreCompleto.split(' ')[0]}, te escribo de la Guardia Real de Antioquia sobre tu solicitud de ingreso.`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#1ebd5a] text-white text-xs font-semibold rounded-lg transition-colors">WhatsApp</a>
                      <a href={`tel:+57${ing.telefono.replace(/\D/g, '')}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-navy hover:bg-navy/90 text-white text-xs font-semibold rounded-lg transition-colors">Llamar</a>
                      <a href={`mailto:${ing.email}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors">Email</a>
                      <button onClick={() => handleDelete(ing.id, ing.nombreCompleto)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg transition-colors ml-auto"><Trash2 size={13} /> Eliminar</button>
                    </div>

                    {ing.status === 'aceptado' && (
                      <div className="flex items-start gap-2 bg-green-50 border border-green-100 rounded-lg p-3 text-xs text-green-800">
                        <Sparkles size={14} className="shrink-0 mt-0.5 text-green-600" />
                        <span>Al aceptar se creó (o ya existía) su ficha de integrante. Cuando inicie sesión verá un aviso para completar la información que falta.</span>
                      </div>
                    )}

                    {/* Cambiar estado */}
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1"><ArrowRightLeft size={11} /> Cambiar estado</p>
                      <div className="flex flex-wrap gap-2">
                        {(['nuevo','contactado','aceptado','rechazado','cancelado'] as Estado[]).map(s => (
                          <button key={s} onClick={() => handleStatus(ing.id, s)} disabled={ing.status === s} className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors', ing.status === s ? `${STATUS_COLORS[s]} cursor-default ring-2 ring-offset-1 ring-navy/30` : 'bg-white text-gray-600 border border-gray-200 hover:border-navy hover:text-navy')}>{STATUS_LABELS[s]}</button>
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2">Aceptar / Rechazar / Cancelar envía la solicitud al Historial.</p>
                    </div>

                    {/* Comentario + bitácora */}
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1"><MessageSquare size={11} /> Comentarios de gestión</p>
                      <div className="flex gap-2">
                        <input value={comentario[ing.id] ?? ''} onChange={e => setComentario(c => ({ ...c, [ing.id]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') handleComentario(ing.id) }}
                          placeholder="Ej. Llamado el 5 de mayo, audición agendada..."
                          className="flex-1 text-xs px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-royal" />
                        <button onClick={() => handleComentario(ing.id)} className="btn btn-primary btn-sm shrink-0"><Send size={13} /></button>
                      </div>

                      {/* Bitácora (journey) */}
                      {(ing.historial?.length ?? 0) > 0 && (
                        <ol className="relative border-l border-gray-200 ml-1.5 mt-3 space-y-2.5">
                          {[...(ing.historial ?? [])].reverse().map((h, idx) => (
                            <li key={idx} className="ml-3.5">
                              <span className={cn('absolute -left-[5px] w-2.5 h-2.5 rounded-full', h.tipo === 'estado' ? 'bg-royal' : 'bg-gray-300')} />
                              {h.tipo === 'estado' ? (
                                <p className="text-xs text-dark"><strong>{h.por}</strong> cambió el estado a <span className={cn('rounded px-1.5 py-0.5 font-medium', STATUS_COLORS[h.estado ?? ''] ?? '')}>{STATUS_LABELS[h.estado ?? ''] ?? h.estado}</span></p>
                              ) : (
                                <p className="text-xs text-dark"><strong>{h.por}</strong> comentó: <span className="italic text-gray-600">&ldquo;{h.texto}&rdquo;</span></p>
                              )}
                              <p className="text-[10px] text-gray-400">{fechaCorta(h.en)}</p>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
