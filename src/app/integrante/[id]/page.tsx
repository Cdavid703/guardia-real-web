import Image from 'next/image'
import Link from 'next/link'
import { getAdminDb } from '@/lib/firebase-admin'
import { getSeccion, instrumentoImage } from '@/lib/secciones'
import { BadgeCheck, ShieldAlert } from 'lucide-react'

export const dynamic = 'force-dynamic'

/** Página pública de verificación de un integrante (a la que apunta el QR del carné). */
export default async function IntegrantePublicoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let data: Record<string, unknown> | null = null
  try {
    const db = getAdminDb()
    const snap = await db.collection('integrantes').doc(String(id)).get()
    data = snap.exists ? (snap.data() as Record<string, unknown>) : null
  } catch { data = null }

  const activo = data ? (data.activo !== false) : false
  const nombre = data ? `${data.nombre ?? ''} ${data.apellidos ?? ''}`.trim() : ''
  const seccionKey = (data?.seccion as string) ?? ''
  const sec = getSeccion(seccionKey)
  const fotoURL = data?.fotoURL as string | undefined

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D1B3E] via-[#1B2E6E] to-[#0a2350] flex items-center justify-center px-4 py-10">
      <div className="max-w-sm w-full">
        {/* Escudo */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 border border-gold/30 mb-3">
            <Image src="/images/escudo.png" alt="Guardia Real de Antioquia" width={56} height={56} className="object-contain" />
          </div>
          <h1 className="font-display text-white text-lg font-bold uppercase tracking-widest">Guardia Real de Antioquia</h1>
          <p className="text-sky text-[11px] uppercase tracking-wider">Corporación Musical · Verificación de integrante</p>
        </div>

        {!data ? (
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3"><ShieldAlert size={26} className="text-red-600" /></div>
            <h2 className="font-serif font-bold text-navy text-lg">Carné no reconocido</h2>
            <p className="text-gray-500 text-sm mt-1">Este código no corresponde a un integrante registrado de la Guardia Real de Antioquia.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Sello de verificación */}
            <div className={`px-5 py-3 flex items-center gap-2 ${activo ? 'bg-green-600' : 'bg-gray-500'} text-white`}>
              <BadgeCheck size={20} />
              <div>
                <p className="text-sm font-bold uppercase tracking-wide">{activo ? 'Integrante oficial' : 'Integrante inactivo'}</p>
                <p className="text-[11px] opacity-90">{activo ? 'Verificado en el sistema de la banda' : 'Este integrante no está activo actualmente'}</p>
              </div>
            </div>

            <div className="p-6 flex flex-col items-center text-center">
              <div className="relative w-28 h-28 rounded-2xl overflow-hidden border-4 border-gold/50 bg-royal/10 flex items-center justify-center mb-4">
                {sec?.slug && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={instrumentoImage(sec.slug)} alt="" className="absolute inset-0 m-auto w-16 h-16 object-contain opacity-10" />
                )}
                {fotoURL
                  ? <Image src={fotoURL} alt={nombre} width={112} height={112} className="w-28 h-28 object-cover relative" />
                  : <span className="font-display text-royal text-4xl font-bold relative">{(nombre[0] ?? '?').toUpperCase()}</span>}
              </div>
              <h2 className="font-serif font-bold text-navy text-xl leading-tight">{nombre || 'Integrante'}</h2>
              {sec && (
                <div className="inline-flex items-center gap-1.5 mt-2 bg-royal/10 text-royal rounded-full px-3 py-1 text-sm font-semibold">
                  {sec.label}
                </div>
              )}
              <p className="text-gray-400 text-xs mt-4 max-w-[16rem]">
                Este carné acredita a la persona como integrante de la Corporación Musical Guardia Real de Antioquia.
              </p>
            </div>

            <div className="bg-gray-50 px-5 py-3 text-center border-t border-gray-100">
              <p className="font-serif italic text-gold text-xs">&ldquo;Disciplina, progreso y honor&rdquo;</p>
            </div>
          </div>
        )}

        <p className="text-center mt-5">
          <Link href="/" className="text-sky/80 hover:text-gold text-sm transition-colors">← Ir al sitio oficial</Link>
        </p>
      </div>
    </div>
  )
}
