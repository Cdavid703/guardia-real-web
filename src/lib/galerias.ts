// ──────────────────────────────────────────────────────────────────
// GUARDIA REAL DE ANTIOQUIA — Galerías de eventos (páginas curadas)
// Cada evento se muestra en /galeria/[slug]. Para un evento nuevo se agrega
// un objeto aquí, se suben las fotos a public/images/galeria/<slug>/ y los
// videos a public/videos/<slug>/, nombrados <slug>-NN.jpg / <slug>-video-NN.mp4.
// ──────────────────────────────────────────────────────────────────

export interface EventoGaleria {
  slug:       string
  badge:      string   // etiqueta pequeña del hero
  titulo:     string   // primera línea del título
  tituloGold: string   // segunda línea (en dorado)
  tituloCorto: string  // para tarjetas de la galería principal
  fecha:      string
  lugar:      string
  fotos:      number
  videos:     number
  cover:      number   // índice de la foto de portada
  resena:     string[] // párrafos de la reseña
}

export const GALERIAS: EventoGaleria[] = [
  {
    slug: 'virgen-del-carmen-2026',
    badge: 'Desfile artístico',
    titulo: 'Desfile Virgen del Carmen',
    tituloGold: 'San Antonio de Prado',
    tituloCorto: 'Desfile Virgen del Carmen',
    fecha: '18 de julio de 2026',
    lugar: 'San Antonio de Prado — Medellín',
    fotos: 60, videos: 3, cover: 8,
    resena: [
      'El sábado 18 de julio de 2026, al caer la tarde, la Banda Show Guardia Real de Antioquia engalanó las calles de San Antonio de Prado con su participación en el Desfile Artístico en honor a la Virgen del Carmen, patrona de los conductores, organizado por Cootrasana.',
      'Con overol blanco y quepis de pluma azul, nuestros integrantes recorrieron el corregimiento llevando música, color y disciplina a una comunidad que salió a las aceras a acompañar la celebración. Una jornada cargada de devoción y alegría con la que la Guardia Real reafirmó su cercanía con las tradiciones de la ciudad.',
    ],
  },
  {
    slug: 'silleteritos-2026',
    badge: 'Tradición silletera',
    titulo: 'Desfile de Silleteritos',
    tituloGold: 'Santa Elena',
    tituloCorto: 'XVIII Desfile de Silleteritos',
    fecha: '19 de julio de 2026',
    lugar: 'Santa Elena — Medellín',
    fotos: 4, videos: 0, cover: 4,
    resena: [
      'El domingo 19 de julio de 2026, la Guardia Real de Antioquia dijo presente en el XVIII Desfile de Silleteritos, en el corregimiento de Santa Elena, cuna de la tradición silletera de Medellín.',
      'En esta edición número dieciocho, los pequeños silleteritos desfilaron con sus silletas floridas mientras nuestra banda ponía la nota musical a una mañana que mantiene viva una de las tradiciones más queridas de Antioquia.',
    ],
  },
  {
    slug: 'concurso-bello-2026',
    badge: 'Concurso de bandas',
    titulo: 'Concurso de Bandas',
    tituloGold: 'Bello 2026',
    tituloCorto: 'Concurso de Bandas — Bello',
    fecha: '20 de julio de 2026',
    lugar: 'Bello — Antioquia',
    fotos: 15, videos: 0, cover: 7,
    resena: [
      'El lunes 20 de julio de 2026, la Guardia Real de Antioquia cerró un exigente fin de semana de cuatro presentaciones participando en el Concurso de Bandas de Bello, Antioquia.',
      'Frente a jurados y público, la banda desplegó su repertorio y su puesta en escena con la excelencia que la caracteriza, poniendo el broche de oro a un fin de semana de intensa actividad institucional.',
    ],
  },
]

export function getGaleria(slug: string): EventoGaleria | undefined {
  return GALERIAS.find(g => g.slug === slug)
}

export const fotoUrl = (slug: string, n: number) => `/images/galeria/${slug}/${slug}-${String(n).padStart(2, '0')}.jpg`
export const videoUrl = (slug: string, n: number) => `/videos/${slug}/${slug}-video-${String(n).padStart(2, '0')}.mp4`
