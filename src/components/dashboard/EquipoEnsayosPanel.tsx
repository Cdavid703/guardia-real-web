'use client'

import { useEffect, useState } from 'react'
import { Calendar, MapPin, ClipboardList } from 'lucide-react'
import { getEnsayosForRole } from '@/lib/firebase'
import { toast } from 'sonner'
import type { Ensayo, UserRole } from '@/types'

const ENSAYO_TYPE_INFO: Record<string, { emoji: string; label: string }> = {
  general:    { emoji: '🎺', label: 'Ensayo General' },
  vientos:    { emoji: '🪗', label: 'Solo Vientos' },
  percusion:  { emoji: '🥁', label: 'Solo Percusión' },
  colorguard: { emoji: '🚩', label: 'Solo Color Guard' },
  brass:      { emoji: '📯', label: 'Solo Brass' },
  reunion:    { emoji: '📋', label: 'Reunión' },
}

interface Props {
  role: UserRole
}

export default function EquipoEnsayosPanel({ role }: Props) {
  const [ensayos, setEnsayos] = useState<Ensayo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    getEnsayosForRole(role)
      .then(items => setEnsayos((items as unknown as Ensayo[]).filter(e => e.date >= today)))
      .catch(() => {
        setEnsayos([])
        toast.error('Error al cargar los ensayos')
      })
      .finally(() => setLoading(false))
  }, [role])

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-navy text-xl font-bold uppercase tracking-wider flex items-center gap-2">
          <ClipboardList size={20} className="text-royal" />
          Ensayos
        </h2>
        <p className="text-gray-400 text-sm mt-1">
          Próximos ensayos y reuniones programados por la dirección
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-7 h-7 border-2 border-royal/30 border-t-royal rounded-full animate-spin" />
        </div>
      ) : ensayos.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <Calendar size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay ensayos programados próximamente</p>
          <p className="text-xs mt-1">El director publicará el cronograma aquí</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ensayos.map(en => {
            const info = ENSAYO_TYPE_INFO[en.type] ?? { emoji: '📋', label: en.type }
            return (
              <div key={en.id} className="card p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-navy/8 flex items-center justify-center text-lg shrink-0">
                  {info.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold bg-navy/10 text-navy rounded-full px-2 py-0.5">
                    {info.label}
                  </span>
                  <p className="font-serif font-bold text-navy text-base mt-1">{en.title}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> {en.date}{en.startTime ? ` · ${en.startTime}` : ''}
                    </span>
                    {en.location && (
                      <span className="flex items-center gap-1"><MapPin size={12} /> {en.location}</span>
                    )}
                  </div>
                  {en.objective && <p className="text-sm text-gray-600 mt-2 italic">{en.objective}</p>}
                  {en.notes && <p className="text-xs text-amber-700 mt-2 bg-amber-50 rounded px-2 py-1.5">{en.notes}</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
