'use client'

import { useEffect, useState } from 'react'
import { Calendar, Tag, Newspaper, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { getPublishedNews, type NewsItem } from '@/lib/firebase'
import { formatDate } from '@/lib/utils'
import PageBanner from '@/components/layout/PageBanner'

const PAGE_SIZE = 9

export default function NoticiasPage() {
  const [news,    setNews]    = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page,    setPage]    = useState(1)

  const fetchNews = async (pageNum: number, append = false) => {
    if (pageNum === 1) setLoading(true)
    else setLoadingMore(true)
    try {
      const data = await getPublishedNews(pageNum * PAGE_SIZE)
      if (append) {
        setNews(data)
      } else {
        setNews(data)
      }
      setHasMore(data.length === pageNum * PAGE_SIZE)
    } catch {
      setNews([])
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => { fetchNews(1) }, [])

  const handleLoadMore = async () => {
    const next = page + 1
    setPage(next)
    await fetchNews(next, true)
  }

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
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {news.map(n => (
                <article key={n.id} className="card overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
                  {/* Image */}
                  {n.image ? (
                    <div className="relative h-48 bg-gray-100 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={n.image} alt={n.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-primary flex items-center justify-center">
                      <Image src="/images/escudo.png" alt="Guardia Real"
                        width={80} height={80} className="object-contain opacity-30" />
                    </div>
                  )}

                  <div className="p-6 flex flex-col flex-1">
                    {n.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {n.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="badge bg-navy/10 text-navy text-[10px]">
                            <Tag size={9} /> {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <h2 className="font-serif font-bold text-navy text-lg leading-tight mb-2 group-hover:text-royal transition-colors">
                      {n.title}
                    </h2>
                    <p className="text-gray-500 text-sm leading-relaxed flex-1 mb-4 line-clamp-3">
                      {n.excerpt}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <span className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Calendar size={12} />
                        {formatDate(n.publishedAt, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <Link
                        href={`/noticias/${n.slug}`}
                        className="text-xs font-semibold text-royal hover:text-navy transition-colors"
                      >
                        Leer más →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="text-center mt-12">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="btn btn-outline btn-md min-w-[180px] disabled:opacity-60"
                >
                  {loadingMore ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-royal/30 border-t-royal rounded-full animate-spin" />
                      Cargando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <ChevronDown size={16} /> Ver más noticias
                    </span>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
