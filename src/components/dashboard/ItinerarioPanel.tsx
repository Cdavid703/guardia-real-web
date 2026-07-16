'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import {
  CalendarClock, Download, MapPin, Clock, Shirt, AlertCircle, CheckCircle2, ShieldCheck,
  CalendarPlus, ListChecks, X, XCircle, Users2,
} from 'lucide-react'
import Accordion from '@/components/ui/Accordion'
import { useAuth } from '@/contexts/AuthContext'
import { itinerarioActivo, type EventoItinerario } from '@/lib/itinerarios'
import {
  getMiIntegrante, confirmarEventoItinerario, getMisConfirmaciones, getConfirmacionesEvento,
  type EstadoConfirmacion,
} from '@/lib/firebase'
import type { UserRole } from '@/types'
import { cn } from '@/lib/utils'

const puedeGestionar = (r: UserRole) => r === 'admin' || r === 'director'

function diaLegible(iso: string) {
  try {
    const s = new Date(iso + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
    return s.charAt(0).toUpperCase() + s.slice(1)
  } catch { return iso }
}

// ── Calendario (.ics) ───────────────────────────────────────────────
function horaA24(hora: string): [number, number] {
  const m = hora.match(/(\d{1,2}):(\d{2})\s*(a\.?\s*m\.?|p\.?\s*m\.?)?/i)
  if (!m) return [9, 0]
  let h = Number(m[1]); const min = Number(m[2])
  if (m[3] && /p/i.test(m[3]) && h < 12) h += 12
  if (m[3] && /a/i.test(m[3]) && h === 12) h = 0
  return [h, min]
}
function descargarICS(e: EventoItinerario) {
  const [h, min] = horaA24(e.hora)
  const [y, mo, d] = e.fechaISO.split('-')
  const p = (n: number) => String(n).padStart(2, '0')
  const start = `${y}${mo}${d}T${p(h)}${p(min)}00`
  const endH = (h + 2) % 24
  const end = `${y}${mo}${d}T${p(endH)}${p(min)}00`
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Guardia Real de Antioquia//Itinerario//ES',
    'BEGIN:VEVENT', `UID:${e.id}@guardiarealdeantioquia.com`, `DTSTART:${start}`, `DTEND:${end}`,
    `SUMMARY:${e.evento} — Guardia Real`, `LOCATION:${e.lugar}`,
    'DESCRIPTION:Estar completamente uniformado y listo en el punto de inicio. Guardia Real de Antioquia.',
    'BEGIN:VALARM', 'TRIGGER:-PT12H', 'ACTION:DISPLAY', 'DESCRIPTION:Recordatorio Guardia Real', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
  const a = document.createElement('a'); a.href = url; a.download = `${e.id}.ics`; a.click()
  URL.revokeObjectURL(url)
}

// ── Checklist "qué llevar" (local) ──────────────────────────────────
const CHECKLIST = ['Uniforme completo y planchado', 'Documento de identidad', 'Medicamentos (si aplica)', 'Hidratación / agua', 'Dinero', 'Celular cargado', 'Instrumento y accesorios']

function ChecklistEvento({ eventoId }: { eventoId: string }) {
  const key = `gra-checklist-${eventoId}`
  const [marcados, setMarcados] = useState<Record<string, boolean>>({})
  useEffect(() => {
    try { setMarcados(JSON.parse(localStorage.getItem(key) || '{}')) } catch { /* vacío */ }
  }, [key])
  const toggle = (item: string) => setMarcados(prev => {
    const next = { ...prev, [item]: !prev[item] }
    try { localStorage.setItem(key, JSON.stringify(next)) } catch { /* ignora */ }
    return next
  })
  const hechos = CHECKLIST.filter(i => marcados[i]).length
  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1"><ListChecks size={12} /> Qué llevar ({hechos}/{CHECKLIST.length})</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
        {CHECKLIST.map(item => (
          <label key={item} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={!!marcados[item]} onChange={() => toggle(item)} className="w-4 h-4 accent-royal" />
            <span className={cn(marcados[item] && 'line-through text-gray-400')}>{item}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

export default function ItinerarioPanel({ role }: { role: UserRole }) {
  const { profile } = useAuth()
  const it = itinerarioActivo()
  const [miId, setMiId] = useState<string>('')
  const [misConf, setMisConf] = useState<Record<string, EstadoConfirmacion>>({})
  const [guardando, setGuardando] = useState<string>('')
  const [verConf, setVerConf] = useState<EventoItinerario | null>(null)
  const gestiona = puedeGestionar(role)

  const load = useCallback(async () => {
    if (!profile || !it) return
    try {
      const f = await getMiIntegrante(profile.uid)
      if (f) { setMiId(f.id); setMisConf(await getMisConfirmaciones(it.id, f.id)) }
    } catch { /* silencioso */ }
  }, [profile, it])
  useEffect(() => { load() }, [load])

  const confirmar = async (e: EventoItinerario, estado: EstadoConfirmacion) => {
    if (!miId || !profile) { toast.error('No encontramos tu ficha de integrante'); return }
    setGuardando(e.id)
    setMisConf(prev => ({ ...prev, [e.id]: estado }))
    try {
      await confirmarEventoItinerario(it!.id, e.id, miId, `${profile.displayName}`.trim() || 'Integrante', estado)
      toast.success(estado === 'asiste' ? '¡Confirmado! Nos vemos ahí.' : 'Registramos que no puedes asistir.')
    } catch { toast.error('No se pudo guardar'); load() }
    finally { setGuardando('') }
  }

  if (!it) {
    return (
      <div className="card text-center py-16 text-gray-400">
        <CalendarClock size={36} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">No hay un itinerario activo por ahora.</p>
      </div>
    )
  }

  const normas = [
    { id: 'preparacion', title: '1. Preparación física, mental e hidratación', badge: '💪', content: (
      <ul className="space-y-1.5 text-sm text-gray-700">
        {['Alimentación saludable y balanceada.', 'Consumir agua y bebidas hidratantes con frecuencia.', 'Dormir y descansar bien antes de cada jornada.', 'Evitar actividades externas que generen fatiga o alteren el descanso.', 'Abstenerse de bebidas alcohólicas, energizantes en exceso y productos con mucha azúcar.', 'Estiramientos antes y después de las jornadas cuando sea posible.'].map((t, i) => <li key={i} className="flex gap-2"><CheckCircle2 size={14} className="text-royal shrink-0 mt-0.5" />{t}</li>)}
      </ul>) },
    { id: 'instrucciones', title: '2. Cumplimiento de instrucciones y puntualidad', badge: '⏱️', content: (
      <div className="space-y-2 text-sm text-gray-700">
        <p>Acata las instrucciones de la Junta Directiva, líder musical, líder de percusión, líder coreográfico, staff y responsables. Cumple el itinerario, asiste puntualmente, permanece con el grupo e informa cualquier novedad.</p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2"><AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" /><p className="text-amber-800"><strong>Las horas del cronograma</strong> son el momento de estar <strong>completamente uniformado y listo</strong> en el punto de inicio, no la hora de salir de casa.</p></div>
      </div>) },
    { id: 'respeto', title: '3. Respeto y convivencia', badge: '🤝', content: (
      <ul className="space-y-1.5 text-sm text-gray-700">
        {['Respeta a compañeros, organizadores, artistas invitados, otras bandas y al público.', 'Cuida los espacios, instalaciones y escenarios visitados.', 'Cuida los bienes institucionales y las pertenencias de terceros.', 'Evita discusiones o comportamientos que afecten la imagen institucional.'].map((t, i) => <li key={i} className="flex gap-2"><CheckCircle2 size={14} className="text-royal shrink-0 mt-0.5" />{t}</li>)}
      </ul>) },
    { id: 'cuidado', title: '4. Cuidado de instrumentos y elementos', badge: '🎺', content: (
      <div className="space-y-2 text-sm text-gray-700">
        <p>Cada integrante responde por el uso, cuidado y conservación de instrumentos, uniformes, accesorios y demás elementos entregados. En caso de pérdida o daño por mal uso o negligencia, deberá asumir los costos.</p>
        <p><strong>Elementos personales:</strong> cada quien es el único responsable de su celular, documentos, dinero, accesorios y objetos de valor. La Corporación no responde por pérdidas por descuido.</p>
      </div>) },
    { id: 'salud', title: '5. Condiciones de salud', badge: '🩺', content: (
      <ul className="space-y-1.5 text-sm text-gray-700">
        {['Informa previamente a la Junta Directiva cualquier condición médica, enfermedad, alergia o situación de salud.', 'Porta los medicamentos formulados y garantiza su disponibilidad durante todo el desplazamiento.', 'Informa oportunamente cualquier cambio en tu estado de salud.'].map((t, i) => <li key={i} className="flex gap-2"><CheckCircle2 size={14} className="text-royal shrink-0 mt-0.5" />{t}</li>)}
      </ul>) },
    { id: 'conducta', title: '6. Conducta durante presentaciones', badge: '🚫', content: (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800"><p className="font-semibold mb-1 flex items-center gap-1.5"><AlertCircle size={15} /> Falta grave</p><p>Bajo ninguna circunstancia se permite presentarse bajo efectos del alcohol o sustancias psicoactivas, consumirlas antes o durante las actividades, ni portarlas en desplazamientos o presentaciones. Se espera comportamiento ejemplar dentro y fuera del escenario.</p></div>) },
    { id: 'uniforme', title: '7. Uniforme y presentación personal', badge: '👔', content: (
      <div className="space-y-4 text-sm text-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><p className="font-bold text-navy mb-1.5">Caballeros</p><ul className="space-y-1">{['Barba afeitada o perfilada.', 'Uñas cortas y limpias.', 'Cabello limpio y con el corte establecido (orienta Juan David Seguro).', 'Recoger el cabello según indicaciones si se requiere.'].map((t, i) => <li key={i} className="flex gap-2"><CheckCircle2 size={13} className="text-navy shrink-0 mt-0.5" />{t}</li>)}</ul></div>
          <div><p className="font-bold text-navy mb-1.5">Damas</p><ul className="space-y-1">{['Aretes tipo perla blanca.', 'Maquillaje institucional asignado.', 'Uñas transparentes con delineado blanco.', 'Cabello limpio y recogido; portar dona, gel y elementos del peinado.'].map((t, i) => <li key={i} className="flex gap-2"><CheckCircle2 size={13} className="text-navy shrink-0 mt-0.5" />{t}</li>)}</ul></div>
        </div>
        <p>El uniforme se usa exactamente como lo establece la Corporación: limpio, planchado (con paño protector), en excelente estado y completo. Transpórtalo en portatraje individual.</p>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3"><p className="font-semibold text-red-800 mb-1">No permitido</p><p className="text-red-700">Piercings visibles, expansores, topos no autorizados, manillas, cadenas ni accesorios visibles no autorizados. Retíralos antes de iniciar.</p></div>
        <div className="flex gap-2 items-start bg-navy/5 rounded-lg p-3 border border-navy/10"><ShieldCheck size={15} className="text-royal shrink-0 mt-0.5" /><p>La <strong>revisión del uniforme</strong> se hace a diario, individual y por secciones, antes de abordar el transporte y antes de cada presentación. A cargo de <strong>Dairo Villada, Sebastián Álvarez y Nubia Otálvaro</strong>.</p></div>
      </div>) },
    { id: 'comportamiento', title: '8. Comportamiento institucional', badge: '⭐', content: (
      <div className="space-y-2 text-sm text-gray-700"><p>Cada integrante representa permanentemente a la Corporación. Mantén excelente actitud, respeto, lenguaje adecuado, disciplina, trabajo en equipo, sentido de pertenencia, responsabilidad y compromiso.</p><p className="text-xs text-gray-500 italic">La participación en las actividades implica el conocimiento y aceptación de las disposiciones de este instructivo.</p></div>) },
  ]

  return (
    <div>
      {/* Hero con escudo + gato */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy to-[#0a2350] p-6 sm:p-8 mb-6">
        <div className="absolute -right-6 -bottom-6 opacity-10"><Image src="/images/escudo.png" alt="" width={170} height={170} /></div>
        <div className="absolute right-4 top-4 opacity-90 hidden sm:block"><Image src="/images/mascota.png" alt="Mascota Guardia Real" width={76} height={76} className="drop-shadow-lg" /></div>
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-gold/15 border border-gold/30 text-gold text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3"><CalendarClock size={12} /> Itinerario de presentaciones</div>
          <h2 className="font-display text-white text-2xl sm:text-3xl font-bold uppercase tracking-wider">{it.titulo}</h2>
          <p className="text-gray-300 text-sm mt-2 max-w-2xl">{it.descripcion}</p>
          {it.pdfUrl && <a href={it.pdfUrl} download className="btn btn-gold btn-sm mt-4"><Download size={15} /> Descargar instructivo (PDF)</a>}
        </div>
      </div>

      <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 flex gap-2.5">
        <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">Las horas indican estar <strong>completamente uniformado y listo</strong> en el punto de inicio. Los <strong>puntos de encuentro</strong> se informan por <strong>WhatsApp</strong>. Confirma tu asistencia a cada presentación 👇</p>
      </div>

      {/* Cronograma */}
      <h3 className="font-serif font-bold text-navy text-lg mb-3">Cronograma</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {it.cronograma.map(e => {
          const estado = misConf[e.id]
          return (
            <div key={e.id} className="card p-0 overflow-hidden border-t-4 border-gold">
              <div className="bg-gradient-to-br from-navy to-[#0a2350] p-4">
                <p className="text-gold text-[11px] font-bold uppercase tracking-widest">{diaLegible(e.fechaISO)}</p>
                <h4 className="font-serif font-bold text-white text-lg leading-tight mt-0.5">{e.evento}</h4>
                <p className="text-gray-300 text-sm flex items-center gap-1 mt-1"><MapPin size={12} /> {e.lugar}</p>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-navy bg-gold/15 rounded-lg px-2.5 py-1"><Clock size={14} /> {e.hora}</span>
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 rounded-lg px-2.5 py-1"><MapPin size={12} /> {e.puntoEncuentro}</span>
                  <button onClick={() => descargarICS(e)} className="inline-flex items-center gap-1 text-xs text-royal hover:underline"><CalendarPlus size={13} /> Agregar al calendario</button>
                </div>

                {/* Confirmación */}
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => confirmar(e, 'asiste')} disabled={guardando === e.id}
                    className={cn('btn btn-sm', estado === 'asiste' ? 'btn-primary' : 'btn-ghost', 'disabled:opacity-60')}>
                    <CheckCircle2 size={14} /> {estado === 'asiste' ? 'Asistiré ✓' : 'Asistiré'}
                  </button>
                  <button onClick={() => confirmar(e, 'no')} disabled={guardando === e.id}
                    className={cn('btn btn-sm', estado === 'no' ? 'bg-red-500 text-white hover:bg-red-600' : 'btn-ghost', 'disabled:opacity-60')}>
                    <XCircle size={14} /> No puedo
                  </button>
                  {gestiona && (
                    <button onClick={() => setVerConf(e)} className="btn btn-ghost btn-sm ml-auto text-royal"><Users2 size={13} /> Confirmados</button>
                  )}
                </div>

                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1"><Shirt size={12} /> Uniforme del día</p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700">
                    {e.uniforme.map((u, j) => <li key={j} className="flex gap-1.5"><CheckCircle2 size={13} className="text-royal shrink-0 mt-0.5" />{u}</li>)}
                  </ul>
                </div>

                <ChecklistEvento eventoId={e.id} />
              </div>
            </div>
          )
        })}
      </div>

      <h3 className="font-serif font-bold text-navy text-lg mb-3">Disposiciones generales</h3>
      <Accordion items={normas} singleOpen defaultOpenIds={['instrucciones']} />

      <p className="text-xs text-gray-400 text-center mt-8">Información exclusiva para el personal de la Corporación Musical Guardia Real de Antioquia.</p>

      {verConf && <ConfirmadosModal itinerarioId={it.id} evento={verConf} onClose={() => setVerConf(null)} />}
    </div>
  )
}

function ConfirmadosModal({ itinerarioId, evento, onClose }: { itinerarioId: string; evento: EventoItinerario; onClose: () => void }) {
  const [lista, setLista] = useState<{ nombre: string; estado: EstadoConfirmacion }[] | null>(null)
  useEffect(() => { getConfirmacionesEvento(itinerarioId, evento.id).then(setLista).catch(() => setLista([])) }, [itinerarioId, evento.id])
  const asisten = lista?.filter(l => l.estado === 'asiste') ?? []
  const noPueden = lista?.filter(l => l.estado === 'no') ?? []

  return (
    <div className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-navy px-5 py-4 flex items-center justify-between">
          <div className="text-white min-w-0"><p className="font-serif font-bold truncate">{evento.evento}</p><p className="text-gray-300 text-xs">{diaLegible(evento.fechaISO)} · {evento.hora}</p></div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-5">
          {lista === null ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-royal/30 border-t-royal rounded-full animate-spin" /></div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4 text-center">
                <div className="bg-green-50 rounded-xl p-3"><div className="font-display text-2xl font-bold text-green-600">{asisten.length}</div><div className="text-xs text-gray-400">Asistirán</div></div>
                <div className="bg-red-50 rounded-xl p-3"><div className="font-display text-2xl font-bold text-red-500">{noPueden.length}</div><div className="text-xs text-gray-400">No pueden</div></div>
              </div>
              {asisten.length > 0 && <p className="text-[11px] font-bold text-green-600 uppercase tracking-wide mb-1">Asistirán</p>}
              <ul className="mb-3">{asisten.map((l, i) => <li key={i} className="text-sm text-dark py-1 flex items-center gap-2"><CheckCircle2 size={14} className="text-green-500" />{l.nombre}</li>)}</ul>
              {noPueden.length > 0 && <p className="text-[11px] font-bold text-red-500 uppercase tracking-wide mb-1">No pueden</p>}
              <ul>{noPueden.map((l, i) => <li key={i} className="text-sm text-gray-500 py-1 flex items-center gap-2"><XCircle size={14} className="text-red-400" />{l.nombre}</li>)}</ul>
              {lista.length === 0 && <p className="text-sm text-gray-400 text-center py-6">Aún nadie ha confirmado.</p>}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
