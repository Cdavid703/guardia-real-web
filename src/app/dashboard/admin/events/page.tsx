'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Plus, Edit2, Trash2, Calendar, ArrowLeft, ChevronLeft, ChevronRight,
  Eye, EyeOff, Bell, BellOff, ExternalLink, MapPin, Clock,
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { getAllEvents, createEvent, updateEvent, deleteEvent } from '@/lib/firebase'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────
type EventType = 'presentacion' | 'concurso' | 'desfile' | 'reunion' | 'otro'
type Audience  = 'public' | 'integrante' | 'director' | 'junta' | 'admin'

interface EventForm {
  id:          string | null
  title:       string
  description: string
  type:        EventType
  date:        string
  startTime:   string
  endTime:     string
  location:    string
  address:     string
  city:        string
  image:       string
  isPublic:    boolean
  visibleTo:   Audience[]
}

const EMPTY: EventForm = {
  id: null, title: '', description: '', type: 'presentacion',
  date: '', startTime: '', endTime: '', location: '', address: '',
  city: 'Medellín', image: '', isPublic: false,
  visibleTo: ['integrante', 'director', 'admin'],
}

const EVENT_TYPES: { value: EventType; label: string; emoji: string }[] = [
  { value: 'presentacion', label: 'Presentación',    emoji: '🎺' },
  { value: 'concurso',     label: 'Concurso',        emoji: '🏆' },
  { value: 'desfile',      label: 'Desfile',         emoji: '🥁' },
  { value: 'reunion',      label: 'Reunión',         emoji: '📋' },
  { value: 'otro',         label: 'Otro',            emoji: '📌' },
]

const AUDIENCE_OPTIONS: { value: Audience; label: string }[] = [
  { value: 'public',     label: 'Público general' },
  { value: 'integrante', label: 'Integrantes' },
  { value: 'director',   label: 'Directores' },
  { value: 'junta',      label: 'Junta directiva' },
  { value: 'admin',      label: 'Administradores' },
]

// ── Google Calendar URL ────────────────────────────────────────────
function googleCalendarUrl(event: {
  title: string; date: string; startTime: string; endTime?: string
  location?: string; description?: string
}): string {
  const start = `${event.date.replace(/-/g, '')}T${event.startTime.replace(':', '')}00`
  const end   = event.endTime
    ? `${event.date.replace(/-/g, '')}T${event.endTime.replace(':', '')}00`
    : `${event.date.replace(/-/g, '')}T${event.startTime.replace(':', '')}00`
  const params = new URLSearchParams({
    action:   'TEMPLATE',
    text:     `${event.title} — Guardia Real de Antioquia`,
    dates:    `${start}/${end}`,
    details:  event.description ?? 'Evento de la Corporación Musical Guardia Real de Antioquia',
    location: event.location ?? '',
    ctz:      'America/Bogota',
  })
  return `https://calendar.google.com/calendar/render?${params}`
}

