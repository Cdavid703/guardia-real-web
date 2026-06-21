'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ArrowLeft, MapPin, Calendar, ChevronRight, History } from 'lucide-react'
import CalarcaPanel from '@/components/dashboard/CalarcaPanel'

interface ItemHistoria {
  id:      string
  titulo:  string
  fecha:   string
  lugar:   string
  imagen?: string
  render:  () => React.ReactNode
}

const ITEMS: ItemHistoria[] = [
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
