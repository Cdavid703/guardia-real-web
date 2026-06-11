'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Newspaper, Image as ImageIcon,
  Music, Calendar, FileText, MessageSquare, Settings,
  ChevronLeft, ChevronRight, LogOut, ClipboardList, Globe, X,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { cn, getRoleLabel } from '@/lib/utils'
import type { UserRole } from '@/types'

type NavItem = { href: string; label: string; icon: React.ElementType; roles: UserRole[] }

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',                   label: 'Panel principal',   icon: LayoutDashboard, roles: ['admin','director','integrante','junta','cm'] },
  { href: '/dashboard/equipo',            label: 'Integrantes',       icon: Users,           roles: ['admin','director','junta','cm','integrante'] },
  { href: '/dashboard/admin',             label: 'Gestión usuarios',  icon: Users,           roles: ['admin'] },
  { href: '/dashboard/admin/integrantes', label: 'Solicitudes y roles', icon: ClipboardList, roles: ['admin'] },
  { href: '/dashboard/admin/noticias',    label: 'Noticias',          icon: Newspaper,       roles: ['admin'] },
  { href: '/dashboard/admin/events',      label: 'Eventos',           icon: Calendar,        roles: ['admin'] },
  { href: '/dashboard/admin/gallery',     label: 'Galería (admin)',   icon: ImageIcon,       roles: ['admin'] },
  { href: '/dashboard/admin/quotes',      label: 'Cotizaciones',      icon: MessageSquare,   roles: ['admin'] },
  { href: '/dashboard/director',          label: 'Repertorio',        icon: Music,           roles: ['admin','director'] },
  { href: '/dashboard/director/events',   label: 'Ensayos',           icon: ClipboardList,   roles: ['admin','director'] },
  { href: '/dashboard/integrante',        label: 'Portal integrante', icon: Settings,        roles: ['admin','integrante'] },
  { href: '/dashboard/junta',             label: 'Documentos',        icon: FileText,        roles: ['admin','junta'] },
  { href: '/dashboard/cm',               label: 'Panel CM',          icon: Globe,           roles: ['cm'] },
  { href: '/dashboard/cm/noticias',       label: 'Publicar noticias', icon: Newspaper,       roles: ['cm'] },
  { href: '/dashboard/cm/galeria',        label: 'Galería / Media',   icon: ImageIcon,       roles: ['cm'] },
]

interface Props {
  role:     UserRole
  onClose?: () => void
}

export default function DashboardSidebar({ role, onClose }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname  = usePathname()
  const { logout } = useAuth()
  const router    = useRouter()

  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(role))

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const handleNavClick = () => {
    // Cierra el drawer en móvil al navegar
    onClose?.()
  }

  return (
    <aside
      className={cn(
        'flex flex-col bg-navy border-r border-white/10 transition-all duration-300 shrink-0 h-full min-h-screen',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo + botón cerrar en móvil */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10 shrink-0">
        <Image src="/images/escudo.png" alt="GRA" width={32} height={32} className="shrink-0" />
        {!collapsed && (
          <div className="flex-1 overflow-hidden">
            <p className="font-display text-white text-xs font-bold tracking-wider uppercase truncate">Guardia Real</p>
            <p className="text-sky text-[9px] tracking-wider uppercase">{getRoleLabel(role)}</p>
          </div>
        )}
        {/* X solo en móvil */}
        {onClose && !collapsed && (
          <button
            onClick={onClose}
            className="md:hidden w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-gray-300 hover:text-white shrink-0"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-0.5 px-2">
          {visibleItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={handleNavClick}
                  title={collapsed ? label : undefined}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    active
                      ? 'bg-royal text-white'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <Icon size={17} className="shrink-0" />
                  {!collapsed && <span className="truncate">{label}</span>}
                  {active && !collapsed && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Logout + colapsar (colapsar solo en desktop) */}
      <div className="p-2 border-t border-white/10 space-y-1">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          title={collapsed ? 'Cerrar sesión' : undefined}
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && 'Cerrar sesión'}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && 'Minimizar'}
        </button>
      </div>
    </aside>
  )
}
