'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Phone, Music, Image as ImageIcon, UserPlus } from 'lucide-react'

const PUBLIC_LINKS = [
  { href: '/',          icon: Home,       label: 'Página principal',  desc: 'Inicio, historia y presentación de la banda' },
  { href: '/nosotros',  icon: Music,      label: 'Nosotros',          desc: 'Historia y trayectoria de la Guardia Real' },
  { href: '/servicios', icon: Music,      label: 'Servicios',         desc: 'Exhibiciones, desfiles y contrataciones' },
  { href: '/galeria',   icon: ImageIcon,  label: 'Galería',           desc: 'Fotos y momentos de la banda' },
  { href: '/servicios?tab=contacto', icon: Phone, label: 'Contacto',  desc: 'Solicitar cotización o información' },
]

export default function VisitantePage() {
  const { profile } = useAuth()

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center px-4 py-16">
      <div className="max-w-xl w-full text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white shadow-md border border-gray-200 mb-6">
          <Image
            src="/images/escudo.png"
            alt="Guardia Real de Antioquia"
            width={72}
            height={72}
            className="object-contain"
          />
        </div>

        <h1 className="font-display text-navy text-2xl font-bold uppercase tracking-wider mb-1">
          Bienvenido, {profile?.displayName?.split(' ')[0] ?? 'Visitante'}
        </h1>
        <p className="font-serif italic text-gold mb-2">&ldquo;Disciplina, progreso y honor&rdquo;</p>
        <p className="text-gray-500 text-sm mb-6">
          Tu cuenta tiene acceso de visitante. Puedes explorar el sitio público
          mientras el administrador define tu rol.
        </p>

        {/* CTA — Solicitar ingreso */}
        <Link
          href="/ingresos"
          className="flex items-center gap-4 bg-gradient-to-r from-navy to-royal text-white rounded-xl px-6 py-5 mb-6 hover:shadow-lg transition-all group border-2 border-gold/30 hover:border-gold"
        >
          <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center shrink-0 group-hover:bg-gold/30 transition-all">
            <UserPlus size={22} className="text-gold" />
          </div>
          <div className="text-left flex-1">
            <p className="font-display text-sm font-bold uppercase tracking-wider text-gold">
              ¿Quieres unirte a la banda?
            </p>
            <p className="text-xs text-gray-300 mt-0.5">
              Completa la solicitud de ingreso — te contactamos en pocos días
            </p>
          </div>
          <span className="text-gold text-lg">→</span>
        </Link>

        <div className="grid gap-3 text-left">
          {PUBLIC_LINKS.map(({ href, icon: Icon, label, desc }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-4 bg-white rounded-lg border border-gray-200 px-5 py-4 hover:border-royal hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-navy/5 flex items-center justify-center group-hover:bg-navy group-hover:text-white transition-all shrink-0">
                <Icon size={18} className="text-navy group-hover:text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-dark">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
