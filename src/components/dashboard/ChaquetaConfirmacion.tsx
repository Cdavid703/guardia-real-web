'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Shirt, CheckCircle2, PenLine, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getMiIntegrante, confirmarChaquetaFirmada } from '@/lib/firebase'
import SignaturePad from '@/components/dashboard/SignaturePad'
import type { Integrante } from '@/types'

const TEXTO_ACEPTACION =
  'Confirmo que tengo en mi poder la chaqueta oficial (azul con blanco) de la Corporación ' +
  'Musical Guardia Real de Antioquia, y me hago responsable de su cuidado, conservación y ' +
  'correcta devolución cuando la dirección lo solicite.'

/** Fecha/hora legible en español a partir de un ISO. */
function fechaLegible(iso?: string) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('es-CO', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  } catch { return iso }
}

export default function ChaquetaConfirmacion() {
  const { profile } = useAuth()
  const [mi, setMi] = useState<Integrante | null>(null)
  const [cargando, setCargando] = useState(true)
  const [abrir, setAbrir] = useState(false)
  const [firma, setFirma] = useState('')
  const [nombre, setNombre] = useState('')
  const [guardando, setGuardando] = useState(false)

  const load = useCallback(async () => {
    if (!profile) return
    setCargando(true)
    try {
      const f = await getMiIntegrante(profile.uid)
      setMi(f)
      if (f) setNombre(`${f.nombre} ${f.apellidos}`.trim())
    } catch { /* silencioso: si no hay ficha, no se muestra nada */ }
    finally { setCargando(false) }
  }, [profile])

  useEffect(() => { load() }, [load])

  const confirmar = async () => {
    if (!mi) return
    if (!nombre.trim()) { toast.error('Escribe tu nombre'); return }
    if (!firma) { toast.error('Falta tu firma'); return }
    setGuardando(true)
    try {
      await confirmarChaquetaFirmada(mi.id, profile!.uid, firma, nombre.trim())
      toast.success('¡Gracias! Tu chaqueta quedó confirmada y firmada.')
      setAbrir(false); setFirma('')
      load()
    } catch { toast.error('No se pudo guardar tu confirmación') }
    finally { setGuardando(false) }
  }

  if (cargando || !mi) return null
  const ch = mi.chaqueta

  // Ya confirmada → tarjeta verde
  if (ch?.estado === 'confirmada') {
    return (
      <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4 flex items-start gap-3">
        <CheckCircle2 size={22} className="text-green-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-green-800">Chaqueta confirmada ✅</p>
          <p className="text-sm text-green-700">
            Confirmaste que tienes la chaqueta de la banda{ch.confirmadaEn ? ` el ${fechaLegible(ch.confirmadaEn)}` : ''}.
          </p>
        </div>
      </div>
    )
  }

  // Solicitud pendiente → banner de acción
  if (ch?.estado === 'solicitada') {
    return (
      <div className="mb-6 rounded-2xl border-2 border-gold/50 bg-gold/5 overflow-hidden">
        <div className="bg-navy p-4 flex items-center gap-3">
          <Shirt size={22} className="text-gold shrink-0" />
          <div>
            <p className="font-bold text-white">Confirma tu chaqueta</p>
            <p className="text-gray-300 text-sm">La administración te pide confirmar si tienes la chaqueta azul con blanco de la banda.</p>
          </div>
        </div>

        {!abrir ? (
          <div className="p-4 flex flex-wrap gap-3">
            <button onClick={() => setAbrir(true)} className="btn btn-gold btn-md">
              <CheckCircle2 size={17} /> Sí, tengo la chaqueta
            </button>
            {ch.solicitadaPorNombre && (
              <span className="text-xs text-gray-400 self-center">
                Solicitado por {ch.solicitadaPorNombre}{ch.solicitadaEn ? ` · ${fechaLegible(ch.solicitadaEn)}` : ''}
              </span>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div className="flex gap-2.5 items-start bg-white rounded-xl p-3 border border-gray-100">
              <ShieldCheck size={16} className="text-royal shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600 leading-relaxed">{TEXTO_ACEPTACION}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark mb-1">Tu nombre completo</label>
              <input className="input" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre y apellidos" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark mb-1 flex items-center gap-1">
                <PenLine size={13} /> Firma
              </label>
              <SignaturePad onChange={setFirma} />
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={confirmar} disabled={guardando || !firma || !nombre.trim()}
                className="btn btn-primary btn-md disabled:opacity-50">
                {guardando ? 'Guardando...' : 'Confirmar y firmar'}
              </button>
              <button onClick={() => { setAbrir(false); setFirma('') }} className="btn btn-ghost btn-md">Cancelar</button>
            </div>
            <p className="text-[11px] text-gray-400">
              Al confirmar se registrará tu firma junto con la fecha y hora, para constancia de la administración.
            </p>
          </div>
        )}
      </div>
    )
  }

  return null
}
