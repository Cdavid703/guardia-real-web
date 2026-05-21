'use client'

import { FileText, Download, Upload, Plus, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

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

export default function JuntaPage() {
  const { profile } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (profile && profile.role !== 'junta' && profile.role !== 'admin') {
      router.replace('/dashboard')
    }
  }, [profile, router])

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total documentos', value: MOCK_DOCS.length,    color: 'text-navy' },
          { label: 'Actas',            value: MOCK_DOCS.filter(d=>d.category==='acta').length, color: 'text-purple-700' },
          { label: 'Informes',         value: MOCK_DOCS.filter(d=>d.category==='informe').length, color: 'text-green-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
            <p className={`text-3xl font-bold font-display ${color}`}>{value}</p>
          </div>
        ))}
      </div>

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
