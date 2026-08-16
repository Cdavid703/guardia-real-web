// ──────────────────────────────────────────────────────────────────
// GUARDIA REAL DE ANTIOQUIA — Tipos globales
// ──────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'director' | 'integrante' | 'junta' | 'cm' | 'collector' | 'staff' | 'monitor' | 'visitante' | 'pending'

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  role: UserRole
  // Rol solicitado por el usuario, pendiente de aprobación por administración
  requestedRole?: UserRole
  // Secciones que monitorea (solo rol monitor); el admin las asigna
  seccionesMonitor?: string[]
  createdAt: Date
  updatedAt: Date
  // Info adicional del integrante
  instrument?: string
  phone?:      string
  joinedYear?: number
  bio?:        string
  active:      boolean
}

// ──────────────────────────────────────────────────────────────────
// Roster oficial de integrantes (colección `integrantes`)
// Importado del Excel institucional y mantenido por admin + cada integrante.
// Contiene datos sensibles (cédula, dirección, salud) — acceso restringido
// por reglas de Firestore.
// ──────────────────────────────────────────────────────────────────
export interface Integrante {
  id:                 string
  // Identidad
  nombre:             string
  apellidos:          string
  tipoDoc:            string
  numDoc:             string
  fechaNacimiento:    string   // ISO (YYYY-MM-DD) o texto libre
  // Sección musical
  seccion:            string   // clave de SECCIONES (MAYÚSCULAS sin acentos)
  familia:            string   // FamiliaKey
  secciones:          string[] // un integrante puede estar en 2+ secciones
  // Contacto
  whatsapp:           string
  correo:             string
  direccion:          string
  // Salud / sensible
  tipoSangre:         string
  eps:                string
  pasaporte:          boolean
  contactoEmergencia: string   // nombre + parentesco + teléfono
  diagnostico:        string   // diagnóstico médico / medicamentos
  // Rol asignado a esta ficha; viaja a la cuenta cuando la persona inicia sesión
  rol?:               UserRole  // por defecto 'integrante'
  // Vínculo con cuenta(s) de login
  linkedUid?:         string   // (legacy) uid de la primera cuenta enlazada
  linkedUids?:        string[] // uids de TODAS las cuentas con acceso a esta ficha
  correosAutorizados?: string[] // correos que pueden acceder/reclamar esta ficha
  // Perfil
  fotoURL?:           string
  // Control de prendas del uniforme
  chaqueta?:          ChaquetaInfo
  kepis?:             ChaquetaInfo
  // Autorización del acudiente (solo menores de edad)
  autorizacionMenor?: AutorizacionMenor
  // Consentimiento de tratamiento de datos (Ley 1581 / Habeas Data)
  consentimientoDatos?: boolean
  consentimientoFecha?: string  // ISO de cuándo aceptó
  // Completitud (metadatos no sensibles, calculados al guardar)
  faltan?:            string[]  // etiquetas de campos requeridos vacíos
  datosCompletos?:    boolean
  // Metadatos
  activo:             boolean
  createdAt:          Date
  updatedAt:          Date
  updatedBy?:         string   // uid de quien actualizó por última vez
}

// Control de prendas del uniforme (chaqueta, kepis) — mapeo admin + confirmación firmada
export type PrendaKey = 'chaqueta' | 'kepis'

export interface PrendaEvento {
  tipo: 'solicitada' | 'confirmada' | 'no_tiene' | 'entregada' | 'devuelta' | 'entrega_anulada' | 'devolucion_anulada'
  en:   string   // ISO
  por?: string   // nombre de quien lo hizo
}

export interface ChaquetaInfo {
  tiene:                boolean   // el integrante tiene la prenda (marcado por admin o al firmar)
  estado:              'sin_registrar' | 'solicitada' | 'confirmada' | 'no_tiene'
  // Solicitud de confirmación enviada por la administración
  solicitadaEn?:        string   // ISO
  solicitadaPorUid?:    string
  solicitadaPorNombre?: string
  // Aceptación firmada por el integrante
  confirmadaEn?:        string   // ISO fecha/hora
  firmaNombre?:         string   // nombre con el que firmó
  confirmadaPorUid?:    string   // uid del integrante que respondió
  // Respuesta "no la tengo" (deja habilitado volver a preguntar)
  respondidaEn?:        string   // ISO
  // Talla que declara el integrante al confirmar
  talla?:               string
  // Control de inventario / préstamo (gestiona el admin)
  numero?:              string   // número físico de la prenda entregada
  entregadaEn?:         string   // ISO: cuándo se entregó
  devueltaEn?:          string   // ISO: cuándo se devolvió
  // Bitácora de eventos (auditoría)
  historial?:           PrendaEvento[]
  // La imagen de la firma (PNG base64) NO va aquí: se guarda en integrantesPrivado.
}

