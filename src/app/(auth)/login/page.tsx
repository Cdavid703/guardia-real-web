'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import { AlertCircle, Mail, Lock, ExternalLink, Copy } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getRoleDashboard, isInAppBrowser } from '@/lib/utils'

// SVG icons inline para evitar dependencia de imágenes externas
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function LoginContent() {
  const [loadingGoogle,    setLoadingGoogle]    = useState(false)
  const [loadingEmail,     setLoadingEmail]     = useState(false)
  const [email,            setEmail]            = useState('')
  const [password,         setPassword]         = useState('')
  const [inAppBrowser,     setInAppBrowser]     = useState(false)

  const { loginWithGoogle, loginWithEmail, user, profile } = useAuth()
  const router       = useRouter()

  useEffect(() => {
    setInAppBrowser(isInAppBrowser())
  }, [])

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Enlace copiado. Pégalo en Chrome o Safari para continuar.')
    } catch {
      toast.error('No se pudo copiar el enlace, cópialo manualmente desde la barra de direcciones.')
    }
  }

  // Redirect if already logged in
  useEffect(() => {
    if (user && profile) {
      router.replace(getRoleDashboard(profile.role))
    }
  }, [user, profile, router])

  const handleGoogle = async () => {
    if (inAppBrowser) {
      toast.error('Google no permite iniciar sesión desde WhatsApp/Instagram. Abre este enlace en Chrome o Safari.', { duration: 8000 })
      return
    }
    setLoadingGoogle(true)
    try {
      await loginWithGoogle()
      toast.success('¡Bienvenido!')
      window.location.href = '/dashboard'
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? ''
      const msg  = err instanceof Error ? err.message : 'Error desconocido'
      if (!code.includes('popup-closed') && !msg.includes('popup-closed')) {
        toast.error(`Error Google: ${code || msg}`, { duration: 10000 })
      }
    } finally {
      setLoadingGoogle(false)
    }
  }

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Ingresa correo y contraseña')
      return
    }
    setLoadingEmail(true)
    try {
      await loginWithEmail(email, password)
      toast.success('¡Bienvenido!')
      window.location.href = '/dashboard'
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? ''
      let msg = 'Error al iniciar sesión'
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        msg = 'Correo o contraseña incorrectos'
      } else if (code === 'auth/too-many-requests') {
        msg = 'Demasiados intentos. Espera unos minutos.'
      } else if (code) {
        msg = `Error: ${code}`
      }
      toast.error(msg, { duration: 8000 })
    } finally {
      setLoadingEmail(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4">
      {/* Background decoration */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 60% 40%, rgba(242,193,0,.06) 0%, transparent 55%)' }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 border border-white/20 mb-5">
            <Image
              src="/images/escudo.png"
              alt="Guardia Real de Antioquia"
              width={56}
              height={56}
              className="object-contain"
            />
          </div>
          <h1 className="font-display text-white text-2xl font-bold uppercase tracking-wider">
            Guardia Real
          </h1>
          <p className="text-sky text-sm uppercase tracking-wider mt-1">de Antioquia</p>
          <p className="font-serif italic text-gold text-sm mt-2">
            &ldquo;Disciplina, progreso y honor&rdquo;
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="font-serif text-navy text-xl font-bold text-center mb-1">
            Acceso al portal
          </h2>
          <p className="text-gray-400 text-sm text-center mb-8">
            Exclusivo para integrantes y directivos de la corporación
          </p>

          {inAppBrowser && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
              <ExternalLink size={16} className="text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-700 leading-relaxed flex-1">
                <strong>Estás navegando desde WhatsApp/Instagram.</strong> Google no permite
                iniciar sesión dentro de estas apps. Toca <strong>⋮</strong> o el ícono de compartir
                y elige <strong>&ldquo;Abrir en el navegador&rdquo;</strong> (Chrome o Safari), o copia el enlace:
                <button onClick={handleCopyLink} className="mt-2 flex items-center gap-1.5 text-blue-700 font-semibold hover:underline">
                  <Copy size={12} /> Copiar enlace de esta página
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {/* Google */}
            <button
              onClick={handleGoogle}
              disabled={loadingGoogle || loadingEmail}
              title={inAppBrowser ? 'Abre este enlace en Chrome o Safari para usar Google' : undefined}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-lg text-sm font-semibold text-dark bg-white hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingGoogle ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-navy rounded-full animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              {loadingGoogle ? 'Conectando...' : 'Continuar con Google'}
            </button>

            {/* Microsoft — deshabilitado hasta tener Azure AD configurado.
                 Las funciones handleMicrosoft / loginWithMicrosoft se mantienen
                 para no romper imports; el botón está oculto. */}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">o</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Email + password form */}
          <form onSubmit={handleEmail} className="space-y-3">
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loadingEmail}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg text-sm text-dark placeholder-gray-400 focus:outline-none focus:border-royal disabled:opacity-50"
              />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loadingEmail}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg text-sm text-dark placeholder-gray-400 focus:outline-none focus:border-royal disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={loadingGoogle || loadingEmail}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-navy hover:bg-navy/90 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingEmail && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {loadingEmail ? 'Conectando...' : 'Iniciar sesión con correo'}
            </button>
          </form>

          {/* Info box */}
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
            <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-700 leading-relaxed">
              <strong>¿Primera vez?</strong> Tu cuenta quedará en estado{' '}
              <em>pendiente</em> hasta que un administrador te asigne un rol.
              Comunícate con la directiva para agilizar el proceso.
            </div>
          </div>

          {/* Roles info */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              { role: 'Administrador', color: 'bg-red-50 text-red-700 border-red-200' },
              { role: 'Director Musical', color: 'bg-purple-50 text-purple-700 border-purple-200' },
              { role: 'Integrante', color: 'bg-blue-50 text-blue-700 border-blue-200' },
              { role: 'Junta Directiva', color: 'bg-amber-50 text-amber-700 border-amber-200' },
            ].map(({ role, color }) => (
              <div key={role} className={`text-center py-1.5 px-2 rounded border text-xs font-medium ${color}`}>
                {role}
              </div>
            ))}
          </div>
        </div>

        {/* Back to site */}
        <p className="text-center mt-6 text-gray-400 text-sm">
          <Link href="/" className="hover:text-gold transition-colors">
            ← Volver al sitio público
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
