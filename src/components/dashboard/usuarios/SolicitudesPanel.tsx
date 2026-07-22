'use client'

import { useEffect, useState } from 'react'
import { ClipboardList, ChevronDown, ChevronUp, Trash2, Sparkles } from 'lucide-react'
import {
  getIngresoRequests, updateIngresoStatus, deleteIngresoRequest,
  getIntegranteByCorreo, upsertIntegrante,
} from '@/lib/firebase'
import { getSeccion } from '@/lib/secciones'
import { cn, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import type { IngresoRequest, Integrante } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  nuevo: 'bg-blue-100 text-blue-700', contactado: 'bg-amber-100 text-amber-700',
  aceptado: 'bg-green-100 text-green-700', rechazado: 'bg-red-100 text-red-700',
}
const STATUS_LABELS: Record<string, string> = { nuevo: 'Nuevo', contactado: 'Contactado', aceptado: 'Aceptado', rechazado: 'Rechazado' }

export default function SolicitudesPanel({ uid }: { uid: string }) {
  const [ingresos, setIngresos] = useState<(IngresoRequest & { id: string })[]>([])
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter]     = useState<'todas' | 'nuevo' | 'contactado' | 'aceptado' | 'rechazado'>('todas')

  const fetchIngresos = async () => {
    setLoading(true)
    try { setIngresos(await getIngresoRequests() as (IngresoRequest & { id: string })[]) }
    catch { toast.error('Error al cargar solicitudes de ingreso') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchIngresos() }, [])

  const handleStatus = async (id: string, status: 'nuevo' | 'contactado' | 'aceptado' | 'rechazado') => {
    try {
      await updateIngresoStatus(id, status, undefined, uid)
      setIngresos(prev => prev.map(i => i.id === id ? { ...i, status } : i))
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

  const handleNotes = async (id: string, notes: string) => {
    try {
      const ing = ingresos.find(i => i.id === id); if (!ing) return
      await updateIngresoStatus(id, ing.status, notes, uid)
      setIngresos(prev => prev.map(i => i.id === id ? { ...i, notes } : i))
      toast.success('Nota guardada')
    } catch { toast.error('Error al guardar la nota') }
  }

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar la solicitud de ${nombre}?`)) return
    try { await deleteIngresoRequest(id); setIngresos(prev => prev.filter(i => i.id !== id)); toast.success('Solicitud eliminada') }
    catch { toast.error('Error al eliminar') }
  }

  const handleLimpiar = async () => {
    const rech = ingresos.filter(i => i.status === 'rechazado')
    if (!rech.length) { toast.info('No hay solicitudes rechazadas'); return }
    if (!confirm(`¿Eliminar ${rech.length} solicitud(es) rechazada(s)?`)) return
    try { await Promise.all(rech.map(i => deleteIngresoRequest(i.id))); setIngresos(prev => prev.filter(i => i.status !== 'rechazado')); toast.success(`${rech.length} eliminada(s)`) }
    catch { toast.error('Error al limpiar') }
  }

  const filtered = filter === 'todas' ? ingresos : ingresos.filter(i => i.status === filter)

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
        <p className="text-gray-400 text-sm">
          {ingresos.filter(i => i.status === 'nuevo').length} nuevas sin revisar · {ingresos.length} en el historial
        </p>
        {ingresos.some(i => i.status === 'rechazado') && (
          <button onClick={handleLimpiar} className="btn btn-ghost btn-sm text-red-500 hover:bg-red-50"><Trash2 size={14} /> Limpiar rechazadas</button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {([['todas','Todas'],['nuevo','Nuevas'],['contactado','Contactadas'],['aceptado','Aceptadas'],['rechazado','Rechazadas']] as const).map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} className={cn('px-3 py-1.5 rounded-full text-xs font-semibold border transition-all', filter === v ? 'bg-navy text-white border-navy' : 'bg-white text-gray-600 border-gray-200 hover:border-navy hover:text-navy')}>
            {l}<span className="ml-1.5 opacity-60">{v === 'todas' ? ingresos.length : ingresos.filter(i => i.status === v).length}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-10"><div className="w-6 h-6 border-2 border-royal/30 border-t-royal rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400"><ClipboardList size={32} className="mx-auto mb-3 opacity-30" /><p className="text-sm">{ingresos.length === 0 ? 'No hay solicitudes todavía' : 'No hay solicitudes en este estado'}</p></div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map(ing => (
              <div key={ing.id} className="px-5 py-4">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(expanded === ing.id ? null : ing.id)}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-navy text-white text-sm font-bold flex items-center justify-center shrink-0">{ing.nombreCompleto?.[0]?.toUpperCase() ?? '?'}</div>
                    <div><p className="text-sm font-semibold text-dark">{ing.nombreCompleto}</p><p className="text-xs text-gray-400">{ing.instrumentoInteres} · {ing.telefono}</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn('badge text-xs', STATUS_COLORS[ing.status] ?? 'bg-gray-100 text-gray-600')}>{STATUS_LABELS[ing.status] ?? ing.status}</span>
                    <p className="text-xs text-gray-400 hidden sm:block">{formatDate(ing.createdAt as Date, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    {expanded === ing.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>
                {expanded === ing.id && (
                  <div className="mt-4 ml-12 space-y-4">
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
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px] mb-2">Cambiar estado</p>
                      <div className="flex flex-wrap gap-2">
                        {(['nuevo','contactado','aceptado','rechazado'] as const).map(s => (
                          <button key={s} onClick={() => handleStatus(ing.id, s)} disabled={ing.status === s} className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors', ing.status === s ? `${STATUS_COLORS[s]} cursor-default ring-2 ring-offset-1 ring-navy/30` : 'bg-white text-gray-600 border border-gray-200 hover:border-navy hover:text-navy')}>{STATUS_LABELS[s]}</button>
                        ))}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px] mb-2">Notas internas</p>
                      <textarea defaultValue={ing.notes ?? ''} onBlur={e => { const n = e.target.value.trim(); if (n !== (ing.notes ?? '')) handleNotes(ing.id, n) }} rows={2} placeholder="Ej. Llamado el 5 de mayo, audición agendada..." className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-royal resize-none" />
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
