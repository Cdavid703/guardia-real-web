import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { UserRole } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getRoleDashboard(role: UserRole): string {
  const map: Record<UserRole, string> = {
    admin:      '/dashboard/admin',
    director:   '/dashboard/director',
    integrante: '/dashboard/integrante',
    junta:      '/dashboard/junta',
    visitante:  '/dashboard/visitante',
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
    visitante:  'bg-green-100 text-green-700',
    pending:    'bg-gray-100 text-gray-600',
  }
  return colors[role] ?? 'bg-gray-100 text-gray-600'
}

export function formatDate(date: Date | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric', month: 'long', day: 'numeric',
    ...options,
  }).format(date)
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
