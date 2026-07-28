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

// Metadatos por slug: arreglista/compositor del encabezado y tonalidad, compás,
// tempo y año LEÍDOS de la primera página de la partitura (flauta/score = concierto).
// Falta por confirmar con el director: dificultad y duración de cada uno.
const META: Record<string, Partial<Tema>> = {
  'pregon-costeno':     { arreglista: 'Rodrigo Bolívar (RodroGass)', genero: 'Cumbia / Porro',
                          tonalidad: 'Do mayor', compas: '2/2', ano: '2026', dificultad: 'Intermedio', notas: 'D.S. al Coda.' },
  'yolanda':            { arreglista: 'Rodrigo Bolívar (RodroGass)', genero: 'Cumbia',
                          tonalidad: 'Mi♭ mayor', compas: '2/2', ano: '2025', dificultad: 'Básico', notas: 'Arreglo con secciones de mambo. D.C. al Coda.' },
  'la-faldita':         { arreglista: 'Rodrigo Bolívar (RodroGass) — adaptación', genero: 'Cumbia',
                          tonalidad: 'La♭ mayor', compas: '2/2', ano: '2025', dificultad: 'Intermedio', notas: 'Adaptación para banda. D.S. al Coda.' },
  'carita-de-luna':     { compositor: 'Los Graduados', arreglista: 'Justin May (adapt. Rodrigo Bolívar)', genero: 'Cumbia',
                          tonalidad: 'Si♭ mayor', compas: '4/4', tempo: 'Allegro Moderato', ano: '2026', dificultad: 'Intermedio', notas: 'Tema original de Los Graduados.' },
  'la-nene':            { compositor: 'La Tropibanda', arreglista: 'Justin May', genero: 'Tropical',
                          tonalidad: 'Fa mayor', compas: '2/2', dificultad: 'Intermedio', notas: 'D.S. al Coda.' },
  'noches-de-fantasia': { compositor: 'Roberto Antonio', arreglista: 'Rodrigo Bolívar (RodroGass)', genero: 'Merengue',
                          tonalidad: 'La♭ mayor', compas: '4/4', tempo: '♩ = 140', ano: '2026', dificultad: 'Avanzado' },
  'cumbia-en-do':       { arreglista: 'Faber Restrepo', genero: 'Cumbia',
                          tonalidad: 'Do menor', compas: '2/2', dificultad: 'Básico' },
  'calentamiento':      { arreglista: 'Rodrigo Bolívar (RodroGass)', genero: 'Calentamiento',
                          tonalidad: 'La♭ mayor', compas: '4/4', ano: '2026', dificultad: 'Intermedio', notas: 'Basado en el tema de Dragon Ball Z (notas largas de calentamiento).' },
  // Semana Santa
  'jerusalen':          { arreglista: 'Rodrigo Bolívar (RodroGass)', genero: 'Sacro / Semana Santa',
                          tonalidad: 'Mi♭ mayor', compas: '4/4', tempo: '♩ = 100', ano: '2026', dificultad: 'Intermedio' },
  'procesion-sardar':   { compositor: 'M. Ippolitov-Ivánov', arreglista: 'Rodrigo Bolívar (RodroGass)', genero: 'Marcha / Clásico',
                          tonalidad: 'Re mayor', compas: '4/4', tempo: '♩ = 90', ano: '2026', dificultad: 'Básico',
                          notas: 'De «Cuadros del Cáucaso» (Procession of the Sardar). D.C. al Coda.' },
  'soy-pecador':        { arreglista: 'Rodrigo Bolívar (RodroGass)', genero: 'Sacro / Semana Santa',
                          tonalidad: 'Do mayor', compas: '4/4', ano: '2026', dificultad: 'Básico' },
  'ten-piedad':         { arreglista: 'Rodrigo Bolívar (RodroGass)', genero: 'Sacro / Semana Santa',
                          tonalidad: 'Do mayor', compas: '4/4', ano: '2026', dificultad: 'Básico' },
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

const EL_AUSENTE: Tema = {
  id: 'seed-el-ausente', numeroMarcacion: 9, titulo: 'El Ausente',
  compositor: 'Fruko y sus Tesos & Joe Arroyo', arreglista: 'José Gómez', genero: 'Salsa',
  tonalidad: 'La menor', compas: '2/2', tempo: '', duracion: '', ano: '', dificultad: 'Intermedio',
  notas: 'Clásico de la salsa colombiana. Arreglo para banda show.',
  partituras: [
    { instrumento: 'flauta', label: 'Flauta', url: '/partituras/el-ausente/flauta.pdf' },
    { instrumento: 'piccolo', label: 'Píccolo', url: '/partituras/el-ausente/piccolo.pdf' },
    { instrumento: 'clarinete-1', label: 'Clarinete 1', url: '/partituras/el-ausente/clarinete-1.pdf' },
    { instrumento: 'clarinete-2', label: 'Clarinete 2', url: '/partituras/el-ausente/clarinete-2.pdf' },
    { instrumento: 'sax-alto', label: 'Sax Alto', url: '/partituras/el-ausente/sax-alto.pdf' },
    { instrumento: 'sax-tenor', label: 'Sax Tenor', url: '/partituras/el-ausente/sax-tenor.pdf' },
    { instrumento: 'sax-baritono', label: 'Sax Barítono', url: '/partituras/el-ausente/sax-baritono.pdf' },
    { instrumento: 'trompeta-1', label: 'Trompeta 1', url: '/partituras/el-ausente/trompeta-1.pdf' },
    { instrumento: 'trompeta-2', label: 'Trompeta 2', url: '/partituras/el-ausente/trompeta-2.pdf' },
    { instrumento: 'melofono', label: 'Melófono', url: '/partituras/el-ausente/melofono.pdf' },
    { instrumento: 'trombon-1', label: 'Trombón 1', url: '/partituras/el-ausente/trombon-1.pdf' },
    { instrumento: 'trombon-2', label: 'Trombón 2', url: '/partituras/el-ausente/trombon-2.pdf' },
    { instrumento: 'tuba', label: 'Tuba', url: '/partituras/el-ausente/tuba.pdf' },
    { instrumento: 'redoblante', label: 'Redoblante', url: '/partituras/el-ausente/redoblante.pdf' },
    { instrumento: 'multitenor', label: 'Multitenor', url: '/partituras/el-ausente/multitenor.pdf' },
    { instrumento: 'platillos', label: 'Platillos', url: '/partituras/el-ausente/platillos.pdf' },
    { instrumento: 'bombos', label: 'Bombos', url: '/partituras/el-ausente/bombos.pdf' },
    { instrumento: 'percusion-lat', label: 'Conga', url: '/partituras/el-ausente/conga.pdf' },
    { instrumento: 'percusion-lat', label: 'Cowbell', url: '/partituras/el-ausente/cowbell.pdf' },
  ],
  categoria: 'temporada', activo: true, visibleTo: ['public'], esSeed: true,
  createdAt: new Date('2026-07-27'), updatedAt: new Date('2026-07-27'),
}

/** Repertorio oficial temporada 2026 (orden de marcación). */
export const REPERTORIO_SEED: Tema[] = [
  ...(manifest.temporada as TemaManifest[]).map(fromManifest),
  MAMBO,
  EL_AUSENTE,
].sort((a, b) => (a.numeroMarcacion ?? 999) - (b.numeroMarcacion ?? 999))

/** Repertorio de Semana Santa (sección aparte). */
export const REPERTORIO_SEMANA_SANTA: Tema[] = (manifest.semanaSanta as TemaManifest[]).map(fromManifest)
