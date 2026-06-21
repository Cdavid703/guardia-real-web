'use client'

import { useEffect, useState } from 'react'
import { Cake } from 'lucide-react'
import { getAllIntegrantes, type IntegranteBase } from '@/lib/firebase'

const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

/** Tarjeta de cumpleaños del mes — visible para cualquier integrante de la banda. */
export default function CumpleanosBanda() {
  const [items, setItems] = useState<IntegranteBase[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const mes = new Date().getMonth() + 1
    getAllIntegrantes()
      .then(all => setItems(all.filter(i => i.cumpleMes === mes).sort((a, b) => (a.cumpleDia ?? 0) - (b.cumpleDia ?? 0))))
      .catch(() => setItems([]))
      .finally(() => setLoaded(true))
  }, [])

  if (!loaded || items.length === 0) return null

  const hoy = new Date().getDate()

  return (
    <div className="card border-l-4 border-pink-300 p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Cake size={16} className="text-pink-500" />
        <h3 className="font-serif font-bold text-navy text-sm">Cumpleaños de {MESES[new Date().getMonth()]} 🎂</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map(i => {
          const esHoy = i.cumpleDia === hoy
          return (
            <span key={i.id}
              className={esHoy
                ? 'text-xs bg-pink-500 text-white rounded-full px-2.5 py-1 font-semibold'
                : 'text-xs bg-pink-50 text-pink-700 rounded-full px-2.5 py-1'}>
              <strong>{i.cumpleDia}</strong> · {i.nombre} {i.apellidos}{esHoy ? ' · ¡hoy! 🎉' : ''}
            </span>
          )
        })}
      </div>
    </div>
  )
}