// Autorización del acudiente para un integrante menor de edad (firma digital)
export interface AutorizacionMenor {
  estado:          'firmada'
  acudienteNombre: string
  parentesco:      string
  acudienteDoc:    string    // documento del acudiente
  acudienteTel?:   string
  firmadaEn:       string    // ISO
  firmadaPorUid?:  string
  // La imagen de la firma va en integrantesPrivado.autorizacionMenorFirma
}

// ──────────────────────────────────────────────────────────────────
// Repertorio / Partituras (colección `repertoire`)
// ──────────────────────────────────────────────────────────────────
export interface Partitura {
  instrumento: string   // clave de INSTRUMENTOS_PARTITURA (para agrupar por familia)
  label?:      string   // nombre a mostrar (tal cual el archivo, ej. "Trumpet in Bb 1")
  url:         string   // ruta pública o URL de Storage
  filename?:   string
}

export interface Tema {
  id:              string
  numeroMarcacion?: number
  titulo:          string
  compositor:      string
  arreglista:      string
  genero:          string
  tonalidad:       string
  compas:          string
  tempo:           string
  duracion:        string
  ano:             string
  dificultad:      string   // 'Básico' | 'Intermedio' | 'Avanzado' | ''
  notas:           string
  partituras:      Partitura[]
  audioUrl?:       string   // enlace de referencia (YouTube/mp3)
  categoria?:      string   // 'temporada' (por defecto) | 'semana-santa'
  activo:          boolean  // en repertorio actual vs archivado
  visibleTo:       string[]
  esSeed?:         boolean  // temas base definidos en código (no editables desde la UI)
  createdAt:       Date
  updatedAt:       Date
  uploadedBy?:     string
}

/** Revisión de un tema por integrante: calificación (1–5) + comentario. */
export interface Calificacion {
  id:            string   // `${integranteId}__${temaId}`
  integranteId:  string
  temaId:        string
  temaTitulo?:   string
  calificacion:  number   // 1–5 (0 = sin calificar)
  comentario?:   string
  calificadoPor?: string  // uid de quien calificó
  calificadoPorNombre?: string
  updatedAt?:    Date
}

export interface NewsArticle {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage?: string
  author: string
  authorId: string
  publishedAt: Date
  updatedAt: Date
  published: boolean
  tags: string[]
}

export interface GalleryItem {
  id: string
  title: string
  description?: string
  imageUrl: string
  thumbnailUrl?: string
  event?: string
  date: Date
  uploadedBy: string
  featured: boolean
}

export interface QuoteRequest {
  id: string
  name: string
  email: string
  phone: string
  organization?: string
  eventType: string
  eventDate: string
  eventLocation: string
  attendees?: string
  serviceType: 'campo' | 'desfile' | 'ambos'
  message?: string
  status: 'pending' | 'contacted' | 'confirmed' | 'closed'
  createdAt: Date
}

export interface Event {
  id: string
  title: string
  description?: string
  type: 'ensayo' | 'presentacion' | 'concurso' | 'reunion' | 'otro'
  date: Date
  startTime: string
  endTime?: string
  location: string
  createdBy: string
  visibleTo: UserRole[]
}

export interface Repertoire {
  id: string
  title: string
  composer?: string
  arranger?: string
  genre: string
  level: 'basico' | 'intermedio' | 'avanzado'
  scoreUrl?: string
  audioUrl?: string
  notes?: string
  addedBy: string
  createdAt: Date
}

export interface Document {
  id: string
  title: string
  description?: string
  fileUrl: string
  category: 'acta' | 'informe' | 'estatutos' | 'contrato' | 'otro'
  visibleTo: UserRole[]
  uploadedBy: string
  createdAt: Date
}

