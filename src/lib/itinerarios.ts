// ──────────────────────────────────────────────────────────────────
// GUARDIA REAL DE ANTIOQUIA — Itinerarios de presentaciones
// Datos de los instructivos/cronogramas de fin de semana. Reutilizable:
// para un nuevo fin de semana se agrega otro objeto y se marca activo.
// ──────────────────────────────────────────────────────────────────

export interface EventoItinerario {
  fechaISO:       string   // 'YYYY-MM-DD'
  hora:           string   // '6:00 p.m.'
  evento:         string
  lugar:          string
  uniforme:       string[]
  puntoEncuentro: string
}

export interface Itinerario {
  id:          string
  titulo:      string
  rango:       string
  descripcion: string
  pdfUrl?:     string
  cronograma:  EventoItinerario[]
  activo:      boolean
}

const BASE_UNIFORME = [
  'Chaqueta negra con azul',
  'Accesorio quepis nuevo',
  'Puños nuevos',
  'Guantes blancos',
  'Zapatos negros',
  'Faldón',
]

export const ITINERARIOS: Itinerario[] = [
  {
    id: 'jul-18-20-2026',
    titulo: 'Instructivo 18 – 20 de julio 2026',
    rango: '18 al 20 de julio de 2026',
    descripcion:
      'Cuatro presentaciones este fin de semana. Todas las horas indican el momento en que cada ' +
      'integrante debe estar en el punto de inicio completamente uniformado y listo (no la hora de salida ' +
      'desde casa). Los puntos de encuentro y la hora de apertura de la sede se informan por WhatsApp.',
    pdfUrl: '/docs/instructivo-18-20-julio-2026.pdf',
    activo: true,
    cronograma: [
      {
        fechaISO: '2026-07-18', hora: '6:00 p.m.',
        evento: 'Desfile Artístico en honor a la Virgen del Carmen',
        lugar: 'Cootrasana — San Antonio de Prado',
        puntoEncuentro: 'Se informará por WhatsApp',
        uniforme: ['Pantalón overol BLANCO', 'Quepis con pluma AZUL', ...BASE_UNIFORME],
      },
      {
        fechaISO: '2026-07-19', hora: '9:30 a.m.',
        evento: 'XVIII Desfile de Silleteritos',
        lugar: 'Santa Elena',
        puntoEncuentro: 'Se informará por WhatsApp',
        uniforme: ['Pantalón overol NEGRO', 'Quepis con pluma AZUL', ...BASE_UNIFORME],
      },
      {
        fechaISO: '2026-07-20', hora: '9:30 a.m.',
        evento: 'Desfile conmemoración de la Independencia',
        lugar: 'Municipio de La Ceja',
        puntoEncuentro: 'Se informará por WhatsApp',
        uniforme: ['Pantalón overol NEGRO', 'Quepis con pluma BLANCA', ...BASE_UNIFORME],
      },
      {
        fechaISO: '2026-07-20', hora: '1:20 p.m.',
        evento: 'Concurso de Bandas',
        lugar: 'Bello, Antioquia',
        puntoEncuentro: 'Se informará por WhatsApp',
        uniforme: ['Mismo uniforme de La Ceja', 'Pantalón overol NEGRO', 'Quepis con pluma BLANCA', ...BASE_UNIFORME],
      },
    ],
  },
]

export function itinerarioActivo(): Itinerario | undefined {
  return ITINERARIOS.find(i => i.activo)
}

/** Eventos del itinerario activo con fecha >= hoy (para agenda y recordatorios). */
export function proximosDelItinerario(hoyISO: string): { fecha: string; hora: string; titulo: string; lugar: string }[] {
  const it = itinerarioActivo()
  if (!it) return []
  return it.cronograma
    .filter(e => e.fechaISO >= hoyISO)
    .map(e => ({ fecha: e.fechaISO, hora: e.hora, titulo: e.evento, lugar: e.lugar }))
}
