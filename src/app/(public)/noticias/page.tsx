'use client'

import { useEffect, useState } from 'react'
import { Calendar, Tag, Newspaper } from 'lucide-react'
import Image from 'next/image'
import { getPublishedNews, type NewsItem } from '@/lib/firebase'
import { formatDate } from '@/lib/utils'
import PageBanner from '@/components/layout/PageBanner'

export default function NoticiasPage() {
  const [news,    setNews]    = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [openId,  setOpenId]  = useState<string | null>(null)

  useEffect(() => {
    getPublishedNews(20)
      .then(setNews)
      .catch(() => setNews([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <PageBanner
        image="/images/banners/banner-noticias.jpg"
        eyebrow="Actualidad"
        title="Noticias"
        subtitle="Lo último de la Guardia Real de Antioquia"
      />

      <div className="section-container py-16">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-royal/30 border-t-royal rounded-full animate-spin" />
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-16 text-gray-400 max-w-md mx-auto">
            <Newspaper size={36} className="mx-auto mb-4 opacity-30" />
            <h3 className="font-serif text-navy text-lg font-bold mb-2">Aún no hay noticias publicadas</h3>
            <p className="text-sm">
              Vuelve pronto. Mientras tanto, síguenos en Instagram para no perderte nada.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {news.map(n => {
              const isOpen = openId === n.id
              return (
                <article key={n.id} className="card overflow-hidden flex flex-col">
                  {/* Image or placeholder */}
                  {n.image ? (
                    <div className="relative h-48 bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={n.image} alt={n.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-primary flex items-center justify-center">
                      <Image
                        src="/images/escudo.png"
                        alt="Guardia Real"
                        width={80}
                        height={80}
                        className="object-contain opacity-30"
                      />
                    </div>
                  )}

                  <div className="p-6 flex flex-col flex-1">
                    {/* Tags */}
                    {n.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {n.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="badge bg-navy/10 text-navy text-[10px]">
                            <Tag size={9} /> {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <h2 className="font-serif font-bold text-navy text-lg leading-tight mb-2">{n.title}</h2>
                    <p className="text-gray-500 text-sm leading-relaxed flex-1 mb-4">{n.excerpt}</p>

                    {/* Expanded content */}
                    {isOpen && n.content && (
                      <div className="mb-4 pb-4 border-t border-gray-100 pt-4">
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                          {n.content}
                        </p>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <span className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Calendar size={12} />
                        {formatDate(n.publishedAt, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      {n.content && (
                        <button
                          onClick={() => setOpenId(isOpen ? null : n.id)}
                          className="text-xs font-semibold text-royal hover:text-navy transition-colors"
                        >
                          {isOpen ? 'Cerrar' : 'Leer más →'}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
