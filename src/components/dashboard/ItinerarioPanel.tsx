'use client'

import Image from 'next/image'
import {
  CalendarClock, Download, MapPin, Clock, Shirt, AlertCircle, CheckCircle2, ShieldCheck,
} from 'lucide-react'
import Accordion from '@/components/ui/Accordion'
import { itinerarioActivo } from '@/lib/itinerarios'

function diaLegible(iso: string) {
  try {
    const s = new Date(iso + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
    return s.charAt(0).toUpperCase() + s.slice(1)
  } catch { return iso }
}

export default function ItinerarioPanel() {
  const it = itinerarioActivo()

  if (!it) {
    return (
      <div className="card text-center py-16 text-gray-400">
        <CalendarClock size={36} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">No hay un itinerario activo por ahora.</p>
      </div>
    )
  }

  const normas = [
    {
      id: 'preparacion', title: '1. Preparación física, mental e hidratación', badge: '💪',
      content: (
        <ul className="space-y-1.5 text-sm text-gray-700">
          {[
            'Alimentación saludable y balanceada.',
            'Consumir agua y bebidas hidratantes con frecuencia.',
            'Dormir y descansar bien antes de cada jornada.',
            'Evitar actividades externas que generen fatiga o alteren el descanso.',
            'Abstenerse de bebidas alcohólicas, energizantes en exceso y productos con mucha azúcar.',
            'Realizar estiramientos antes y después de las jornadas cuando sea posible.',
          ].map((t, i) => <li key={i} className="flex gap-2"><CheckCircle2 size={14} className="text-royal shrink-0 mt-0.5" />{t}</li>)}
        </ul>
      ),
    },
    {
      id: 'instrucciones', title: '2. Cumplimiento de instrucciones y puntualidad', badge: '⏱️',
      content: (
        <div className="space-y-2 text-sm text-gray-700">
          <p>Acata las instrucciones de la Junta Directiva, líder musical, líder de percusión, líder coreográfico, staff y responsables de cada actividad. Cumple el itinerario, asiste puntualmente, permanece con el grupo e informa cualquier novedad.</p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
            <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-amber-800"><strong>Las horas del cronograma</strong> son el momento de estar <strong>completamente uniformado y listo</strong> en el punto de inicio, no la hora de salir de casa.</p>
          </div>
        </div>
      ),
    },
    {
      id: 'respeto', title: '3. Respeto y convivencia', badge: '🤝',
      content: (
        <ul className="space-y-1.5 text-sm text-gray-700">
          {[
            'Respeta a compañeros, organizadores, artistas invitados, otras bandas y al público.',
            'Cuida los espacios, instalaciones y escenarios visitados.',
            'Cuida los bienes institucionales y las pertenencias de terceros.',
            'Evita discusiones o comportamientos que afecten la imagen institucional.',
          ].map((t, i) => <li key={i} className="flex gap-2"><CheckCircle2 size={14} className="text-royal shrink-0 mt-0.5" />{t}</li>)}
        </ul>
      ),
    },
    {
      id: 'cuidado', title: '4. Cuidado de instrumentos y elementos', badge: '🎺',
      content: (
        <div className="space-y-2 text-sm text-gray-700">
          <p>Cada integrante responde por el uso, cuidado y conservación de instrumentos, uniformes, accesorios y demás elementos entregados por la Corporación. En caso de pérdida o daño por mal uso o negligencia, deberá asumir los costos.</p>
          <p><strong>Elementos personales:</strong> cada quien es el único responsable de su celular, documentos, dinero, accesorios, elementos de aseo y objetos de valor. La Corporación no responde por pérdidas por descuido.</p>
        </div>
      ),
    },
    {
      id: 'salud', title: '5. Condiciones de salud', badge: '🩺',
      content: (
        <ul className="space-y-1.5 text-sm text-gray-700">
          {[
            'Informa previamente a la Junta Directiva cualquier condición médica, enfermedad, alergia o situación de salud.',
            'Porta los medicamentos formulados por tu médico y garantiza su disponibilidad durante todo el desplazamiento.',
            'Informa oportunamente cualquier cambio en tu estado de salud.',
          ].map((t, i) => <li key={i} className="flex gap-2"><CheckCircle2 size={14} className="text-royal shrink-0 mt-0.5" />{t}</li>)}
        </ul>
      ),
    },
    {
      id: 'conducta', title: '6. Conducta durante presentaciones', badge: '🚫',
      content: (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
          <p className="font-semibold mb-1 flex items-center gap-1.5"><AlertCircle size={15} /> Falta grave</p>
          <p>Bajo ninguna circunstancia se permite presentarse bajo efectos del alcohol o sustancias psicoactivas, consumirlas antes o durante las actividades, ni portarlas en los desplazamientos o presentaciones. Se espera comportamiento ejemplar dentro y fuera del escenario.</p>
        </div>
      ),
    },
    {
      id: 'uniforme', title: '7. Uniforme y presentación personal', badge: '👔',
      content: (
        <div className="space-y-4 text-sm text-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="font-bold text-navy mb-1.5">Caballeros</p>
              <ul className="space-y-1">
                {['Barba afeitada o perfilada.', 'Uñas cortas y limpias.', 'Cabello limpio y con el corte establecido (orienta Juan David Seguro).', 'Recoger el cabello según indicaciones si se requiere.'].map((t, i) => <li key={i} className="flex gap-2"><CheckCircle2 size={13} className="text-navy shrink-0 mt-0.5" />{t}</li>)}
              </ul>
            </div>
            <div>
              <p className="font-bold text-navy mb-1.5">Damas</p>
              <ul className="space-y-1">
                {['Aretes tipo perla blanca.', 'Maquillaje institucional asignado.', 'Uñas transparentes con delineado blanco.', 'Cabello limpio y recogido; portar dona, gel y elementos del peinado.'].map((t, i) => <li key={i} className="flex gap-2"><CheckCircle2 size={13} className="text-navy shrink-0 mt-0.5" />{t}</li>)}
              </ul>
            </div>
          </div>
          <p>El uniforme se usa exactamente como lo establece la Corporación: limpio, planchado (con paño protector), en excelente estado y completo. Transpórtalo en portatraje individual.</p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="font-semibold text-red-800 mb-1">No permitido durante actividades oficiales</p>
            <p className="text-red-700">Piercings visibles, expansores, topos no autorizados, manillas, cadenas ni accesorios visibles no autorizados. Retíralos antes de iniciar.</p>
          </div>
          <div className="flex gap-2 items-start bg-navy/5 rounded-lg p-3 border border-navy/10">
            <ShieldCheck size={15} className="text-royal shrink-0 mt-0.5" />
            <p>La <strong>revisión del uniforme</strong> se hace a diario, individual y por secciones, antes de abordar el transporte y antes de cada presentación. A cargo de <strong>Dairo Villada, Sebastián Álvarez y Nubia Otálvaro</strong>.</p>
          </div>
        </div>
      ),
    },
    {
      id: 'comportamiento', title: '8. Comportamiento institucional', badge: '⭐',
      content: (
        <div className="space-y-2 text-sm text-gray-700">
          <p>Cada integrante representa permanentemente a la Corporación. Mantén excelente actitud, respeto, lenguaje adecuado, disciplina, trabajo en equipo, sentido de pertenencia, responsabilidad y compromiso.</p>
          <p className="text-xs text-gray-500 italic">La participación en las actividades implica el conocimiento y aceptación de las disposiciones de este instructivo.</p>
        </div>
      ),
    },
  ]

  return (
    <div>
      {/* Hero con escudo + gato */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy to-[#0a2350] p-6 sm:p-8 mb-6">
        <div className="absolute -right-6 -bottom-6 opacity-10"><Image src="/images/escudo.png" alt="" width={170} height={170} /></div>
        <div className="absolute right-4 top-4 opacity-90 hidden sm:block"><Image src="/images/mascota.png" alt="Mascota Guardia Real" width={76} height={76} className="drop-shadow-lg" /></div>
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-gold/15 border border-gold/30 text-gold text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
            <CalendarClock size={12} /> Itinerario de presentaciones
          </div>
          <h2 className="font-display text-white text-2xl sm:text-3xl font-bold uppercase tracking-wider">{it.titulo}</h2>
          <p className="text-gray-300 text-sm mt-2 max-w-2xl">{it.descripcion}</p>
          {it.pdfUrl && (
            <a href={it.pdfUrl} download className="btn btn-gold btn-sm mt-4"><Download size={15} /> Descargar instructivo (PDF)</a>
          )}
        </div>
      </div>

      {/* Aviso de puntualidad */}
      <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 flex gap-2.5">
        <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">Las horas indican estar <strong>completamente uniformado y listo</strong> en el punto de inicio. Los <strong>puntos de encuentro</strong> y la hora de apertura de la sede se informan por <strong>WhatsApp</strong>.</p>
      </div>

      {/* Cronograma */}
      <h3 className="font-serif font-bold text-navy text-lg mb-3">Cronograma</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {it.cronograma.map((e, i) => (
          <div key={i} className="card p-0 overflow-hidden border-t-4 border-gold">
            <div className="bg-gradient-to-br from-navy to-[#0a2350] p-4">
              <p className="text-gold text-[11px] font-bold uppercase tracking-widest">{diaLegible(e.fechaISO)}</p>
              <h4 className="font-serif font-bold text-white text-lg leading-tight mt-0.5">{e.evento}</h4>
              <p className="text-gray-300 text-sm flex items-center gap-1 mt-1"><MapPin size={12} /> {e.lugar}</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-navy bg-gold/15 rounded-lg px-2.5 py-1"><Clock size={14} /> {e.hora}</span>
                <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 rounded-lg px-2.5 py-1"><MapPin size={12} /> {e.puntoEncuentro}</span>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1"><Shirt size={12} /> Uniforme del día</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700">
                  {e.uniforme.map((u, j) => <li key={j} className="flex gap-1.5"><CheckCircle2 size={13} className="text-royal shrink-0 mt-0.5" />{u}</li>)}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Normas */}
      <h3 className="font-serif font-bold text-navy text-lg mb-3">Disposiciones generales</h3>
      <Accordion items={normas} singleOpen defaultOpenIds={['instrucciones']} />

      <p className="text-xs text-gray-400 text-center mt-8">
        Información exclusiva para el personal de la Corporación Musical Guardia Real de Antioquia.
      </p>
    </div>
  )
}
