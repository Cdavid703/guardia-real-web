// ──────────────────────────────────────────────────────────────────
// GUARDIA REAL DE ANTIOQUIA — Secciones / instrumentos
// Catálogo único de instrumentos y familias usado por el roster de
// integrantes, la página de secciones y el panel de mapeo admin.
// La clave coincide con el campo `seccion` normalizado (MAYÚSCULAS sin
// acentos) que viene del Excel oficial.
// ──────────────────────────────────────────────────────────────────

export type FamiliaKey = 'metal' | 'madera' | 'percusion' | 'colorguard' | 'mando'

export interface Familia {
  key:    FamiliaKey
  label:  string
  emoji:  string
  accent: string // clase tailwind de color de acento
}

export const FAMILIAS: Record<FamiliaKey, Familia> = {
  metal:      { key: 'metal',      label: 'Vientos metal',     emoji: '🎺', accent: 'gold'  },
  madera:     { key: 'madera',     label: 'Vientos madera',    emoji: '🎷', accent: 'royal' },
  percusion:  { key: 'percusion',  label: 'Percusión',         emoji: '🥁', accent: 'navy'  },
  colorguard: { key: 'colorguard', label: 'Color Guard',       emoji: '🚩', accent: 'gold'  },
  mando:      { key: 'mando',      label: 'Mando y dirección', emoji: '🎖️', accent: 'royal' },
}

export interface Seccion {
  key:     string      // coincide con `seccion` del Excel (MAYÚSCULAS sin acentos)
  slug:    string      // para rutas e imágenes
  label:   string      // nombre legible
  familia: FamiliaKey
}

export const SECCIONES: Record<string, Seccion> = {
  'TROMPETA':         { key: 'TROMPETA',         slug: 'trompeta',         label: 'Trompeta',         familia: 'metal'      },
  'TROMBON':          { key: 'TROMBON',          slug: 'trombon',          label: 'Trombón',          familia: 'metal'      },
  'MELOFONO':         { key: 'MELOFONO',         slug: 'melofono',         label: 'Melófono',         familia: 'metal'      },
  'TUBA':             { key: 'TUBA',             slug: 'tuba',             label: 'Tuba',             familia: 'metal'      },
  'SAXOFON':          { key: 'SAXOFON',          slug: 'saxofon',          label: 'Saxofón',          familia: 'madera'     },
  'FLAUTA':           { key: 'FLAUTA',           slug: 'flauta',           label: 'Flauta',           familia: 'madera'     },
  'CLARINETE':        { key: 'CLARINETE',        slug: 'clarinete',        label: 'Clarinete',        familia: 'madera'     },
  'BOMBOS':           { key: 'BOMBOS',           slug: 'bombos',           label: 'Bombos',           familia: 'percusion'  },
  'REDOBLANTE':       { key: 'REDOBLANTE',       slug: 'redoblante',       label: 'Redoblante',       familia: 'percusion'  },
  'PLATILLO':         { key: 'PLATILLO',         slug: 'platillo',         label: 'Platillos',        familia: 'percusion'  },
  'MULTITENOR':       { key: 'MULTITENOR',       slug: 'multitenor',       label: 'Multitenor',       familia: 'percusion'  },
  'PERCUSION LATINA': { key: 'PERCUSION LATINA', slug: 'percusion-latina', label: 'Percusión latina', familia: 'percusion'  },
  'COLOR GUARD':      { key: 'COLOR GUARD',      slug: 'color-guard',      label: 'Color Guard',      familia: 'colorguard' },
  'DRUM MAJOR':       { key: 'DRUM MAJOR',       slug: 'drum-major',       label: 'Drum Major',       familia: 'mando'      },
}

export const SECCIONES_LIST: Seccion[] = Object.values(SECCIONES)

/** Devuelve la sección por su clave, tolerante a mayúsculas/acentos. */
export function getSeccion(key?: string): Seccion | undefined {
  if (!key) return undefined
  const norm = key.toUpperCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
  return SECCIONES[norm]
}

/** Ruta de la imagen representativa de la sección (puede no existir aún). */
export function seccionImage(slug: string): string {
  return `/images/secciones/${slug}.jpg`
}

/** Ruta de la imagen profesional del instrumento (ficha del integrante y carné). */
export function instrumentoImage(slug: string): string {
  return `/images/instrumentos/${slug}.png`
}

/** Agrupa una lista de secciones por familia, en orden de catálogo. */
export const SECCIONES_POR_FAMILIA: { familia: Familia; secciones: Seccion[] }[] =
  (Object.keys(FAMILIAS) as FamiliaKey[]).map(fk => ({
    familia: FAMILIAS[fk],
    secciones: SECCIONES_LIST.filter(s => s.familia === fk),
  }))
