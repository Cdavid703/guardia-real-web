'use client'

import { useEffect, useState } from 'react'
import { FileText, Download, Upload, Plus, AlertCircle, ClipboardList, ChevronDown, ChevronUp, Calendar, MapPin } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { getIngresoRequests, getEnsayosForRole } from '@/lib/firebase'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { IngresoRequest, Ensayo } from '@/types'

const MOCK_DOCS = [
  { id: '1', title: 'Estatutos de la corporación',  category: 'estatutos', date: '2024-01-15' },
  { id: '2', title: 'Acta de asamblea — Dic 2024',  category: 'acta',      date: '2024-12-10' },
  { id: '3', title: 'Informe de actividades 2024',  category: 'informe',   date: '2024-12-31' },
]

const CATEGORY_COLORS: Record<string, string> = {
  estatutos: 'bg-navy/10 text-navy',
  acta:      'bg-purple-100 text-purple-700',
  informe:   'bg-green-100 text-green-700',
  contrato:  'bg-amber-100 text-amber-700',
  otro:      'bg-gray-100 text-gray-700',
}

const INGRESO_STATUS_COLORS: Record<string, string> = {
  nuevo:      'bg-blue-100 text-blue-700',
  contactado: 'bg-amber-100 text-amber-700',
  aceptado:   'bg-green-100 text-green-700',
  rechazado:  'bg-red-100 text-red-700',
}

const INGRESO_STATUS_LABELS: Record<string, string> = {
  nuevo: 'Nuevo', contactado: 'Contactado', aceptado: 'Aceptado', rechazado: 'Rechazado',
}

const ENSAYO_EMOJI: Record<string, string> = {
  general: '🎺', vientos: '🪗', percusion: '🥁',
  colorguard: '🚩', brass: '📯', reunion: '📋',
}

