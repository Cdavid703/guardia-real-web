'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  MessageSquare, Search, ChevronDown, Trash2, Phone, Mail, MessageCircle,
  Calendar, MapPin, Users2, FileDown, Clock, CheckCircle2, PhoneCall, XCircle,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getQuoteRequests, updateQuoteStatus, deleteQuote } from '@/lib/firebase'
import { descargarCSV } from '@/lib/integrantes-utils'
import { cn } from '@/lib/utils'

const norm = (s: string) => (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

interface Quote {
  id: string
  name: string
  email: string
  phone: string
  organization?: string
  eventType: string
  eventDate: string
  eventLocation: string
  attendees?: string
  serviceType: 'campo' | 'desfile' | 'ambos'
  message?: string
  status: 'pending' | 'contacted' | 'confirmed' | 'closed'
  notes?: string
  createdAt: Date
}

const SERVICIOS: Record<string, string> = {
  campo:   'Exhibición de campo',
  desfile: 'Show de recorrido / desfile',
  ambos:   'Campo + desfile',
}

const ESTADOS: { value: Quote['status']; label: string; color: string; icon: React.ElementType }[] = [
  { value: 'pending',   label: 'Nueva',       color: 'bg-amber-100 text-amber-700', icon: Clock },
  { value: 'contacted', label: 'Contactado',  color: 'bg-blue-100 text-blue-700',   icon: PhoneCall },
  { value: 'confirmed', label: 'Confirmada',  color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  { value: 'closed',    label: 'Cerrada',     color: 'bg-gray-100 text-gray-500',   icon: XCircle },
]
const estadoDe = (v: string) => ESTADOS.find(e => e.value === v) ?? ESTADOS[0]

export default function QuotesAdminPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtro, setFiltro] = useState<'all' | Quote['status']>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => { if (profile && profile.role !== 'admin') router.replace('/dashboard') }, [profile, router])

  const load = useCallback(async () => {
    setLoading(true)
    try { setQuotes(await getQuoteRequests() as unknown as Quote[]) }
    catch { toast.error('Error al cargar las cotizaciones') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const cambiarEstado = async (q: Quote, status: Quote['status']) => {
    setQuotes(prev => prev.map(x => x.id === q.id ? { ...x, status } : x))
    try { await updateQuoteStatus(q.id, status) ; toast.success(`Cotización marcada como "${estadoDe(status).label}"`) }
    catch { toast.error('No se pudo actualizar'); load() }
  }

  const eliminar = async (q: Quote) => {
    if (!confirm(`¿Eliminar la cotización de ${q.name}?`)) return
    try { await deleteQuote(q.id); toast.success('Cotización eliminada'); load() }
    catch { toast.error('No se pudo eliminar') }
  }

  const responderWhatsApp = (q: Quote) => {
    const tel = (q.phone || '').replace(/\D/g, '')
    if (!tel) { toast.info('Sin teléfono registrado'); return }
    const msg = encodeURIComponent(
      `Hola ${q.name}, te saludamos de la Corporación Musical Guardia Real de Antioquia. ` +
      `Recibimos tu solicitud de cotización para "${q.eventType}" (${q.eventDate}, ${q.eventLocation}) y queremos darte más información. ¿Tienes un momento?`)
    window.open(`https://wa.me/57${tel}?text=${msg}`, '_blank', 'noopener')
  }

  const stats = useMemo(() => ({
    total: quotes.length,
    nuevas: quotes.filter(q => q.status === 'pending').length,
    proceso: quotes.filter(q => q.status === 'contacted').length,
    confirmadas: quotes.filter(q => q.status === 'confirmed').length,
  }), [quotes])

  const filtradas = useMemo(() => {
    const q = norm(search.trim())
    return quotes
      .filter(x => filtro === 'all' || x.status === filtro)
      .filter(x => !q || norm(`${x.name} ${x.email} ${x.eventType} ${x.eventLocation} ${x.organization ?? ''}`).includes(q))
  }, [quotes, search, filtro])

  const exportar = () => {
    descargarCSV('cotizaciones',
      ['Fecha solicitud', 'Nombre', 'Organización', 'Email', 'Teléfono', 'Evento', 'Fecha evento', 'Lugar', 'Asistentes', 'Servicio', 'Estado', 'Mensaje'],
      quotes.map(q => [
        q.createdAt?.toLocaleDateString?.('es-CO') ?? '', q.name, q.organization ?? '', q.email, q.phone,
        q.eventType, q.eventDate, q.eventLocation, q.attendees ?? '', SERVICIOS[q.serviceType] ?? q.serviceType,
        estadoDe(q.status).label, q.message ?? '',
      ]))
    toast.success('Cotizaciones exportadas')
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-navy text-2xl font-bold uppercase tracking-wider flex items-center gap-2">
          <MessageSquare size={22} className="text-royal" /> Cotizaciones
        </h1>
        <p className="text-gray-400 text-sm mt-1">Solicitudes de contratación que llegan desde el formulario del sitio público</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Stat icon={MessageSquare} label="Total" value={stats.total} color="text-navy" />
        <Stat icon={Clock} label="Nuevas" value={stats.nuevas} color="text-amber-600" />
        <Stat icon={PhoneCall} label="En proceso" value={stats.proceso} color="text-blue-600" />
        <Stat icon={CheckCircle2} label="Confirmadas" value={stats.confirmadas} color="text-green-600" />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" placeholder="Buscar por nombre, evento o lugar..." />
        </div>
        {(['all', ...ESTADOS.map(e => e.value)] as const).map(v => (
          <button key={v} onClick={() => setFiltro(v)}
            className={cn('px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
              filtro === v ? 'bg-navy text-white border-navy' : 'bg-white text-gray-600 border-gray-200 hover:border-navy')}>
            {v === 'all' ? 'Todas' : estadoDe(v).label}
            <span className="ml-1.5 opacity-60">{v === 'all' ? quotes.length : quotes.filter(x => x.status === v).length}</span>
          </button>
        ))}
        <button onClick={exportar} className="btn btn-ghost btn-sm ml-auto"><FileDown size={14} /> Exportar</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-royal/30 border-t-royal rounded-full animate-spin" /></div>
      ) : filtradas.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <MessageSquare size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{quotes.length === 0 ? 'Aún no han llegado cotizaciones.' : 'Sin resultados para el filtro.'}</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtradas.map(q => {
            const est = estadoDe(q.status)
            const abierta = expanded === q.id
            return (
              <div key={q.id} className={cn('bg-white border rounded-xl overflow-hidden', q.status === 'pending' ? 'border-amber-200' : 'border-gray-100')}>
                <button onClick={() => setExpanded(abierta ? null : q.id)} className="w-full flex items-center gap-3 p-3 text-left">
                  <ChevronDown size={16} className={cn('text-gray-300 transition-transform shrink-0', abierta && 'rotate-180')} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-dark truncate">{q.name}{q.organization ? ` · ${q.organization}` : ''}</p>
                    <p className="text-xs text-gray-400 truncate">{q.eventType} · {q.eventDate} · {q.eventLocation}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 hidden sm:block shrink-0">{q.createdAt?.toLocaleDateString?.('es-CO') ?? ''}</span>
                  <span className={cn('text-[10px] rounded-full px-2 py-1 font-medium flex items-center gap-1 shrink-0', est.color)}>
                    <est.icon size={11} /> {est.label}
                  </span>
                </button>

                {abierta && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-4 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      {[
                        ['Email', q.email], ['Teléfono', q.phone], ['Organización', q.organization || '—'],
                        ['Tipo de evento', q.eventType], ['Fecha del evento', q.eventDate], ['Lugar', q.eventLocation],
                        ['Asistentes', q.attendees || '—'], ['Servicio', SERVICIOS[q.serviceType] ?? q.serviceType],
                        ['Recibida', q.createdAt?.toLocaleString?.('es-CO') ?? '—'],
                      ].map(([l, v]) => (
                        <div key={l}><p className="font-bold text-gray-400 uppercase tracking-wider mb-0.5">{l}</p><p className="text-dark break-words">{v}</p></div>
                      ))}
                      {q.message && <div className="col-span-full"><p className="font-bold text-gray-400 uppercase tracking-wider mb-0.5">Mensaje</p><p className="text-dark italic">{q.message}</p></div>}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                      {/* Contactar */}
                      <button onClick={() => responderWhatsApp(q)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#1ebd5a] text-white text-xs font-semibold rounded-lg"><MessageCircle size={13} /> WhatsApp</button>
                      <a href={`mailto:${q.email}?subject=${encodeURIComponent('Cotización Guardia Real de Antioquia — ' + q.eventType)}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-navy hover:bg-royal text-white text-xs font-semibold rounded-lg"><Mail size={13} /> Email</a>
                      <a href={`tel:+57${(q.phone || '').replace(/\D/g, '')}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:border-navy text-dark text-xs font-semibold rounded-lg"><Phone size={13} /> Llamar</a>

                      {/* Estado */}
                      <div className="flex items-center gap-1 ml-auto">
                        {ESTADOS.map(e => (
                          <button key={e.value} onClick={() => cambiarEstado(q, e.value)} title={e.label}
                            className={cn('px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all',
                              q.status === e.value ? cn(e.color, 'border-transparent') : 'bg-white text-gray-400 border-gray-200 hover:border-navy hover:text-navy')}>
                            {e.label}
                          </button>
                        ))}
                        <button onClick={() => eliminar(q)} className="w-8 h-8 rounded-lg text-red-400 hover:bg-red-50 flex items-center justify-center"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-6 flex items-center gap-1.5">
        <Calendar size={12} /> Las cotizaciones llegan desde
        <span className="text-royal">/servicios → Contacto</span> y también se notifican por correo.
        <MapPin size={12} className="ml-2" /> <Users2 size={12} />
      </p>
    </div>
  )
}

function Stat({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return <div className="bg-white border border-gray-100 rounded-xl p-4"><Icon size={18} className={cn('mb-1', color)} /><div className={cn('font-display text-2xl font-bold', color)}>{value}</div><div className="text-xs text-gray-400 leading-tight">{label}</div></div>
}
