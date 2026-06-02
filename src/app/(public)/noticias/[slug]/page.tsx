'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Tag, ArrowLeft, Share2, Newspaper } from 'lucide-react'
import { getNewsBySlug, type NewsItem } from '@/lib/firebase'
import { formatDate } from '@/lib/utils'
import PageBanner from '@/components/layout/PageBanner'

export default function NoticiaPage() {
  const { slug }  = useParams<{ slug: string }>()
  const router    = useRouter()
  const [news,    setNews]    = useState<NewsItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied,  setCopied]  = useState(false)

  useEffect(() => {
    if (!slug) return
    getNewsBySlug(slug)
      .then(n => {
        if (!n) { router.replace('/noticias'); return }
        setNews(n)
      })
      .catch(() => router.replace('/noticias'))
      .finally(() => setLoading(false))
  }, [slug, router])

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: news?.title, text: news?.excerpt, url })
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-royal/30 border-t-royal rounded-full animate-spin" />
      </div>
    )
  }

  if (!news) return null

  return (
    <div>
      <PageBanner
        image={news.image ?? '/images/banners/banner-noticias.jpg'}
        eyebrow="Noticias"
        title={news.title}
        subtitle={formatDate(news.publishedAt, { day: 'numeric', month: 'long', year: 'numeric' })}
      />

      <div className="section-container py-16">
        <div className="max-w-3xl mx-auto">

          {/* Back */}
          <Link href="/noticias"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-navy transition-colors mb-8">
            <ArrowLeft size={15} /> Volver a noticias
          </Link>

          {/* Tags */}
          {news.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {news.tags.map(tag => (
                <span key={tag} className="badge bg-navy/10 text-navy flex items-center gap-1 text-xs">
                  <Tag size={10} /> {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="font-display text-navy text-3xl md:text-4xl font-bold uppercase tracking-wider leading-tight mb-4">
            {news.title}
          </h1>

          {/* Meta */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
            <span className="flex items-center gap-1.5 text-sm text-gray-400">
              <Calendar size={14} />
              {formatDate(news.publishedAt, { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-sm text-royal hover:text-navy transition-colors font-medium"
            >
              <Share2 size={14} />
              {copied ? '¡Enlace copiado!' : 'Compartir'}
            </button>
          </div>

          {/* Cover image */}
          {news.image && (
            <div className="mb-8 rounded-2xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={news.image} alt={news.title} className="w-full max-h-96 object-cover" />
            </div>
          )}

          {/* Excerpt */}
          <p className="text-lg text-gray-600 font-serif italic leading-relaxed mb-6 border-l-4 border-gold pl-4">
            {news.excerpt}
          </p>

          {/* Content */}
          {news.content && (
            <div className="prose prose-navy max-w-none">
              {news.content.split('\n').filter(Boolean).map((paragraph, i) => (
                <p key={i} className="text-gray-700 leading-relaxed mb-4 text-base">
                  {paragraph}
                </p>
              ))}
            </div>
          )}

          {/* Share footer */}
          <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400">¿Te gustó esta noticia? Compártela</p>
            <button
              onClick={handleShare}
              className="btn btn-outline btn-md flex items-center gap-2"
            >
              <Share2 size={15} /> {copied ? '¡Copiado!' : 'Compartir enlace'}
            </button>
          </div>

          {/* Back CTA */}
          <div className="mt-8 p-5 bg-gray-50 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Newspaper size={20} className="text-royal shrink-0" />
              <p className="text-sm text-gray-600">Lee más noticias de la Guardia Real</p>
            </div>
            <Link href="/noticias" className="btn btn-primary btn-sm shrink-0">
              Ver todas
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