// ── Mini Calendar ──────────────────────────────────────────────────
function MiniCalendar({
  eventDates, selectedDate, onSelect,
}: { eventDates: Set<string>; selectedDate: string | null; onSelect: (d: string | null) => void }) {
  const today = new Date()
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const prev = () => { if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1) }
  const next = () => { if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1) }

  const cells = Array.from({ length: firstDay }, () => null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  )

  return (
    <div className="card p-4 select-none">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="p-1 rounded hover:bg-gray-100"><ChevronLeft size={16} /></button>
        <p className="font-serif font-bold text-navy text-sm">{MONTHS[month]} {year}</p>
        <button onClick={next} className="p-1 rounded hover:bg-gray-100"><ChevronRight size={16} /></button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {['D','L','M','X','J','V','S'].map(d => (
          <div key={d} className="text-[10px] font-bold text-gray-400 py-1">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />
          const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          const hasEvent = eventDates.has(dateStr)
          const isSelected = selectedDate === dateStr
          const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
          return (
            <button
              key={day}
              onClick={() => onSelect(isSelected ? null : dateStr)}
              className={cn(
                'relative w-7 h-7 mx-auto rounded-full text-xs transition-colors flex items-center justify-center',
                isSelected ? 'bg-royal text-white font-bold' :
                isToday ? 'border border-royal text-royal font-bold' :
                'hover:bg-gray-100 text-gray-700'
              )}
            >
              {day}
              {hasEvent && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold" />
              )}
            </button>
          )
        })}
      </div>
      {selectedDate && (
        <button onClick={() => onSelect(null)} className="mt-2 text-xs text-gray-400 hover:text-navy w-full text-center">
          Limpiar filtro
        </button>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────
export default function AdminEventsPage() {
  const { profile } = useAuth()
  const router      = useRouter()

  const [events,       setEvents]       = useState<Record<string, unknown>[]>([])
  const [loading,      setLoading]      = useState(true)
  const [showForm,     setShowForm]     = useState(false)
  const [form,         setForm]         = useState<EventForm>(EMPTY)
  const [saving,       setSaving]       = useState(false)
  const [notifying,    setNotifying]    = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => {
    if (profile && profile.role !== 'admin') router.replace('/dashboard')
  }, [profile, router])

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try { setEvents(await getAllEvents()) }
    catch { toast.error('Error al cargar los eventos') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  const eventDates = new Set(events.map(e => e.date as string))
  const filtered   = selectedDate ? events.filter(e => e.date === selectedDate) : events

  const startCreate = () => { setForm(EMPTY); setShowForm(true) }
  const startEdit   = (e: Record<string, unknown>) => {
    setForm({
      id:          e.id as string,
      title:       (e.title       as string) ?? '',
      description: (e.description as string) ?? '',
      type:        (e.type        as EventType) ?? 'presentacion',
      date:        (e.date        as string) ?? '',
      startTime:   (e.startTime   as string) ?? '',
      endTime:     (e.endTime     as string) ?? '',
      location:    (e.location    as string) ?? '',
      address:     (e.address     as string) ?? '',
      city:        (e.city        as string) ?? 'Medellín',
      image:       (e.image       as string) ?? '',
      isPublic:    (e.isPublic    as boolean) ?? false,
      visibleTo:   ((e.visibleTo  as Audience[]) ?? []).filter(Boolean),
    })
    setShowForm(true)
  }

  const toggleAudience = (v: Audience) => {
    setForm(prev => {
      const has  = prev.visibleTo.includes(v)
      const next = has ? prev.visibleTo.filter(a => a !== v) : [...prev.visibleTo, v]
      return { ...prev, visibleTo: next }
    })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.date) { toast.error('Título y fecha son obligatorios'); return }
    setSaving(true)
    try {
      const payload = {
        title:       form.title.trim(),
        description: form.description.trim(),
        type:        form.type,
        date:        form.date,
        startTime:   form.startTime,
        endTime:     form.endTime || null,
        location:    form.location.trim(),
        address:     form.address.trim(),
        city:        form.city.trim(),
        image:       form.image.trim() || null,
        isPublic:    form.isPublic,
        visibleTo:   form.visibleTo,
        createdBy:   profile?.uid ?? '',
      }
      if (form.id) { await updateEvent(form.id, payload); toast.success('Evento actualizado') }
      else         { await createEvent(payload);          toast.success('Evento creado') }
      setShowForm(false)
      setForm(EMPTY)
      fetchEvents()
    } catch { toast.error('Error al guardar') }
    finally { setSaving(false) }
  }

  const handleDelete = async (ev: Record<string, unknown>) => {
    if (!confirm(`¿Eliminar "${ev.title}"?`)) return
    try { await deleteEvent(ev.id as string); toast.success('Eliminado'); fetchEvents() }
    catch { toast.error('Error al eliminar') }
  }

  const handleNotify = async (ev: Record<string, unknown>) => {
    setNotifying(true)
    try {
      const r = await fetch('/api/events/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: ev }),
      })
      if (!r.ok) throw new Error()
      toast.success('Notificaciones enviadas')
      fetchEvents()
    } catch { toast.error('Error enviando notificaciones') }
    finally { setNotifying(false) }
  }

  const togglePublic = async (ev: Record<string, unknown>) => {
    try {
      await updateEvent(ev.id as string, { isPublic: !ev.isPublic })
      toast.success(!ev.isPublic ? 'Publicado en la web' : 'Ocultado del público')
      fetchEvents()
    } catch { toast.error('Error') }
  }

  const typeLabel = (t: string) => EVENT_TYPES.find(x => x.value === t) ?? { emoji: '📌', label: t }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <Link href="/dashboard/admin" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-navy mb-1">
            <ArrowLeft size={12} /> Volver
          </Link>
          <h1 className="font-display text-navy text-2xl font-bold uppercase tracking-wider">Eventos</h1>
          <p className="text-gray-400 text-sm mt-1">Gestiona presentaciones, concursos y eventos de la banda</p>
        </div>
        {!showForm && (
          <button onClick={startCreate} className="btn btn-primary btn-md">
            <Plus size={16} /> Nuevo evento
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px,1fr] gap-6">
        {/* Calendar sidebar */}
        <div className="space-y-4">
          <MiniCalendar
            eventDates={eventDates}
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
          />
          <div className="card p-4 text-xs text-gray-500 space-y-1.5">
            <p className="font-bold text-dark text-xs uppercase tracking-wider mb-2">Leyenda</p>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Público (aparece en /eventos)</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-royal inline-block" /> Interno (solo miembros)</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-gold inline-block" /> Día con eventos</div>
          </div>
        </div>

        <div className="space-y-5">
          {/* Form */}
          {showForm && (
            <div className="card p-6 border-l-4 border-royal">
              <h3 className="font-serif font-bold text-navy text-lg mb-4">
                {form.id ? 'Editar evento' : 'Nuevo evento'}
              </h3>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-dark mb-1.5">Título *</label>
                    <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                      className="input" placeholder="Ej. Feria de las Flores 2026 — Desfile de Silleteros" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark mb-1.5">Tipo de evento</label>
                    <select value={form.type} onChange={e => setForm({...form, type: e.target.value as EventType})} className="input">
                      {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark mb-1.5">Fecha *</label>
                    <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="input" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark mb-1.5">Hora de inicio</label>
                    <input type="time" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark mb-1.5">Hora de fin</label>
                    <input type="time" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark mb-1.5">Lugar / Nombre del sitio</label>
                    <input value={form.location} onChange={e => setForm({...form, location: e.target.value})}
                      className="input" placeholder="Ej. Estadio Atanasio Girardot" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark mb-1.5">Ciudad</label>
                    <input value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="input" placeholder="Medellín" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-dark mb-1.5">Dirección exacta</label>
                    <input value={form.address} onChange={e => setForm({...form, address: e.target.value})}
                      className="input" placeholder="Calle, carrera, barrio..." />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-dark mb-1.5">Descripción</label>
                    <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                      className="input resize-none" rows={3}
                      placeholder="Descripción visible en el sitio web si el evento es público..." />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-dark mb-1.5">URL imagen del evento <span className="font-normal text-gray-400">(opcional)</span></label>
                    <input value={form.image} onChange={e => setForm({...form, image: e.target.value})}
                      className="input" placeholder="https://..." />
                  </div>
                </div>

                {/* Visibility */}
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm font-semibold text-dark mb-2">¿Quién puede ver este evento?</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {AUDIENCE_OPTIONS.map(opt => {
                      const checked = form.visibleTo.includes(opt.value)
                      return (
                        <label key={opt.value} className={cn(
                          'flex items-center gap-2 p-2.5 border-2 rounded-lg cursor-pointer text-sm transition-colors',
                          checked ? 'border-royal bg-royal/5' : 'border-gray-200 hover:border-gray-300'
                        )}>
                          <input type="checkbox" checked={checked} onChange={() => toggleAudience(opt.value)}
                            className="w-4 h-4 accent-royal" />
                          {opt.label}
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Public toggle */}
                <div className="border-t border-gray-100 pt-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={form.isPublic}
                      onChange={e => setForm({
                        ...form,
                        isPublic: e.target.checked,
                        visibleTo: e.target.checked
                          ? [...new Set([...form.visibleTo, 'public' as Audience])]
                          : form.visibleTo.filter(a => a !== 'public'),
                      })}
                      className="w-5 h-5 mt-0.5 accent-royal" />
                    <div>
                      <p className="text-sm font-semibold text-dark">Publicar en el sitio web</p>
                      <p className="text-xs text-gray-500">
                        El evento aparecerá en <code>/eventos</code> y los visitantes recibirán notificación por correo.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={saving} className="btn btn-primary btn-md disabled:opacity-60">
                    {saving ? 'Guardando...' : form.id ? 'Guardar cambios' : 'Crear evento'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost btn-md">Cancelar</button>
                </div>
              </form>
            </div>
          )}

          {/* Event list */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-7 h-7 border-2 border-royal/30 border-t-royal rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Calendar size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm mb-4">{selectedDate ? `Sin eventos el ${selectedDate}` : 'No hay eventos'}</p>
                {!selectedDate && (
                  <button onClick={startCreate} className="btn btn-primary btn-sm"><Plus size={14} /> Crear el primero</button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filtered.map(ev => {
                  const type = typeLabel(ev.type as string)
                  const gcUrl = googleCalendarUrl({
                    title: ev.title as string,
                    date:  ev.date as string,
                    startTime: ev.startTime as string,
                    endTime:   ev.endTime as string | undefined,
                    location:  ev.location as string,
                    description: ev.description as string,
                  })
                  return (
                    <div key={ev.id as string} className="p-4 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="text-xl shrink-0 mt-0.5">{type.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={cn(
                              'text-[10px] font-bold rounded-full px-2 py-0.5',
                              ev.isPublic ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                            )}>
                              {ev.isPublic ? '🌐 Público' : '🔒 Interno'}
                            </span>
                            <span className="badge bg-navy/10 text-navy text-[10px]">{type.label}</span>
                          </div>
                          <h3 className="font-serif font-bold text-navy text-base">{ev.title as string}</h3>
                          <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar size={11} /> {ev.date as string}
                              {ev.startTime && ` · ${ev.startTime as string}`}
                            </span>
                            {ev.location && (
                              <span className="flex items-center gap-1"><MapPin size={11} />{ev.location as string}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-1.5 shrink-0">
                          <a href={gcUrl} target="_blank" rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-royal transition-colors"
                            title="Agregar a Google Calendar">
                            <ExternalLink size={15} />
                          </a>
                          <button onClick={() => togglePublic(ev)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-navy transition-colors"
                            title={ev.isPublic ? 'Ocultar del público' : 'Publicar en web'}>
                            {ev.isPublic ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                          <button onClick={() => handleNotify(ev)} disabled={notifying}
                            className="p-2 rounded-lg hover:bg-gold/20 text-gray-500 hover:text-amber-600 transition-colors disabled:opacity-40"
                            title="Enviar notificación por correo">
                            {ev.notified ? <BellOff size={15} /> : <Bell size={15} />}
                          </button>
                          <button onClick={() => startEdit(ev)}
                            className="p-2 rounded-lg hover:bg-royal/10 text-gray-500 hover:text-royal transition-colors">
                            <Edit2 size={15} />
                          </button>
                          <button onClick={() => handleDelete(ev)}
                            className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                      {/* Google Calendar CTA */}
                      <div className="mt-2 ml-8">
                        <a href={gcUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-royal hover:text-navy font-medium">
                          <Clock size={11} /> Agregar a Google Calendar
                        </a>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
