'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ChevronDown, Play } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero">
      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 65% 35%, rgba(242,193,0,0.07) 0%, transparent 60%)',
        }}
      />

      {/* Decorative lines */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-gold/40 to-transparent" />
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-royal/40 to-transparent" />

      <div className="section-container relative z-10 text-center py-32">
        {/* Escudo */}
        <div className="flex justify-center mb-8 animate-fade-in">
          <div className="w-36 h-36 md:w-44 md:h-44 relative drop-shadow-2xl">
            <Image
              src="/images/escudo.png"
              alt="Escudo Guardia Real de Antioquia"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Label */}
        <p className="section-label mb-6 animate-fade-in">
          Medellín, Colombia · Desde 1983 · Categoría Show
        </p>

        {/* Title */}
        <h1 className="font-display text-white uppercase tracking-widest leading-tight mb-4 animate-fade-up"
          style={{ fontSize: 'clamp(2rem, 5vw, 4.5rem)' }}>
          Guardia{' '}
          <span className="text-gold">Real</span>
          <br />
          de Antioquia
        </h1>

        {/* Tagline */}
        <p className="font-serif italic text-gray-300 mb-8 animate-fade-up"
          style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)', animationDelay: '100ms' }}>
          &ldquo;Disciplina, progreso y honor&rdquo;
        </p>

        {/* Gold divider */}
        <div className="divider-gold max-w-xs mx-auto mb-8" />

        {/* Sub-description */}
        <p className="text-gray-400 max-w-2xl mx-auto text-base md:text-lg leading-relaxed mb-12 animate-fade-up"
          style={{ animationDelay: '200ms' }}>
          Más de <strong className="text-white">42 años</strong> formando músicos y llevando
          nuestra cultura a los principales escenarios de Colombia.
          Banda Show líder en Antioquia.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up"
          style={{ animationDelay: '300ms' }}>
          <Link href="/contacto" className="btn btn-gold btn-xl">
            Contratar la banda
          </Link>
          <Link href="/nosotros" className="btn btn-outline-white btn-xl">
            <Play size={18} />
            Conoce nuestra historia
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-20 animate-fade-up"
          style={{ animationDelay: '400ms' }}>
          {[
            { value: '42+',  label: 'Años de historia' },
            { value: '100+', label: 'Integrantes activos' },
            { value: '1983', label: 'Año de fundación' },
            { value: '#1',   label: 'Categoría Show' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="font-display text-gold text-3xl md:text-4xl font-bold">{value}</p>
              <p className="text-gray-400 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <a
        href="#about"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gold/60 hover:text-gold transition-colors animate-bounce"
        aria-label="Scrollar hacia abajo"
      >
        <ChevronDown size={28} />
      </a>
    </section>
  )
}
