'use client'

import { useEffect, useState } from 'react'
import { Bell, Calendar } from 'lucide-react'
import { getNewsForRole, type NewsItem } from '@/lib/firebase'
import type { UserRole } from '@/types'

interface Props {
  role: UserRole
}

export default function EquipoNoticiasPanel({ role }: Props) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getNewsForRole(role, 20)
      .then(items => setNews(items.filter(n => !n.visibleTo.includes('public'))))
      .catch(() => setNews([]))
      .finally(() => setLoading(false))
  }, [role])

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-navy text-xl font-bold uppercase tracking-wider flex items-center gap-2">
          <Bell size={20} className="text-royal" />
          Noticias internas
        </h2>
        <p className="text-gray-400 text-sm mt-1">
          Novedades y comunicados publicados por la administración para el personal de la banda
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-royal/30 border-t-royal rounded-full animate-spin" />
        </div>
      ) : news.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <Bell size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay noticias internas publicadas por ahora</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {news.map(n => (
            <div key={n.id} className="card p-5">
              <p className="font-serif font-bold text-navy text-base mb-1">{n.title}</p>
              <p className="text-sm text-gray-600 line-clamp-3 mb-3">{n.excerpt}</p>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Calendar size={12} />
                {new Date(n.publishedAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
