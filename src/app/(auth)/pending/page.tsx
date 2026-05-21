'use client'

import { useEffect } from 'react'
import { useRouter }  from 'next/navigation'
import { useAuth }    from '@/contexts/AuthContext'
import { getRoleDashboard } from '@/lib/utils'
import { Clock, LogOut, Mail, Phone } from 'lucide-react'
import Image from 'next/image'
import Link  from 'next/link'

export default function PendingPage() {
  const { user, profile, logout, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) { router.replace('/login'); return }
      if (profile && profile.role !== 'pending') {
        router.replace(getRoleDashboard(profile.role))
      }
    }
  }, [user, profile, loading, router])

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 border border-white/20 mb-6">
          <Image src="/images/escudo.png" alt="Guardia Real" width={56} height={56} className="object-contain" />
        </div>

        {/* Waiting card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <Clock size={28} className="text-amber-600" />
          </div>

          <h1 className="font-display text-navy text-2xl font-bold uppercase tracking-wider mb-2">
            Cuenta pendiente
          </h1>
          <p className="font-serif italic text-gray-400 text-sm mb-6">
            &ldquo;Disciplina, progreso y honor&rdquo;
          </p>

          <p className="text-gray-600 text-sm leading-relaxed mb-6">
            Tu cuenta ha sido registrada exitosamente con el correo{' '}
            <strong className="text-navy">{profile?.email}</strong>.
            Un administrador debe asignarte un rol para que puedas acceder al portal.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-amber-700 text-xs font-semibold uppercase tracking-wider mb-2">
              ¿Qué hacer ahora?
            </p>
            <ul className="text-amber-700 text-sm space-y-1.5">
              <li className="flex gap-2 items-start">
                <span className="mt-0.5">1.</span>
                Comunícate con un administrador de la corporación.
              </li>
              <li className="flex gap-2 items-start">
                <span className="mt-0.5">2.</span>
                Diles tu correo electrónico registrado.
              </li>
              <li className="flex gap-2 items-start">
                <span className="mt-0.5">3.</span>
                Vuelve a ingresar cuando te confirmen la asignación.
              </li>
            </ul>
          </div>

          {/* Contacts */}
          <div className="space-y-2 mb-6">
            <a href="tel:+573197735052" className="flex items-center gap-2 justify-center text-sm text-gray-600 hover:text-navy transition-colors">
              <Phone size={14} /> 319 773 5052 — Dairo Villada
            </a>
            <a href="mailto:bandashowguardiareal@outlook.com" className="flex items-center gap-2 justify-center text-xs text-gray-500 hover:text-navy transition-colors">
              <Mail size={13} /> bandashowguardiareal@outlook.com
            </a>
          </div>

          <button onClick={handleLogout} className="btn btn-outline btn-md w-full justify-center">
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>

        <p className="mt-6 text-sm text-gray-400">
          <Link href="/" className="hover:text-gold transition-colors">← Volver al sitio</Link>
        </p>
      </div>
    </div>
  )
}
