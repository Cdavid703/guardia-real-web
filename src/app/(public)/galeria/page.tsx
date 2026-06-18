'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Instagram, ExternalLink, Loader2, Play, Youtube, Link as LinkIcon, Trophy, Camera, Video } from 'lucide-react'
import PageBanner from '@/components/layout/PageBanner'
import { getPublicGalleryMedia } from '@/lib/firebase'
import { getYouTubeEmbedUrl, getYouTubeThumbnail } from '@/lib/utils'

interface InstaPost {
  id:            string
  media_type:    'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  media_url:     string
  thumbnail_url?: string
  caption?:      string
  permalink:     string
}

interface GalleryItem {
  id:          string
  type:        string
  title:       string
  description?: string
  url:         string
  thumbnail?:  string
}

export default function GaleriaPage() {
  const [posts,   setPosts]   = useState<InstaPost[]>([])
  const [media,   setMedia]   = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [instaErr,setInstaErr]= useState(false)
  const [activeVideo, setActiveVideo] = useState<string | null>(null)

  useEffect(() => {
    // Cargar Instagram y galería propia en paralelo
    Promise.allSettled([
      fetch('/api/instagram').then(r => r.json()),
      getPublicGalleryMedia(60),
    ]).then(([instaResult, mediaResult]) => {
      if (instaResult.status === 'fulfilled') {
        const data = instaResult.value
        if (!data.error && data.data) {
          setPosts((data.data as InstaPost[]).filter(
            p => p.media_type === 'IMAGE' || p.media_type === 'CAROUSEL_ALBUM'
          ))
        } else {
          setInstaErr(true)
        }
      } else {
        setInstaErr(true)
      }

      if (mediaResult.status === 'fulfilled') {
        setMedia(mediaResult.value as unknown as GalleryItem[])
      }
    }).finally(() => setLoading(false))
  }, [])

  // Videos de YouTube y fotos propias visibles al público
  const youtubeItems = media.filter(m => m.type === 'youtube')
  const photoItems   = media.filter(m => m.type === 'photo')
  const linkItems    = media.filter(m => m.type !== 'youtube' && m.type !== 'photo')

  const hasOwnContent = youtubeItems.length > 0 || photoItems.length > 0

  return (
    <div>
      <PageBanner
        image="/images/banners/banner-galeria.jpg"
        eyebrow="Nuestro trabajo"
        title="Galería"
        subtitle="Momentos en escena, conciertos y presentaciones"
      />

      {/* Instagram link */}
      <div className="bg-navy/95 py-3 text-center">
        <a
          href="https://www.instagram.com/bandashowguardiareal"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-gray-200 hover:text-gold transition-colors"
        >
          <Instagram size={16} />
          @bandashowguardiareal
        </a>
      </div>

      {/* ── Calarcá 2026 — Evento destacado ─────────────────────── */}
      <div className="section-container pt-10 pb-2">
        <Link
          href="/galeria/calarca-2026"
          className="group relative flex flex-col sm:flex-row items-center gap-0 rounded-2xl overflow-hidden border border-gold/30 hover:border-gold/60 shadow-md hover:shadow-xl transition-all duration-300"
        >
          {/* Foto de portada */}
          <div className="relative w-full sm:w-64 shrink-0 aspect-[16/9] sm:aspect-[4/3]">
            <Image
              src="/images/galeria/calarca-2026/calarca-20.jpg"
              alt="Concurso de Bandas Calarcá 2026"
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-navy/30 group-hover:bg-navy/10 transition-colors" />
          </div>

          {/* Texto */}
          <div className="flex-1 bg-gradient-to-r from-navy to-navy/90 p-6 sm:p-7 w-full">
            <div className="inline-flex items-center gap-1.5 bg-gold/20 text-gold text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3">
              <Trophy size={10} /> Evento destacado
            </div>
            <h3 className="font-display text-white text-lg md:text-xl font-bold uppercase tracking-wider mb-1">
              Concurso Nacional de Bandas
              <span className="text-gold"> Calarcá 2026</span>
            </h3>
            <p className="text-gray-300 text-sm mb-4">
              14 de junio de 2026 · Calarcá, Quindío · Colombia
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1"><Camera size={12} className="text-gold" /> 28 fotos</span>
              <span className="flex items-center gap-1"><Video size={12} className="text-gold" /> 6 videos</span>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 bg-gold text-navy text-xs font-bold px-4 py-2 rounded-lg group-hover:bg-gold/90 transition-colors">
              Ver galería completa →
            </div>
          </div>
        </Link>
      </div>

      <div className="section-container py-16">

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 size={36} className="text-royal animate-spin" />
            <p className="text-gray-400 text-sm">Cargando galería...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* ── Videos de YouTube ─────────────────────────────── */}
            {youtubeItems.length > 0 && (
              <div className="mb-16">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
                    <Youtube size={16} className="text-white" />
                  </div>
                  <div>
                    <h2 className="font-display text-navy text-xl font-bold uppercase tracking-wider">Videos</h2>
                    <p className="text-gray-400 text-xs">Presentaciones y momentos destacados</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {youtubeItems.map(item => {
                    const embedUrl = getYouTubeEmbedUrl(item.url)
                    const thumb    = getYouTubeThumbnail(item.url)
                    const isActive = activeVideo === item.id

                    return (
                      <div key={item.id} className="rounded-xl overflow-hidden border border-gray-200 shadow-sm group">
                        {isActive && embedUrl ? (
                          <div className="aspect-video">
                            <iframe
                              src={`${embedUrl}?autoplay=1`}
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              title={item.title}
                            />
                          </div>
                        ) : (
                          <button
                            onClick={() => setActiveVideo(item.id)}
                            className="relative aspect-video w-full block overflow-hidden bg-gray-900"
                          >
                            {thumb && (
                              <Image src={thumb} alt={item.title} fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            )}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                                <Play size={26} className="text-white ml-1" fill="white" />
                              </div>
                            </div>
                          </button>
                        )}
                        <div className="p-3 bg-white">
                          <p className="font-serif font-bold text-navy text-sm leading-tight line-clamp-1">{item.title}</p>
                          {item.description && (
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.description}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Fotos propias ─────────────────────────────────── */}
            {photoItems.length > 0 && (
              <div className="mb-16">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center">
                    <Play size={14} className="text-gold" />
                  </div>
                  <div>
                    <h2 className="font-display text-navy text-xl font-bold uppercase tracking-wider">Fotos</h2>
                    <p className="text-gray-400 text-xs">Momentos de nuestras presentaciones</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {photoItems.map(item => (
                    <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden group bg-gray-100">
                      <Image src={item.url} alt={item.title} fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/40 transition-all duration-300 flex items-end">
                        <p className="text-white text-xs font-semibold p-2 opacity-0 group-hover:opacity-100 transition-opacity line-clamp-2">
                          {item.title}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Instagram ──────────────────────────────────────── */}
            {posts.length > 0 && (
              <div className="mb-10">
                {hasOwnContent && (
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#833ab4] via-[#fd1d1d] to-[#fcb045] flex items-center justify-center">
                      <Instagram size={14} className="text-white" />
                    </div>
                    <div>
                      <h2 className="font-display text-navy text-xl font-bold uppercase tracking-wider">Instagram</h2>
                      <p className="text-gray-400 text-xs">@bandashowguardiareal</p>
                    </div>
                  </div>
                )}
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
                      <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/50 transition-all duration-300 flex items-center justify-center">
                        <Instagram size={28} className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      {post.media_type === 'CAROUSEL_ALBUM' && (
                        <div className="absolute top-2 right-2 bg-black/40 rounded px-1.5 py-0.5 text-white text-[10px] font-bold">+</div>
                      )}
                    </a>
                  ))}
                </div>
                <div className="text-center mt-10">
                  <a href="https://www.instagram.com/bandashowguardiareal" target="_blank" rel="noopener noreferrer"
                    className="btn btn-primary btn-md">
                    <Instagram size={16} /> Ver más en Instagram
                  </a>
                </div>
              </div>
            )}

            {/* ── Sin contenido ─────────────────────────────────── */}
            {!hasOwnContent && instaErr && posts.length === 0 && (
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
                <a href="https://www.instagram.com/bandashowguardiareal" target="_blank" rel="noopener noreferrer"
                  className="btn btn-gold btn-lg">
                  <Instagram size={18} /> Ver galería en Instagram <ExternalLink size={14} />
                </a>
              </div>
            )}

            {/* ── Links externos ─────────────────────────────────── */}
            {linkItems.length > 0 && (
              <div className="mt-8 border-t border-gray-100 pt-8">
                <h3 className="font-serif font-bold text-navy text-lg mb-4 flex items-center gap-2">
                  <LinkIcon size={16} className="text-royal" /> Otros enlaces
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {linkItems.map(item => (
                    <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-royal/40 hover:shadow-sm transition-all group">
                      <div className="w-10 h-10 rounded-xl bg-navy/8 flex items-center justify-center shrink-0">
                        {item.type === 'instagram'
                          ? <Instagram size={16} className="text-royal" />
                          : <LinkIcon size={16} className="text-royal" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-navy text-sm group-hover:text-royal transition-colors truncate">{item.title}</p>
                        {item.description && <p className="text-xs text-gray-400 truncate">{item.description}</p>}
                      </div>
                      <ExternalLink size={14} className="text-gray-400 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
