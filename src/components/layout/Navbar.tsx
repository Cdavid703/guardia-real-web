'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, LogIn, User, LogOut, LayoutDashboard, Shirt } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getRoleDashboard, getRoleLabel } from '@/lib/utils'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/',           label: 'Inicio' },
  { href: '/nosotros',   label: 'Nosotros' },
  { href: '/servicios',  label: 'Servicios' },
  { href: '/eventos',    label: 'Eventos' },
  { href: '/galeria',    label: 'Galería' },
  { href: '/noticias',   label: 'Noticias' },
  { href: '/ingresos',   label: 'Ingresos' },
  { href: '/contacto',   label: 'Contacto' },
]

export default function Navbar() {
  const [open,      setOpen]      = useState(false)
  const [scrolled,  setScrolled]  = useState(false)
  const [userMenu,  setUserMenu]  = useState(false)
  const pathname = usePathname()
  const router   = useRouter()
  const { user, profile, logout } = useAuth()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setOpen(false) }, [pathname])

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-[200] transition-all duration-300',
        scrolled
          ? 'bg-navy shadow-lg border-b-2 border-gold'
          : 'bg-navy/95 backdrop-blur-sm border-b-2 border-gold/60'
      )}
    >
      <nav className="section-container flex items-center justify-between h-16">

        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Image
            src="/images/escudo.png"
            alt="Guardia Real de Antioquia"
            width={36}
            height={36}
            className="object-contain"
            priority
          />
          <div className="hidden sm:block">
            <p className="font-display text-white text-xs font-bold tracking-[0.08em] uppercase leading-none">
              Guardia Real
            </p>
            <p className="text-sky text-[10px] tracking-wider uppercase leading-none mt-0.5">
              de Antioquia
            </p>
          </div>
        </Link>

        {/* ── Desktop links ── */}
        <ul className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded transition-colors duration-150',
                  pathname === href
                    ? 'text-gold border-b-2 border-gold'
                    : 'text-gray-200 hover:text-gold'
                )}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* ── Right side ── */}
        <div className="flex items-center gap-3">
          {/* CTA — contratar */}
          <Link
            href="/contacto"
            className="hidden md:inline-flex btn btn-gold btn-sm"
          >
            Contratar
          </Link>

          {/* User menu */}
          {user && profile ? (
            <div className="relative">
              <button
                onClick={() => setUserMenu(!userMenu)}
                className="flex items-center gap-2 text-gray-200 hover:text-white transition-colors"
              >
                {profile.photoURL ? (
                  <Image
                    src={profile.photoURL}
                    alt={profile.displayName}
                    width={32}
                    height={32}
                    className="rounded-full border-2 border-gold/60"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-royal flex items-center justify-center border-2 border-gold/60">
                    <User size={16} />
                  </div>
                )}
                <span className="hidden md:block text-sm font-medium truncate max-w-[120px]">
                  {profile.displayName.split(' ')[0]}
                </span>
              </button>

              {/* Dropdown */}
              {userMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-dark truncate">{profile.displayName}</p>
                    <p className="text-xs text-gray-400 truncate">{profile.email}</p>
                    <span className={cn('badge mt-1', 'bg-navy/10 text-navy')}>
                      {getRoleLabel(profile.role)}
                    </span>
                  </div>
                  <Link
                    href={getRoleDashboard(profile.role)}
                    onClick={() => setUserMenu(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <LayoutDashboard size={15} />
                    Mi panel
                  </Link>
                  {profile.role !== 'visitante' && profile.role !== 'pending' && (
                    <Link
                      href="/uniformes"
                      onClick={() => setUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Shirt size={15} />
                      Uniformes
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={15} />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="btn btn-outline-white btn-sm hidden sm:inline-flex">
              <LogIn size={15} />
              Ingresar
            </Link>
          )}

          {/* Hamburger */}
          <button
            className="lg:hidden text-gray-200 hover:text-white transition-colors p-1"
            onClick={() => setOpen(!open)}
            aria-label="Menú"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* ── Mobile drawer ── */}
      {open && (
        <div className="lg:hidden bg-near-black border-t border-gold/20">
          <ul className="section-container py-4 flex flex-col gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'block px-3 py-2.5 text-sm font-medium rounded transition-colors',
                    pathname === href
                      ? 'text-gold bg-white/5'
                      : 'text-gray-200 hover:text-gold hover:bg-white/5'
                  )}
                >
                  {label}
                </Link>
              </li>
            ))}
            <li className="pt-3 border-t border-white/10 mt-2">
              <Link href="/contacto" className="btn btn-gold btn-md w-full justify-center">
                Contratar la banda
              </Link>
            </li>
            {!user && (
              <li>
                <Link href="/login" className="btn btn-outline-white btn-md w-full justify-center mt-2">
                  <LogIn size={15} /> Ingresar
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </header>
  )
}