export default function JuntaPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [ingresos,   setIngresos]   = useState<(IngresoRequest & { id: string })[]>([])
  const [ingLoading, setIngLoading] = useState(true)
  const [expanded,   setExpanded]   = useState<string | null>(null)
  const [ensayos,    setEnsayos]    = useState<Ensayo[]>([])

  useEffect(() => {
    if (profile && profile.role !== 'junta' && profile.role !== 'admin') {
      router.replace('/dashboard')
    }
  }, [profile, router])

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    Promise.all([
      getIngresoRequests(),
      getEnsayosForRole('junta'),
    ]).then(([ing, ens]) => {
      setIngresos(ing as (IngresoRequest & { id: string })[])
      setEnsayos((ens as unknown as Ensayo[]).filter(e => e.date >= today))
    }).catch(() => toast.error('Error al cargar datos'))
    .finally(() => setIngLoading(false))
  }, [])

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-navy text-2xl font-bold uppercase tracking-wider">
            Junta Directiva
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Documentos institucionales, actas e informes
          </p>
        </div>
        <button className="btn btn-primary btn-md">
          <Plus size={16} /> Subir documento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total documentos',      value: MOCK_DOCS.length,                                     color: 'text-navy' },
          { label: 'Actas',                 value: MOCK_DOCS.filter(d=>d.category==='acta').length,      color: 'text-purple-700' },
          { label: 'Informes',              value: MOCK_DOCS.filter(d=>d.category==='informe').length,   color: 'text-green-700' },
          { label: 'Solicitudes ingreso',   value: ingresos.filter(i => i.status === 'nuevo').length,    color: 'text-blue-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
            <p className={`text-3xl font-bold font-display ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Solicitudes de ingreso */}
      <div className="mb-8">
        <h2 className="font-display text-navy text-lg font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
          <ClipboardList size={18} />
          Solicitudes de ingreso
          {ingresos.filter(i => i.status === 'nuevo').length > 0 && (
            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {ingresos.filter(i => i.status === 'nuevo').length} nuevas
            </span>
          )}
        </h2>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {ingLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-7 h-7 border-2 border-royal/30 border-t-royal rounded-full animate-spin" />
            </div>
          ) : ingresos.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <ClipboardList size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No hay solicitudes de ingreso todavía</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {ingresos.map(ing => (
                <div key={ing.id} className="px-5 py-4">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpanded(expanded === ing.id ? null : ing.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-navy text-white text-sm font-bold flex items-center justify-center shrink-0">
                        {ing.nombreCompleto?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-dark">{ing.nombreCompleto}</p>
                        <p className="text-xs text-gray-400">{ing.instrumentoInteres} · {ing.ciudad}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn('badge text-xs', INGRESO_STATUS_COLORS[ing.status] ?? 'bg-gray-100 text-gray-600')}>
                        {INGRESO_STATUS_LABELS[ing.status] ?? ing.status}
                      </span>
                      {expanded === ing.id
                        ? <ChevronUp size={15} className="text-gray-400" />
                        : <ChevronDown size={15} className="text-gray-400" />}
                    </div>
                  </div>
                  {expanded === ing.id && (
                    <div className="mt-3 ml-12 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                      {[
                        ['Email',            ing.email],
                        ['Teléfono',         ing.telefono],
                        ['Instrumento',      ing.instrumentoInteres],
                        ['Disponibilidad',   ing.disponibilidad],
                        ['Barrio / Ciudad',  `${ing.barrio}, ${ing.ciudad}`],
                        ['Experiencia',      ing.experienciaPrevia ? `Sí — ${ing.nivelExperiencia}` : 'No'],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <p className="font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                          <p className="text-dark">{value}</p>
                        </div>
                      ))}
                      {ing.mensaje && (
                        <div className="col-span-full">
                          <p className="font-bold text-gray-400 uppercase tracking-wider mb-0.5">Mensaje</p>
                          <p className="text-dark italic">{ing.mensaje}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ensayos y reuniones */}
      {ensayos.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display text-navy text-lg font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
            <Calendar size={18} />
            Próximos ensayos / reuniones
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ensayos.slice(0, 6).map(en => (
              <div key={en.id} className="card p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-navy/8 flex items-center justify-center text-xl shrink-0">
                  {ENSAYO_EMOJI[en.type] ?? '📋'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-serif font-bold text-navy text-sm">{en.title}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar size={10} /> {en.date}{en.startTime ? ` · ${en.startTime}` : ''}
                    </span>
                    {en.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={10} /> {en.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload area */}
      <div className="card p-6 mb-6 border border-dashed border-gray-300">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-navy/10 flex items-center justify-center shrink-0">
            <Upload size={20} className="text-navy" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-dark text-sm">Subir nuevo documento</p>
            <p className="text-xs text-gray-400">PDF, Word, Excel — máximo 20MB por archivo</p>
          </div>
          <button className="btn btn-outline btn-sm">Seleccionar archivo</button>
        </div>
      </div>

      {/* Docs list */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-serif font-bold text-navy">Documentos institucionales</h3>
          <select className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-dark focus:outline-none focus:border-royal">
            <option value="">Todos los tipos</option>
            <option value="acta">Actas</option>
            <option value="informe">Informes</option>
            <option value="estatutos">Estatutos</option>
            <option value="contrato">Contratos</option>
          </select>
        </div>

        <div className="divide-y divide-gray-100">
          {MOCK_DOCS.map(doc => (
            <div key={doc.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                  <FileText size={17} className="text-navy" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-dark">{doc.title}</p>
                  <p className="text-xs text-gray-400">{doc.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`badge ${CATEGORY_COLORS[doc.category] || CATEGORY_COLORS.otro}`}>
                  {doc.category}
                </span>
                <button className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-navy hover:text-white transition-all">
                  <Download size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
        <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">
          Los documentos subidos aquí son visibles únicamente para miembros de la Junta Directiva y Administradores.
          Para documentos de uso general de la banda, utiliza la sección de noticias.
        </p>
      </div>
    </div>
  )
}
