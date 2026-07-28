'use client'

import { useEffect, useState } from 'react'
import { useRouter }  from 'next/navigation'
import { useAuth }    from '@/contexts/AuthContext'
import { getRoleDashboard, getRoleLabel, cn } from '@/lib/utils'
import { updateUserRole, updateUserProfile } from '@/lib/firebase'
import { Clock, LogOut, MessageCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import Link  from 'next/link'
import type { UserRole } from '@/types'

const SELF_SERVICE_ROLES: { value: UserRole; label: string; desc: string }[] = [
  { value: 'visitante',  label: 'Visitante',         desc: 'Acceso inmediato como visitante del portal' },
  { value: 'integrante', label: 'Integrante',        desc: 'Soy músico, bailarín o artista de la banda' },
  { value: 'junta',      label: 'Junta Directiva',   desc: 'Hago parte de la junta directiva' },
  { value: 'director',   label: 'Director Musical',  desc: 'Soy director musical de la corporación' },
  { value: 'cm',         label: 'Community Manager', desc: 'Gestiono redes sociales y contenido' },
]

export default function PendingPage() {
  const { user, profile, logout, loading, refreshProfile } = useAuth()
  const router = useRouter()
  const [submitting, setSubmitting] = useState<UserRole | null>(null)

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

  const handleChooseRole = async (role: UserRole) => {
    if (!profile) return
    setSubmitting(role)
    try {
      if (role === 'visitante') {
        await updateUserRole(profile.uid, 'visitante')
        await refreshProfile?.()
        toast.success('¡Listo! Ya tienes acceso como visitante.')
        router.replace('/dashboard/visitante')
      } else {
        await updateUserProfile(profile.uid, { requestedRole: role })
        await refreshProfile?.()
        toast.success('Solicitud enviada. Quedará pendiente de aprobación.')
      }
    } catch {
      toast.error('Ocurrió un error. Intenta de nuevo.')
    } finally {
      setSubmitting(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    )
  }

  const requestedRole = profile?.requestedRole

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4 py-12">
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
          </p>

          {requestedRole ? (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
              <p className="text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle2 size={14} />
                Solicitud enviada
              </p>
              <p className="text-blue-700 text-sm">
                Tu solicitud para el rol de <strong>{getRoleLabel(requestedRole)}</strong> quedó
                pendiente de aprobación por la administración. Te notificaremos cuando sea revisada.
              </p>
            </div>
          ) : (
            <div className="text-left mb-6">
              <p className="text-dark text-sm font-semibold mb-3">
                Mientras revisamos tu cuenta, elige cómo quieres ingresar:
              </p>
              <div className="space-y-2">
                {SELF_SERVICE_ROLES.map(({ value, label, desc }) => (
                  <button
                    key={value}
                    onClick={() => handleChooseRole(value)}
                    disabled={submitting !== null}
                    className={cn(
                      'w-full text-left px-4 py-3 rounded-xl border-2 transition-colors disabled:opacity-50',
                      'border-gray-200 hover:border-royal hover:bg-royal/5'
                    )}
                  >
                    <p className="text-sm font-semibold text-dark">{label}</p>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Si eliges <strong>Visitante</strong> tendrás acceso inmediato. Cualquier otro rol
                quedará pendiente de aprobación por la administración.
              </p>
            </div>
          )}

          {/* Contacto para ingreso urgente */}
          <div className="bg-gold/10 border border-gold/30 rounded-xl p-4 mb-6 text-center">
            <p className="text-sm text-dark font-semibold mb-2">¿Necesitas tu ingreso con urgencia?</p>
            <p className="text-xs text-gray-500 mb-3">Comunícate con <strong className="text-navy">Carlos David Jaramillo</strong> para facilitar y gestionar tu ingreso.</p>
            <a
              href={`https://wa.me/573508341643?text=${encodeURIComponent('Hola Carlos David. Necesito gestionar mi ingreso a la Guardia Real de Antioquia como integrante.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 justify-center px-4 py-2.5 rounded-lg text-white text-sm font-semibold transition-colors"
              style={{ backgroundColor: '#25D366' }}
            >
              <MessageCircle size={16} /> Hablar por WhatsApp
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
