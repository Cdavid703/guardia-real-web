'use client'

import { useEffect, useState, useMemo } from 'react'
import { ClipboardList, ChevronDown, ChevronUp, Trash2, Sparkles, History, Send, MessageSquare, ArrowRightLeft } from 'lucide-react'
import {
  getIngresoRequests, updateIngresoEstado, agregarComentarioIngreso, deleteIngresoRequest,
  getIntegranteByCorreo, upsertIntegrante,
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

export default function SolicitudesPanel({ uid }: { uid: string }) {
  const { profile } = useAuth()
  const actor = profile?.displayName || 'Administración'
  const [ingresos, setIngresos] = useState<(IngresoRequest & { id: string })[]>([])
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [tab, setTab]           = useState<'recientes' | 'historial'>('recientes')
  const [comentario, setComentario] = useState<Record<string, string>>({})

  const fetchIngresos = async () => {
    setLoading(true)
    try { setIngresos(await getIngresoRequests() as (IngresoRequest & { id: string })[]) }
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

  const recientes = useMemo(() => ingresos.filter(i => EN_GESTION.includes(i.status as Estado)), [ingresos])
  const historial = useMemo(() => ingresos.filter(i => EN_HISTORIAL.includes(i.status as Estado)), [ingresos])
  const lista = tab === 'recientes' ? recientes : historial

  return (
    <div>
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
