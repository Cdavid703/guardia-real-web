'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar, MapPin, Clock, ArrowRight } from 'lucide-react'
import { getPublicUpcomingEvents } from '@/lib/firebase'

interface PublicEvent {
  id:          string
  title:       string
  date:        string
  startTime:   string
  endTime:     string
  location:    string
  type:        string
  description: string
}

const TYPE_LABELS: Record<string, string> = {
  ensayo:       'Ensayo',
  presentacion: 'Presentación',
  concurso:     'Concurso',
  reunion:      'Reunión',
  evento:       'Evento',
}

const TYPE_COLORS: Record<string, string> = {
  presentacion: 'bg-gold/20 text-gold',
  concurso:     'bg-red-500/20 text-red-300',
  ensayo:       'bg-royal/20 text-sky',
  reunion:      'bg-blue-500/20 text-blue-300',
  evento:       'bg-white/10 text-gray-200',
}

function formatDate(isoDate: string): { day: string; month: string; weekday: string } {
  if (!isoDate) return { day: '--', month: '---', weekday: '' }
  const d = new Date(isoDate + 'T00:00:00')
  return {
    day:     d.getDate().toString().padStart(2, '0'),
    month:   d.toLocaleDateString('es-CO', { month: 'short' }).toUpperCase().replace('.', ''),
    weekday: d.toLocaleDateString('es-CO', { weekday: 'long' }),
  }
}

interface Props {
  /** Si true, muestra solo 3 eventos y un CTA "Ver todos". */
  preview?: boolean
}

export default function UpcomingEventsSection({ preview = false }: Props) {
  const [events,  setEvents]  = useState<PublicEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPublicUpcomingEvents(preview ? 3 : 20)
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }, [preview])

  if (loading) {
    return (
      <section className="py-16 bg-near-black text-white">
        <div className="section-container text-center">
          <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto" />
        </div>
      </section>
    )
  }

  if (events.length === 0) {
    // No mostramos la sección vacía en el home (preview), pero sí en /eventos
    if (preview) return null
    return (
      <section className="py-16 bg-near-black text-white">
        <div className="section-container text-center">
          <Calendar size={36} className="mx-auto text-gold/40 mb-4" />
          <p className="text-gray-400">Aún no hay eventos públicos programados. ¡Vuelve pronto!</p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-near-black text-white">
      <div className="section-container">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="section-label mb-3">Agenda</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wider mb-3">
            Próximos eventos
          </h2>
          <div className="divider-gold max-w-xs mx-auto mb-3" />
          <p className="text-gray-400 text-sm">
            Encuéntranos en estas presentaciones y eventos
          </p>
        </div>

        {/* Lista */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {events.map(ev => {
            const { day, month, weekday } = formatDate(ev.date)
            return (
              <article
                key={ev.id}
                className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-gold/40 transition-colors group"
              >
                <div className="flex">
                  {/* Fecha */}
                  <div className="bg-gold text-near-black px-4 py-5 flex flex-col items-center justify-center min-w-[80px] shrink-0">
                    <p className="font-display text-3xl font-bold leading-none">{day}</p>
                    <p className="text-xs font-bold tracking-wider mt-1">{month}</p>
                  </div>

                  {/* Info */}
                  <div className="p-4 flex-1 min-w-0">
                    <span className={`badge text-[10px] ${TYPE_COLORS[ev.type] ?? TYPE_COLORS.evento}`}>
                      {TYPE_LABELS[ev.type] ?? ev.type}
                    </span>
                    <h3 className="font-serif font-bold text-base mt-2 mb-1 leading-tight group-hover:text-gold transition-colors">
                      {ev.title}
                    </h3>
                    <p className="text-xs text-gray-400 capitalize mb-3">{weekday}</p>

                    <div className="space-y-1.5 text-xs text-gray-300">
                      {(ev.startTime || ev.endTime) && (
                        <div className="flex items-center gap-1.5">
                          <Clock size={11} className="text-gold/70 shrink-0" />
                          <span>
                            {ev.startTime}
                            {ev.endTime && ` – ${ev.endTime}`}
                          </span>
                        </div>
                      )}
                      {ev.location && (
                        <div className="flex items-start gap-1.5">
                          <MapPin size={11} className="text-gold/70 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{ev.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {ev.description && !preview && (
                  <div className="px-4 pb-4 -mt-1">
                    <p className="text-xs text-gray-400 leading-relaxed line-clamp-3 pt-2 border-t border-white/5">
                      {ev.description}
                    </p>
                  </div>
                )}
              </article>
            )
          })}
        </div>

        {/* CTA "Ver todos" en preview */}
        {preview && (
          <div className="text-center mt-10">
            <Link href="/eventos" className="btn btn-outline-white btn-md inline-flex">
              Ver todos los eventos
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
