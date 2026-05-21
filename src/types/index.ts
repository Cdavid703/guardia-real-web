// ──────────────────────────────────────────────────────────────────
// GUARDIA REAL DE ANTIOQUIA — Tipos globales
// ──────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'director' | 'integrante' | 'junta' | 'visitante' | 'pending'

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
  // Info adicional del integrante
  instrument?: string
  phone?: string
  joinedYear?: number
  active: boolean
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
