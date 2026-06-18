'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, ChevronLeft, ChevronRight, Camera, Video, Trophy, MapPin, Calendar, ArrowLeft, Play } from 'lucide-react'
import type { Metadata } from 'next'

const TOTAL_PHOTOS = 28
const TOTAL_VIDEOS = 6

const photos = Array.from({ length: TOTAL_PHOTOS }, (_, i) => ({
  id:  i + 1,
  src: `/images/galeria/calarca-2026/calarca-${String(i + 1).padStart(2, '0')}.jpg`,
  alt: `Concurso de Bandas Calarcá 2026 — foto ${i + 1}`,
}))

const videos = Array.from({ length: TOTAL_VIDEOS }, (_, i) => ({
  id:  i + 1,
  src: `/videos/calarca-2026/calarca-video-${String(i + 1).padStart(2, '0')}.mp4`,
  label: `Momento ${i + 1} — Desfile Calarcá 2026`,
}))

export default function CalarcaGaleriaPage() {
  const [lightbox, setLightbox] = useState<number | null>(null)

  const prev = useCallback(() => {
    setLightbox(l => l === null ? null : l === 1 ? TOTAL_PHOTOS : l - 1)
  }, [])

  const next = useCallback(() => {
    setLightbox(l => l === null ? null : l === TOTAL_PHOTOS ? 1 : l + 1)
  }, [])

  useEffect(() => {
    if (lightbox === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape')      setLightbox(null)
      if (e.key === 'ArrowLeft')   prev()
      if (e.key === 'ArrowRight')  next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightbox, prev, next])

  return (
    <div>
      {/* ── Hero banner ──────────────────────────────────────────── */}
      <div className="relative bg-navy overflow-hidden">
        <div className="absolute inset-0 opacity-20"
          style={{ background: 'radial-gradient(ellipse at 30% 50%, #F2C100 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, #1B75BB 0%, transparent 60%)' }} />
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-gold/60 to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-royal/60 to-transparent" />

        <div className="section-container relative z-10 py-16 md:py-20 text-center">
          <Link href="/galeria"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-gold text-sm font-medium transition-colors mb-6">
            <ArrowLeft size={15} /> Volver a Galería
          </Link>

          <div className="inline-flex items-center gap-2 bg-gold/15 border border-gold/30 text-gold text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
            <Trophy size={13} /> Evento oficial
          </div>

          <h1 className="font-display text-white uppercase tracking-widest leading-tight mb-3"
            style={{ fontSize: 'clamp(1.8rem, 4vw, 3.5rem)' }}>
            Concurso Nacional de Bandas
            <br />
            <span className="text-gold">Calarcá 2026</span>
          </h1>

          <div className="flex flex-wrap justify-center gap-4 mt-4 mb-2">
            <span className="inline-flex items-center gap-1.5 text-gray-300 text-sm">
              <Calendar size={14} className="text-gold" />
              14 de junio de 2026
            </span>
            <span className="inline-flex items-center gap-1.5 text-gray-300 text-sm">
              <MapPin size={14} className="text-gold" />
              Calarcá, Quindío — Colombia
            </span>
          </div>

          <div className="divider-gold max-w-xs mx-auto mt-6" />

          <div className="flex justify-center gap-6 mt-6 text-center">
            <div>
              <p className="font-display text-gold text-2xl font-bold">{TOTAL_PHOTOS}</p>
              <p className="text-gray-400 text-xs">Fotos</p>
            </div>
            <div className="w-px bg-white/10" />
            <div>
              <p className="font-display text-gold text-2xl font-bold">{TOTAL_VIDEOS}</p>
              <p className="text-gray-400 text-xs">Videos</p>
            </div>
          </div>
        </div>
      </div>

      <div className="section-container py-14 space-y-16">

        {/* ── Reseña ────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center shrink-0">
              <Trophy size={15} className="text-navy" />
            </div>
            <div>
              <h2 className="font-display text-navy text-xl font-bold uppercase tracking-wider">Reseña del evento</h2>
              <p className="text-gray-400 text-xs">Concurso Nacional de Bandas — Calarcá, Quindío</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4 text-gray-600 leading-relaxed text-[15px]">
              <p>
                El sábado <strong className="text-navy">14 de junio de 2026</strong>, la Banda Show
                Guardia Real de Antioquia hizo presencia en el{' '}
                <strong className="text-navy">Concurso Nacional de Bandas de Calarcá</strong>,
                uno de los certámenes musicales más importantes del{' '}
                <strong className="text-navy">Eje Cafetero colombiano</strong>, celebrado en las calles de
                Calarcá, Quindío.
              </p>
              <p>
                Con más de <strong className="text-navy">42 años de trayectoria</strong>, nuestra agrupación
                desfiló por las principales vías del municipio portando con orgullo su imponente pancarta
                institucional y luciendo los elegantes uniformes azul real con detalles plateados que
                caracterizan a la banda. El equipo de{' '}
                <strong className="text-navy">color guard</strong> deslumbró al público con sus coreografías
                en trajes dorados y amarillos, mientras los sousafonos decorados con las iniciales de la banda
                marcaron presencia visual en cada tramo del recorrido.
              </p>
              <p>
                El ambiente en Calarcá fue de total algarabía: los caleños y visitantes que abarrotaron las
                aceras recibieron con aplausos a cada agrupación. La Guardia Real, fiel a su lema
                {' '}<em className="text-navy font-semibold">"Disciplina, progreso y honor"</em>, ofreció
                una presentación de alto nivel que reflejó el trabajo y dedicación de sus integrantes.
              </p>
              <p>
                Este evento consolida la presencia de la banda en escenarios nacionales y reafirma su
                compromiso con la cultura musical de Antioquia y Colombia. La delegación regresó a Medellín
                con la satisfacción del deber cumplido y la motivación de seguir representando a la región
                con excelencia.
              </p>
            </div>

            {/* Foto destacada */}
            <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-[4/3] group">
              <Image
                src="/images/galeria/calarca-2026/calarca-20.jpg"
                alt="Banda Show Guardia Real en Calarcá 2026"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-white text-xs font-semibold uppercase tracking-wider">
                  Banda Show Guardia Real de Antioquia
                </p>
                <p className="text-gold text-[11px]">Calarcá, Quindío · 14 jun 2026</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Galería de fotos ──────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center shrink-0">
              <Camera size={15} className="text-gold" />
            </div>
            <div>
              <h2 className="font-display text-navy text-xl font-bold uppercase tracking-wider">Fotos</h2>
              <p className="text-gray-400 text-xs">{TOTAL_PHOTOS} imágenes · Haz clic para ampliar</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
            {photos.map(photo => (
              <button
                key={photo.id}
                onClick={() => setLightbox(photo.id)}
                className="relative aspect-square rounded-lg overflow-hidden group bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gold"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/35 transition-all duration-300 flex items-center justify-center">
                  <Camera size={22} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── Videos ───────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-royal flex items-center justify-center shrink-0">
              <Video size={15} className="text-white" />
            </div>
            <div>
              <h2 className="font-display text-navy text-xl font-bold uppercase tracking-wider">Videos</h2>
              <p className="text-gray-400 text-xs">{TOTAL_VIDEOS} clips del evento</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map(video => (
              <div key={video.id} className="rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-black">
                <video
                  src={video.src}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full aspect-video object-cover"
                  aria-label={video.label}
                />
                <div className="bg-white px-3 py-2">
                  <p className="text-navy text-xs font-semibold flex items-center gap-1.5">
                    <Play size={11} className="text-royal shrink-0" fill="currentColor" />
                    {video.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Back ─────────────────────────────────────────────── */}
        <div className="text-center pt-4 border-t border-gray-100">
          <Link href="/galeria" className="btn btn-primary btn-md">
            <ArrowLeft size={16} /> Ver toda la galería
          </Link>
        </div>
      </div>

      {/* ── Lightbox ─────────────────────────────────────────────── */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[999] bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          {/* Cerrar */}
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors z-10"
            onClick={() => setLightbox(null)}
          >
            <X size={22} />
          </button>

          {/* Contador */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm tabular-nums z-10">
            {lightbox} / {TOTAL_PHOTOS}
          </div>

          {/* Prev */}
          <button
            className="absolute left-3 md:left-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors z-10"
            onClick={e => { e.stopPropagation(); prev() }}
          >
            <ChevronLeft size={28} />
          </button>

          {/* Imagen */}
          <div
            className="relative w-full max-w-4xl max-h-[88vh] mx-14 md:mx-20"
            onClick={e => e.stopPropagation()}
          >
            <Image
              key={lightbox}
              src={`/images/galeria/calarca-2026/calarca-${String(lightbox).padStart(2, '0')}.jpg`}
              alt={`Calarcá 2026 foto ${lightbox}`}
              width={1200}
              height={1200}
              className="object-contain max-h-[88vh] w-auto mx-auto rounded-lg"
              priority
            />
          </div>

          {/* Next */}
          <button
            className="absolute right-3 md:right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors z-10"
            onClick={e => { e.stopPropagation(); next() }}
          >
            <ChevronRight size={28} />
          </button>
        </div>
      )}
    </div>
  )
}
