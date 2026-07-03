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
  { key: 'clarinete-3',  label: 'Clarinete 3',       familia: 'madera',    emoji: '🎼' },
  { key: 'sax-soprano',  label: 'Saxofón Soprano',   familia: 'madera',    emoji: '🎷' },
  { key: 'sax-alto',     label: 'Saxofón Alto',      familia: 'madera',    emoji: '🎷' },
  { key: 'sax-tenor',    label: 'Saxofón Tenor',     familia: 'madera',    emoji: '🎷' },
  { key: 'sax-baritono', label: 'Saxofón Barítono',  familia: 'madera',    emoji: '🎷' },
  { key: 'trompeta-1',   label: 'Trompeta 1',        familia: 'metal',     emoji: '🎺' },
  { key: 'trompeta-2',   label: 'Trompeta 2',        familia: 'metal',     emoji: '🎺' },
  { key: 'trompeta-3',   label: 'Trompeta 3',        familia: 'metal',     emoji: '🎺' },
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

import manifest from '@/lib/repertorio-data.json'

interface TemaManifest {
  id: string; slug: string; titulo: string; numeroMarcacion: number | null
  categoria: string; partituras: { instrumento: string; label: string; url: string }[]
}

// Metadatos adicionales por slug (lo que no se pudo extraer del PDF lo completa el director).
const META: Record<string, Partial<Tema>> = {
  'cumbia-en-do':  { genero: 'Cumbia', tonalidad: 'Do menor', compas: '4/4' },
  'calentamiento': { genero: 'Calentamiento', tonalidad: 'Fa mayor', compas: '4/4',
                     notas: 'Ejercicio de calentamiento sobre el tema de Dragon Ball Z.' },
}

function fromManifest(t: TemaManifest): Tema {
  return {
    id: t.id,
    numeroMarcacion: t.numeroMarcacion ?? undefined,
    titulo: t.titulo,
    compositor: '', arreglista: '', genero: '', tonalidad: '', compas: '',
    tempo: '', duracion: '', ano: '', dificultad: '', notas: '',
    partituras: t.partituras,
    categoria: t.categoria,
    activo: true,
    visibleTo: ['public'],
    esSeed: true,
    createdAt: new Date('2026-07-02'),
    updatedAt: new Date('2026-07-02'),
    ...(META[t.slug] ?? {}),
  }
}

const MAMBO: Tema = {
  id: 'seed-mambo-no-5', numeroMarcacion: 8, titulo: 'Mambo No. 5',
  compositor: 'Dámaso Pérez Prado', arreglista: 'José Gómez', genero: 'Mambo',
  tonalidad: 'Mi♭ mayor', compas: '2/2', tempo: '≈ 190 BPM', duracion: '≈ 2:30 min',
  ano: '', dificultad: 'Intermedio',
  notas: 'Clásico del mambo de Pérez Prado, arreglo para banda show. D.C. al Coda. Dinámicas de f a ff.',
  partituras: [
    { instrumento: 'flauta', label: 'Flauta', url: '/partituras/mambo-5/flauta.pdf' },
    { instrumento: 'piccolo', label: 'Píccolo', url: '/partituras/mambo-5/piccolo.pdf' },
    { instrumento: 'clarinete-1', label: 'Clarinete 1', url: '/partituras/mambo-5/clarinete-1.pdf' },
    { instrumento: 'clarinete-2', label: 'Clarinete 2', url: '/partituras/mambo-5/clarinete-2.pdf' },
    { instrumento: 'sax-alto', label: 'Sax Alto', url: '/partituras/mambo-5/sax-alto.pdf' },
    { instrumento: 'sax-tenor', label: 'Sax Tenor', url: '/partituras/mambo-5/sax-tenor.pdf' },
    { instrumento: 'sax-baritono', label: 'Sax Barítono', url: '/partituras/mambo-5/sax-baritono.pdf' },
    { instrumento: 'trompeta-1', label: 'Trompeta 1', url: '/partituras/mambo-5/trompeta-1.pdf' },
    { instrumento: 'trompeta-2', label: 'Trompeta 2', url: '/partituras/mambo-5/trompeta-2.pdf' },
    { instrumento: 'melofono', label: 'Melófono', url: '/partituras/mambo-5/melofono.pdf' },
    { instrumento: 'trombon-1', label: 'Trombón 1', url: '/partituras/mambo-5/trombon-1.pdf' },
    { instrumento: 'trombon-2', label: 'Trombón 2', url: '/partituras/mambo-5/trombon-2.pdf' },
    { instrumento: 'tuba', label: 'Tuba', url: '/partituras/mambo-5/tuba.pdf' },
    { instrumento: 'tuba-sib', label: 'Tuba Si♭', url: '/partituras/mambo-5/tuba-sib.pdf' },
  ],
  categoria: 'temporada', activo: true, visibleTo: ['public'], esSeed: true,
  createdAt: new Date('2026-07-02'), updatedAt: new Date('2026-07-02'),
}

/** Repertorio oficial temporada 2026 (orden de marcación). */
export const REPERTORIO_SEED: Tema[] = [
  ...(manifest.temporada as TemaManifest[]).map(fromManifest),
  MAMBO,
].sort((a, b) => (a.numeroMarcacion ?? 999) - (b.numeroMarcacion ?? 999))

/** Repertorio de Semana Santa (sección aparte). */
export const REPERTORIO_SEMANA_SANTA: Tema[] = (manifest.semanaSanta as TemaManifest[]).map(fromManifest)
