'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, ExternalLink, Menu, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react'
import { cn, getRoleLabel, getRoleBadgeColor, getRoleDashboard } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import type { UserProfile } from '@/types'

interface Props {
  profile:     UserProfile
  onMenuOpen?: () => void
}

export default function DashboardTopbar({ profile, onMenuOpen }: Props) {
  const [userMenu, setUserMenu] = useState(false)
  const { logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    setUserMenu(false)
    await logout()
    router.push('/')
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 shrink-0 shadow-sm">

      {/* Left — hamburger en móvil + bienvenida */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuOpen}
          className="md:hidden w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu size={18} className="text-gray-600" />
        </button>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:block">
            Portal Interno
          </p>
          <p className="text-sm font-semibold text-dark truncate max-w-[160px] sm:max-w-[220px]">
            Bienvenido, {profile.displayName.split(' ')[0]}
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/"
          target="_blank"
          className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 hover:text-navy transition-colors"
        >
          <ExternalLink size={13} />
          Sitio público
        </Link>

        <button className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors relative">
          <Bell size={17} className="text-gray-500" />
          <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gold" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenu(!userMenu)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            aria-label="Menú de usuario"
          >
            {profile.photoURL ? (
              <Image
                src={profile.photoURL}
                alt={profile.displayName}
                width={36}
                height={36}
                className="rounded-full border-2 border-gray-200"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-navy flex items-center justify-center text-white text-sm font-bold shrink-0">
                {profile.displayName[0].toUpperCase()}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-dark leading-none truncate max-w-[120px]">
                {profile.displayName.split(' ')[0]}
              </p>
              <span className={cn('badge text-[10px] mt-0.5', getRoleBadgeColor(profile.role))}>
                {getRoleLabel(profile.role)}
              </span>
            </div>
            <ChevronDown size={14} className={cn('text-gray-400 transition-transform hidden sm:block', userMenu && 'rotate-180')} />
          </button>

          {/* Dropdown */}
          {userMenu && (
            <>
              {/* Overlay para cerrar */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setUserMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-20">
                {/* Info */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-dark truncate">{profile.displayName}</p>
                  <p className="text-xs text-gray-400 truncate">{profile.email}</p>
                  <span className={cn('badge mt-1 text-[10px]', getRoleBadgeColor(profile.role))}>
                    {getRoleLabel(profile.role)}
                  </span>
                </div>

                {/* Mi panel */}
                <Link
                  href={getRoleDashboard(profile.role)}
                  onClick={() => setUserMenu(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <LayoutDashboard size={15} className="text-royal" />
                  Mi panel principal
                </Link>

                {/* Ver sitio público */}
                <Link
                  href="/"
                  target="_blank"
                  onClick={() => setUserMenu(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors sm:hidden"
                >
                  <ExternalLink size={15} className="text-gray-400" />
                  Ver sitio público
                </Link>

                <div className="border-t border-gray-100 mt-1" />

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={15} />
                  Cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
