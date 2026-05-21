import type { Metadata } from 'next'
import { Calendar, Tag, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Noticias',
  description: 'Últimas noticias y novedades de la Corporación Musical Guardia Real de Antioquia',
}

// Mock data — en producción esto viene de Firestore via Server Component
const MOCK_NEWS = [
  {
    id: '1', slug: 'desfile-silleteros-2025',
    title: 'Participamos en el Desfile de Silleteros 2025',
    excerpt: 'La Guardia Real de Antioquia fue parte de la apertura del tradicional Desfile de Silleteros como operador oficial de las Fusiones de Bandas.',
    date: '2025-08-10',
    tags: ['Desfile', 'Feria de las Flores'],
    image: null,
  },
  {
    id: '2', slug: 'primer-puesto-concurso-2024',
    title: 'Primer puesto en Concurso de Bandas Medellín',
    excerpt: 'Excelente presentación en el Concurso de Bandas Feria de las Flores, donde obtuvimos el primer puesto en la categoría show.',
    date: '2024-08-08',
    tags: ['Concurso', 'Premio'],
    image: null,
  },
  {
    id: '3', slug: 'carnaval-barranquilla-2023',
    title: 'Batalla de Flores — Carnaval de Barranquilla 2023',
    excerpt: 'Representamos a Medellín y Antioquia en el desfile más importante del Carnaval de Barranquilla con una presentación llena de color y energía.',
    date: '2023-02-21',
    tags: ['Carnaval', 'Barranquilla'],
    image: null,
  },
]

export default function NoticiasPage() {
  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-hero py-20 text-white text-center">
        <p className="section-label mb-3">Actualidad</p>
        <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-wider mb-4">
          Noticias
        </h1>
        <div className="divider-gold max-w-xs mx-auto" />
      </div>

      <div className="section-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {MOCK_NEWS.map(({ id, slug, title, excerpt, date, tags }) => (
            <article key={id} className="card overflow-hidden flex flex-col">
              {/* Placeholder image */}
              <div className="h-48 bg-gradient-primary flex items-center justify-center">
                <p className="font-display text-white/20 text-4xl font-bold uppercase tracking-wider">GRA</p>
              </div>

              <div className="p-6 flex flex-col flex-1">
                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {tags.map(tag => (
                    <span key={tag} className="badge bg-navy/10 text-navy text-[10px]">
                      <Tag size={9} /> {tag}
                    </span>
                  ))}
                </div>

                {/* Title */}
                <h2 className="font-serif font-bold text-navy text-lg leading-tight mb-2">{title}</h2>

                {/* Excerpt */}
                <p className="text-gray-500 text-sm leading-relaxed flex-1 mb-4">{excerpt}</p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Calendar size={12} />
                    {new Date(date).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                  <Link href={`/noticias/${slug}`} className="flex items-center gap-1 text-xs font-semibold text-royal hover:text-navy transition-colors">
                    Leer más <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