export interface IngresoRequest {
  id: string
  // datos personales
  nombreCompleto: string
  identificacion: string
  email: string
  telefono: string
  // datos musicales
  instrumentoInteres:      string
  instrumentoPropio:       boolean
  experienciaPrevia:       boolean
  instrumentosExperiencia?: string
  nivelExperiencia:        'ninguna' | 'basica' | 'intermedia' | 'avanzada'
  // datos logísticos
  fechaNacimiento: string
  barrio: string
  ciudad: string
  disponibilidad: string
  comoSeEntero: string
  mensaje?: string
  // estado
  status: 'nuevo' | 'contactado' | 'aceptado' | 'rechazado' | 'cancelado'
  notes?: string
  historial?: IngresoHistorial[]
  lastUpdatedBy?: string
  updatedAt?: Date
  createdAt: Date
}

/** Bitácora de gestión de una solicitud de ingreso (quién hizo qué y cuándo). */
export interface IngresoHistorial {
  tipo:    'estado' | 'comentario'
  estado?: string   // cuando tipo = 'estado'
  texto?:  string   // cuando tipo = 'comentario'
  por:     string   // nombre de quien gestionó
  porUid:  string
  en:      string   // ISO
}

// ── Band Events (calendar) ─────────────────────────────────────────
export interface BandEvent {
  id: string
  title: string
  description?: string
  type: 'presentacion' | 'concurso' | 'desfile' | 'reunion' | 'otro'
  date: string // YYYY-MM-DD
  startTime: string
  endTime?: string
  location: string
  address?: string
  city?: string
  image?: string
  isPublic: boolean
  visibleTo: string[]
  createdBy: string
  createdAt: Date
  updatedAt?: Date
  notified?: boolean
}

// ── Pagos / mensualidades ──────────────────────────────────────────
export interface Pago {
  id:               string
  integranteId:     string
  integranteNombre?: string
  periodo:          string   // YYYY-MM
  concepto:         string   // 'Mensualidad', 'Uniforme', 'Gira', etc.
  pagado:           boolean
  monto?:           number
  fecha?:           string   // ISO (cuándo pagó)
  metodo?:          string
  registradoPor?:   string
  // Recibo digital
  reciboNumero?:    string
  token?:           string   // acceso privado al recibo
  pagadoEn?:        string   // ISO con fecha y hora exacta
  createdAt:        Date
}

// ── Giras / viajes ─────────────────────────────────────────────────
export interface Gira {
  id:          string
  titulo:      string
  destino:     string
  fechaInicio: string   // YYYY-MM-DD
  fechaFin?:   string
  descripcion?: string
  inscritos:   string[] // ids de integrantes inscritos
  createdBy:   string
  createdAt:   Date
  updatedAt?:  Date
}

// ── Ensayos ────────────────────────────────────────────────────────
export interface Ensayo {
  id: string
  title: string
  type: 'general' | 'vientos' | 'percusion' | 'colorguard' | 'brass' | 'reunion'
  date: string // YYYY-MM-DD
  startTime: string
  endTime?: string
  location: string
  objective?: string
  notes?: string
  image?: string
  visibleTo: string[] // roles
  createdBy: string
  createdAt: Date
  notified?: boolean
}

// ── Gallery Media ──────────────────────────────────────────────────
export interface GalleryMedia {
  id: string
  type: 'photo' | 'video' | 'youtube' | 'instagram' | 'facebook' | 'link'
  title: string
  description?: string
  url: string
  thumbnail?: string
  visibleTo: string[]
  uploadedBy: string
  createdAt: Date
}

// ── Repertoire / Sheet music ───────────────────────────────────────
export interface ScoreFile {
  id: string
  section: string
  label: string
  url: string
  filename: string
}

export interface RepertoireSong {
  id: string
  title: string
  composer?: string
  arranger?: string
  transcriber?: string
  genre: string
  level: 'basico' | 'intermedio' | 'avanzado'
  notes?: string
  scores: ScoreFile[]
  visibleTo: string[]
  addedBy: string
  createdAt: Date
  updatedAt: Date
}

// ── Donations ──────────────────────────────────────────────────────
export interface Donation {
  id: string
  nombre: string
  telefono: string
  identificacion?: string
  email: string
  monto?: string
  comentarios?: string
  evidenciaUrl?: string
  status: 'recibida' | 'verificada' | 'rechazada'
  createdAt: Date
}

// ── Nav links ──────────────────────────────────────────────────────
export interface NavLink {
  label: string
  href: string
  icon?: string
}

// ── Dashboard card stats ───────────────────────────────────────────
export interface StatCard {
  label: string
  value: string | number
  icon: string
  change?: string
  color?: string
}
