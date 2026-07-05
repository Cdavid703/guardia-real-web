'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import { CheckCircle2, ClipboardCheck, LogIn, Calendar, MapPin } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getEnsayo, marcarMiAsistencia } from '@/lib/firebase'

export default function AutoAsistenciaPage({ params }: { params: Promise<{ ensayoId: string }> }) {
  const { ensayoId } = use(params)
  const { user, profile, loading } = useAuth()
  const [ensayo, setEnsayo] = useState<{ title: string; date: string; startTime?: string; location?: string } | null>(null)
  const [estado, setEstado] = useState<'idle' | 'guardando' | 'listo'>('idle')
  const [nombre, setNombre] = useState('')

  useEffect(() => { getEnsayo(ensayoId).then(setEnsayo).catch(() => setEnsayo(null)) }, [ensayoId])

  const marcar = async () => {
    if (!user) return
    setEstado('guardando')
    try {
      const { nombre, yaEstaba } = await marcarMiAsistencia(ensayoId, user.uid)
      setNombre(nombre)
      setEstado('listo')
      toast.success(yaEstaba ? 'Ya estabas registrado' : '¡Asistencia registrada!')
    } catch (e) {
      setEstado('idle')
      toast.error(e instanceof Error && e.message === 'sin-ficha'
        ? 'No encontramos tu ficha de integrante'
        : 'No se pudo registrar tu asistencia')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy to-[#0a2350] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
        <div className="bg-navy relative px-6 pt-6 pb-5 text-center">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gold" />
          <Image src="/images/escudo.png" alt="" width={44} height={44} className="mx-auto mb-2" />
          <p className="font-display text-white text-sm font-bold uppercase tracking-wider">Guardia Real de Antioquia</p>
          <p className="text-gold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1 mt-1"><ClipboardCheck size={12} /> Asistencia a ensayo</p>
        </div>

        <div className="p-6">
          {/* Info del ensayo */}
          {ensayo && (
            <div className="text-center mb-5">
              <h1 className="font-serif font-bold text-navy text-lg">{ensayo.title || 'Ensayo'}</h1>
              <p className="text-gray-500 text-sm flex items-center justify-center gap-1 mt-1"><Calendar size={12} /> {ensayo.date}{ensayo.startTime ? ` · ${ensayo.startTime}` : ''}</p>
              {ensayo.location && <p className="text-gray-400 text-xs flex items-center justify-center gap-1 mt-0.5"><MapPin size={11} /> {ensayo.location}</p>}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-8"><div className="w-7 h-7 border-2 border-royal/30 border-t-royal rounded-full animate-spin" /></div>
          ) : !user ? (
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-4">Inicia sesión con tu cuenta de integrante para marcar tu asistencia.</p>
              <Link href={`/login?next=/asistencia/${ensayoId}`} className="btn btn-gold btn-lg w-full"><LogIn size={18} /> Iniciar sesión</Link>
            </div>
          ) : estado === 'listo' ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={34} className="text-green-600" />
              </div>
              <p className="font-serif font-bold text-navy text-lg">¡Listo, {nombre}!</p>
              <p className="text-gray-500 text-sm mt-1">Tu asistencia quedó registrada. Ya puedes cerrar esta página.</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-4">
                Hola <strong>{profile?.displayName || 'integrante'}</strong>, confirma tu asistencia a este ensayo.
              </p>
              <button onClick={marcar} disabled={estado === 'guardando'} className="btn btn-primary btn-lg w-full disabled:opacity-60">
                {estado === 'guardando' ? 'Registrando...' : <><CheckCircle2 size={18} /> Marcar mi asistencia</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
