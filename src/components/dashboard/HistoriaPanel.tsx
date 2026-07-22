'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, MapPin, Calendar, ChevronRight, History, Clock, Shirt, Camera, Video, Download, CheckCircle2 } from 'lucide-react'
import CalarcaPanel from '@/components/dashboard/CalarcaPanel'
import { ITINERARIOS } from '@/lib/itinerarios'
import { GALERIAS, fotoUrl } from '@/lib/galerias'

interface ItemHistoria {
  id:      string
  titulo:  string
  fecha:   string
  lugar:   string
  imagen?: string
  render:  () => React.ReactNode
}

/** Archivo del fin de semana 18–20 de julio: cronograma cumplido + galerías. */
function FinDeSemanaJulio2026() {
  const it = ITINERARIOS.find(i => i.id === 'jul-18-20-2026')
  if (!it) return null
  const dia = (iso: string) => {
    const s = new Date(iso + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
    return s.charAt(0).toUpperCase() + s.slice(1)
  }
  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy to-[#0a2350] p-6 sm:p-8 mb-6">
        <div className="absolute -right-6 -bottom-6 opacity-10"><Image src="/images/escudo.png" alt="" width={160} height={160} /></div>
        <div className="absolute right-4 top-4 opacity-90 hidden sm:block"><Image src="/images/mascota.png" alt="" width={70} height={70} className="drop-shadow-lg" /></div>
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-gold/15 border border-gold/30 text-gold text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
            <CheckCircle2 size={12} /> Fin de semana cumplido
          </div>
          <h2 className="font-display text-white text-2xl font-bold uppercase tracking-wider">{it.titulo}</h2>
          <p className="text-gray-300 text-sm mt-2 max-w-2xl">
            Cuatro presentaciones en tres días: la Guardia Real llevó su música a San Antonio de Prado,
            Santa Elena, La Ceja y el Concurso de Bandas de Bello. Un fin de semana de intensa
            actividad institucional cumplido con disciplina, progreso y honor.
          </p>
          {it.pdfUrl && <a href={it.pdfUrl} download className="btn btn-gold btn-sm mt-4"><Download size={14} /> Instructivo original (PDF)</a>}
        </div>
      </div>

      {/* Cronograma cumplido */}
      <h3 className="font-serif font-bold text-navy text-lg mb-3">Presentaciones realizadas</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {it.cronograma.map(e => (
          <div key={e.id} className="card p-4 border-l-4 border-green-400">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{dia(e.fechaISO)}</p>
            <p className="font-serif font-bold text-navy leading-tight mt-0.5">{e.evento}</p>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><MapPin size={11} className="text-royal" /> {e.lugar}</p>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><Clock size={11} /> {e.hora} · <Shirt size={11} /> {e.uniforme[0]}</p>
          </div>
        ))}
      </div>

      {/* Galerías */}
      <h3 className="font-serif font-bold text-navy text-lg mb-3">Galerías del fin de semana</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {GALERIAS.map(g => (
          <Link key={g.slug} href={`/galeria/${g.slug}`} className="group rounded-2xl overflow-hidden border border-gray-200 hover:border-gold/60 shadow-sm hover:shadow-lg transition-all">
            <div className="relative aspect-[4/3]">
              <Image src={fotoUrl(g.slug, g.cover)} alt={g.tituloCorto} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/15 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="font-display text-white text-sm font-bold uppercase tracking-wide leading-tight">{g.tituloCorto}</p>
                <p className="text-gold text-[10px]">{g.fecha}</p>
                <div className="flex items-center gap-2.5 text-[10px] text-gray-300 mt-1">
                  <span className="flex items-center gap-1"><Camera size={10} className="text-gold" /> {g.fotos}</span>
                  {g.videos > 0 && <span className="flex items-center gap-1"><Video size={10} className="text-gold" /> {g.videos}</span>}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

const ITEMS: ItemHistoria[] = [
  {
    id: 'jul-18-20-2026',
    titulo: 'Fin de semana 18–20 de julio',
    fecha: '18 al 20 de julio de 2026',
    lugar: 'Prado · Santa Elena · La Ceja · Bello',
    imagen: fotoUrl('virgen-del-carmen-2026', 8),
    render: () => <FinDeSemanaJulio2026 />,
  },
  {
    id: 'calarca-2026',
    titulo: 'Viaje a Calarcá',
    fecha: '14 de junio de 2026',
    lugar: 'Calarcá, Quindío',
    imagen: '/images/galeria/calarca-2026/calarca-20.jpg',
    render: () => <CalarcaPanel />,
  },
]

/** Apartado de Historia: archivo de viajes y eventos pasados de la banda. */
export default function HistoriaPanel() {
  const [open, setOpen] = useState<string | null>(null)
  const item = ITEMS.find(i => i.id === open)

  if (item) {
    return (
      <div>
        <button onClick={() => setOpen(null)} className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-navy mb-4">
          <ArrowLeft size={14} /> Volver a Historia
        </button>
        {item.render()}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <History size={18} className="text-royal" />
        <h3 className="font-serif font-bold text-navy text-lg">Historia de la banda</h3>
      </div>
      <p className="text-gray-400 text-sm mb-5">Viajes, concursos y eventos de la Guardia Real. Toca uno para ver la reseña completa.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ITEMS.map(i => (
          <button key={i.id} onClick={() => setOpen(i.id)}
            className="group text-left rounded-2xl overflow-hidden border border-gray-200 hover:border-royal/40 hover:shadow-md transition-all">
            <div className="relative h-32 bg-navy">
              {i.imagen && <Image src={i.imagen} alt={i.titulo} fill className="object-cover opacity-70 group-hover:opacity-90 transition-opacity" />}
              <div className="absolute inset-0 bg-gradient-to-t from-navy/90 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4">
                <p className="font-display text-white text-base font-bold uppercase tracking-wide leading-tight">{i.titulo}</p>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="text-xs text-gray-500 space-y-0.5">
                <p className="flex items-center gap-1.5"><Calendar size={11} className="text-royal" /> {i.fecha}</p>
                <p className="flex items-center gap-1.5"><MapPin size={11} className="text-royal" /> {i.lugar}</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-royal transition-colors" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
