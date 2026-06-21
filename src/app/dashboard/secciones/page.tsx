'use client'

import { useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Music2, Phone, Users2, ChevronRight, X } from 'lucide-react'
import { getRosterSeccion, type IntegranteBase } from '@/lib/firebase'
import { SECCIONES_POR_FAMILIA, getSeccion, seccionImage } from '@/lib/secciones'
import MiFichaIntegrante from '@/components/dashboard/MiFichaIntegrante'
import CumpleanosBanda from '@/components/dashboard/CumpleanosBanda'

export default function SeccionesPage() {
  const [openSeccion, setOpenSeccion] = useState<string | null>(null)
  const [roster,      setRoster]      = useState<IntegranteBase[]>([])
  const [rosterLoad,  setRosterLoad]  = useState(false)

  const openRoster = async (seccionKey: string) => {
    setOpenSeccion(seccionKey)
    setRosterLoad(true)
    try {
      setRoster(await getRosterSeccion(seccionKey))
    } catch {
      toast.error('No se pudo cargar el roster')
      setRoster([])
    } finally {
      setRosterLoad(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-navy text-2xl font-bold uppercase tracking-wider flex items-center gap-2">
          <Music2 size={22} className="text-royal" /> Secciones
        </h1>
        <p className="text-gray-400 text-sm mt-1">Explora las secciones de la banda y mantén tu información al día</p>
      </div>

      {/* ── Cumpleaños del mes ───────────────────────────────────── */}
      <CumpleanosBanda />

      {/* ── Mi ficha (componente compartido) ─────────────────────── */}
      <div className="mb-8">
        <MiFichaIntegrante />
      </div>

      {/* ── Cuadrícula de secciones por familia ──────────────────── */}
      <div className="space-y-8">
        {SECCIONES_POR_FAMILIA.map(({ familia, secciones }) => (
          <div key={familia.key}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{familia.emoji}</span>
              <h2 className="font-serif font-bold text-navy text-lg">{familia.label}</h2>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {secciones.map(sec => (
                <button
                  key={sec.key}
                  onClick={() => openRoster(sec.key)}
                  className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-navy text-left focus:outline-none focus:ring-2 focus:ring-gold"
                >
                  <SeccionCover slug={sec.slug} emoji={familia.emoji} />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="font-display text-white text-sm font-bold uppercase tracking-wide leading-tight">{sec.label}</p>
                    <p className="text-gold text-[11px] flex items-center gap-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      Ver integrantes <ChevronRight size={11} />
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Modal roster de sección ──────────────────────────────── */}
      {openSeccion && (
        <RosterModal
          seccionKey={openSeccion}
          roster={roster}
          loading={rosterLoad}
          onClose={() => setOpenSeccion(null)}
        />
      )}
    </div>
  )
}

function RosterModal({ seccionKey, roster, loading, onClose }: {
  seccionKey: string; roster: IntegranteBase[]; loading: boolean; onClose: () => void
}) {
  const sec = getSeccion(seccionKey)
  return (
    <div className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="relative h-32 bg-navy shrink-0">
          <Image src={seccionImage(sec?.slug ?? '')} alt={sec?.label ?? ''} fill className="object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy to-transparent" />
          <button onClick={onClose} className="absolute top-3 right-3 text-white/80 hover:text-white bg-white/10 rounded-full p-1.5"><X size={18} /></button>
          <div className="absolute bottom-3 left-4">
            <p className="font-display text-white text-xl font-bold uppercase tracking-wide">{sec?.label ?? seccionKey}</p>
            <p className="text-gold text-xs flex items-center gap-1"><Users2 size={12} /> {roster.length} integrante(s)</p>
          </div>
        </div>
        <div className="p-4 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-royal/30 border-t-royal rounded-full animate-spin" /></div>
          ) : roster.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">Aún no hay integrantes registrados en esta sección.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {roster.map(m => (
                <li key={m.id} className="flex items-center gap-3 py-2.5">
                  <div className="w-9 h-9 rounded-full bg-royal/10 flex items-center justify-center text-royal text-sm font-bold shrink-0">
                    {(m.nombre[0] ?? '?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark truncate">{m.nombre} {m.apellidos}</p>
                    {m.whatsapp && (
                      <a href={`https://wa.me/57${m.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-royal hover:underline flex items-center gap-1">
                        <Phone size={10} /> {m.whatsapp}
                      </a>
                    )}
                  </div>
                  {m.linkedUid && <span className="text-[10px] bg-green-100 text-green-700 rounded-full px-2 py-0.5 font-medium">con cuenta</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

/** Portada de sección: muestra la foto si existe, si no un degradado + emoji. */
function SeccionCover({ slug, emoji }: { slug: string; emoji: string }) {
  const [ok, setOk] = useState(true)
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-br from-royal/60 to-navy flex items-center justify-center">
        <span className="text-4xl opacity-40 group-hover:scale-110 transition-transform">{emoji}</span>
      </div>
      {ok && (
        <Image
          src={seccionImage(slug)}
          alt=""
          fill
          onError={() => setOk(false)}
          className="object-cover opacity-70 group-hover:opacity-85 group-hover:scale-105 transition-all duration-500"
          sizes="(max-width: 640px) 50vw, 25vw"
        />
      )}
    </>
  )
}
