'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Instagram, ExternalLink, Loader2 } from 'lucide-react'

interface InstaPost {
  id:            string
  media_type:    'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  media_url:     string
  thumbnail_url?: string
  caption?:      string
  permalink:     string
}

export default function GaleriaPage() {
  const [posts,   setPosts]   = useState<InstaPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  useEffect(() => {
    fetch('/api/instagram')
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(true); return }
        const media = (data.data as InstaPost[]).filter(
          p => p.media_type === 'IMAGE' || p.media_type === 'CAROUSEL_ALBUM'
        )
        setPosts(media)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-hero py-20 text-white text-center">
        <p className="section-label mb-3">Nuestro trabajo</p>
        <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-wider mb-4">
          Galería
        </h1>
        <div className="divider-gold max-w-xs mx-auto mb-4" />
        <a
          href="https://www.instagram.com/bandashowguardiareal"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-gold transition-colors"
        >
          <Instagram size={16} />
          @bandashowguardiareal
        </a>
      </div>

      <div className="section-container py-16">

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 size={36} className="text-royal animate-spin" />
            <p className="text-gray-400 text-sm">Cargando fotos de Instagram...</p>
          </div>
        )}

        {/* No token / error — fallback elegante */}
        {!loading && (error || posts.length === 0) && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#833ab4] via-[#fd1d1d] to-[#fcb045] mb-6">
              <Instagram size={36} className="text-white" />
            </div>
            <h2 className="font-display text-navy text-2xl font-bold uppercase tracking-wider mb-3">
              Síguenos en Instagram
            </h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Toda nuestra galería de fotos y videos está en nuestro Instagram oficial.
            </p>
            <a
              href="https://www.instagram.com/bandashowguardiareal"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-gold btn-lg"
            >
              <Instagram size={18} />
              Ver galería en Instagram
              <ExternalLink size={14} />
            </a>
          </div>
        )}

        {/* Grid de fotos */}
        {!loading && posts.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
              {posts.map(post => (
                <a
                  key={post.id}
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative aspect-square rounded-lg overflow-hidden group bg-gray-100"
                  title={post.caption?.slice(0, 80) ?? 'Ver en Instagram'}
                >
                  <Image
                    src={post.thumbnail_url ?? post.media_url}
                    alt={post.caption?.slice(0, 60) ?? 'Guardia Real de Antioquia'}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/50 transition-all duration-300 flex items-center justify-center">
                    <Instagram
                      size={28}
                      className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    />
                  </div>
                  {/* Carousel badge */}
                  {post.media_type === 'CAROUSEL_ALBUM' && (
                    <div className="absolute top-2 right-2 bg-black/40 rounded px-1.5 py-0.5 text-white text-[10px] font-bold">
                      +
                    </div>
                  )}
                </a>
              ))}
            </div>

            <div className="text-center mt-10">
              <a
                href="https://www.instagram.com/bandashowguardiareal"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-md"
              >
                <Instagram size={16} />
                Ver más en Instagram
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
