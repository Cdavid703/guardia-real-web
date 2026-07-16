import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { UserRole } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Roles con panel (dashboard) propio. El resto gestiona todo desde /integrantes. */
export const PANEL_ROLES: UserRole[] = ['admin', 'director', 'cm', 'collector']

export function getRoleDashboard(role: UserRole): string {
  const map: Record<UserRole, string> = {
    admin:      '/dashboard/admin',
    director:   '/dashboard/director',
    cm:         '/dashboard/cm',
    collector:  '/dashboard/collector',
    // Sin panel propio: gestionan todo desde la pestaña "Integrantes" del sitio.
    integrante: '/integrantes',
    junta:      '/integrantes',
    visitante:  '/',
    pending:    '/pending',
  }
  return map[role] ?? '/pending'
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    admin:      'Administrador',
    director:   'Director Musical',
    integrante: 'Integrante',
    junta:      'Junta Directiva',
    cm:         'Community Manager',
    collector:  'Recaudador',
    visitante:  'Visitante',
    pending:    'Pendiente de aprobación',
  }
  return labels[role] ?? 'Desconocido'
}

export function getRoleBadgeColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    admin:      'bg-red-100 text-red-700',
    director:   'bg-purple-100 text-purple-700',
    integrante: 'bg-blue-100 text-blue-700',
    junta:      'bg-amber-100 text-amber-700',
    cm:         'bg-pink-100 text-pink-700',
    collector:  'bg-teal-100 text-teal-700',
    visitante:  'bg-green-100 text-green-700',
    pending:    'bg-gray-100 text-gray-600',
  }
  return colors[role] ?? 'bg-gray-100 text-gray-600'
}

/** Extrae el ID de un enlace de YouTube en cualquier formato */
export function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  )
  return match ? match[1] : null
}

/** Convierte cualquier URL de YouTube a URL de embed */
export function getYouTubeEmbedUrl(url: string): string | null {
  const id = getYouTubeId(url)
  return id ? `https://www.youtube.com/embed/${id}` : null
}

/** Thumbnail HQ de un video de YouTube */
export function getYouTubeThumbnail(url: string): string | null {
  const id = getYouTubeId(url)
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null
}

export function formatDate(date: Date | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric', month: 'long', day: 'numeric',
    ...options,
  }).format(date)
}

/**
 * Detecta si la página se abrió dentro de un navegador embebido (WhatsApp,
 * Instagram, Facebook, Line, etc.). Google bloquea el login OAuth dentro de
 * estos WebViews por política propia ("disallowed_useragent"), así que el
 * login con Google/Microsoft falla ahí sin importar el código de la app.
 */
export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /\b(WhatsApp|FBAN|FBAV|Instagram|Line\/|MicroMessenger|TikTok|Snapchat)\b/i.test(ua)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}
