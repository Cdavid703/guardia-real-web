// ──────────────────────────────────────────────────────────────────
// GUARDIA REAL DE ANTIOQUIA — Repertorio / Partituras
// Catálogo de instrumentos para partituras + temas base (seed).
// ──────────────────────────────────────────────────────────────────
import type { Tema } from '@/types'

/** Instrumentos para clasificar partituras, agrupados por familia. */
export interface InstrumentoPartitura {
  key:     string
  label:   string
  familia: 'madera' | 'metal' | 'percusion' | 'otro'
  emoji:   string
}

export const INSTRUMENTOS_PARTITURA: InstrumentoPartitura[] = [
  { key: 'flauta',       label: 'Flauta',            familia: 'madera',    emoji: '🎼' },
  { key: 'piccolo',      label: 'Píccolo',           familia: 'madera',    emoji: '🎼' },
  { key: 'clarinete-1',  label: 'Clarinete 1',       familia: 'madera',    emoji: '🎼' },
  { key: 'clarinete-2',  label: 'Clarinete 2',       familia: 'madera',    emoji: '🎼' },
  { key: 'sax-alto',     label: 'Saxofón Alto',      familia: 'madera',    emoji: '🎷' },
  { key: 'sax-tenor',    label: 'Saxofón Tenor',     familia: 'madera',    emoji: '🎷' },
  { key: 'sax-baritono', label: 'Saxofón Barítono',  familia: 'madera',    emoji: '🎷' },
  { key: 'trompeta-1',   label: 'Trompeta 1',        familia: 'metal',     emoji: '🎺' },
  { key: 'trompeta-2',   label: 'Trompeta 2',        familia: 'metal',     emoji: '🎺' },
  { key: 'melofono',     label: 'Melófono',          familia: 'metal',     emoji: '📯' },
  { key: 'trombon-1',    label: 'Trombón 1',         familia: 'metal',     emoji: '🎺' },
  { key: 'trombon-2',    label: 'Trombón 2',         familia: 'metal',     emoji: '🎺' },
  { key: 'tuba',         label: 'Tuba',              familia: 'metal',     emoji: '🎺' },
  { key: 'tuba-sib',     label: 'Tuba Si♭',          familia: 'metal',     emoji: '🎺' },
  { key: 'redoblante',   label: 'Redoblante',        familia: 'percusion', emoji: '🥁' },
  { key: 'multitenor',   label: 'Multitenor',        familia: 'percusion', emoji: '🥁' },
  { key: 'bombos',       label: 'Bombos',            familia: 'percusion', emoji: '🥁' },
  { key: 'platillos',    label: 'Platillos',         familia: 'percusion', emoji: '🥁' },
  { key: 'percusion-lat',label: 'Percusión latina',  familia: 'percusion', emoji: '🥁' },
  { key: 'partitura-gral',label: 'Partitura general', familia: 'otro',     emoji: '📄' },
  { key: 'otro',         label: 'Otro',              familia: 'otro',      emoji: '📄' },
]

export const FAMILIAS_PARTITURA: Record<string, { label: string; emoji: string }> = {
  madera:    { label: 'Vientos madera', emoji: '🎷' },
  metal:     { label: 'Vientos metal',  emoji: '🎺' },
  percusion: { label: 'Percusión',      emoji: '🥁' },
  otro:      { label: 'General',        emoji: '📄' },
}

export function getInstrumentoPartitura(key?: string): InstrumentoPartitura | undefined {
  return INSTRUMENTOS_PARTITURA.find(i => i.key === key)
}

/** Crea un tema base "vacío" (aún sin partituras) del repertorio de temporada. */
function temaBase(numeroMarcacion: number, titulo: string, extra: Partial<Tema> = {}): Tema {
  return {
    id: `seed-${numeroMarcacion}`,
    numeroMarcacion,
    titulo,
    compositor: '', arreglista: '', genero: '', tonalidad: '', compas: '',
    tempo: '', duracion: '', ano: '', dificultad: '', notas: '',
    partituras: [],
    activo: true,
    visibleTo: ['public'],
    esSeed: true,
    createdAt: new Date('2026-07-02'),
    updatedAt: new Date('2026-07-02'),
    ...extra,
  }
}

/**
 * Repertorio oficial temporada 2026 (orden de marcación).
 * Los temas sin partitura quedan listos para que los directores les suban los PDFs.
 */
export const REPERTORIO_SEED: Tema[] = [
  temaBase(1, 'Pregón'),
  temaBase(2, 'Yolanda (Querubín)'),
  temaBase(3, 'La Faldita'),
  temaBase(4, 'Carita de Luna'),
  temaBase(5, 'La Nene'),
  temaBase(6, 'Noches de Fantasía'),
  temaBase(7, 'Cumbia en Do', { tonalidad: 'Do mayor', genero: 'Cumbia' }),
  temaBase(8, 'Mambo No. 5', {
    compositor: 'Dámaso Pérez Prado',
    arreglista: 'José Gómez',
    genero: 'Mambo',
    tonalidad: 'Mi♭ mayor',
    compas: '2/2',
    tempo: '≈ 190 BPM',
    duracion: '≈ 2:30 min',
    dificultad: 'Intermedio',
    notas: 'Clásico del mambo de Pérez Prado, arreglo para banda show. D.C. al Coda. Dinámicas de f a ff.',
    partituras: [
      { instrumento: 'flauta',       url: '/partituras/mambo-5/flauta.pdf' },
      { instrumento: 'piccolo',      url: '/partituras/mambo-5/piccolo.pdf' },
      { instrumento: 'clarinete-1',  url: '/partituras/mambo-5/clarinete-1.pdf' },
      { instrumento: 'clarinete-2',  url: '/partituras/mambo-5/clarinete-2.pdf' },
      { instrumento: 'sax-alto',     url: '/partituras/mambo-5/sax-alto.pdf' },
      { instrumento: 'sax-tenor',    url: '/partituras/mambo-5/sax-tenor.pdf' },
      { instrumento: 'sax-baritono', url: '/partituras/mambo-5/sax-baritono.pdf' },
      { instrumento: 'trompeta-1',   url: '/partituras/mambo-5/trompeta-1.pdf' },
      { instrumento: 'trompeta-2',   url: '/partituras/mambo-5/trompeta-2.pdf' },
      { instrumento: 'melofono',     url: '/partituras/mambo-5/melofono.pdf' },
      { instrumento: 'trombon-1',    url: '/partituras/mambo-5/trombon-1.pdf' },
      { instrumento: 'trombon-2',    url: '/partituras/mambo-5/trombon-2.pdf' },
      { instrumento: 'tuba',         url: '/partituras/mambo-5/tuba.pdf' },
      { instrumento: 'tuba-sib',     url: '/partituras/mambo-5/tuba-sib.pdf' },
    ],
  }),
]
