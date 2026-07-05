'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Shirt, CheckCircle2, PenLine, ShieldCheck, XCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getMiIntegrante, confirmarPrendaFirmada, responderNoPrenda } from '@/lib/firebase'
import SignaturePad from '@/components/dashboard/SignaturePad'
import type { Integrante, PrendaKey } from '@/types'

interface PrendaTexto {
  prenda:      PrendaKey
  titulo:      string   // "Confirma tu chaqueta"
  pregunta:    string   // pregunta del banner
  siLabel:     string   // "Sí, tengo la chaqueta"
  aceptacion:  string   // texto legal
  confirmada:  string   // "tienes la chaqueta de la banda"
}

const TEXTOS: PrendaTexto[] = [
  {
    prenda: 'chaqueta',
    titulo: 'Confirma tu chaqueta',
    pregunta: 'La administración te pide confirmar si tienes la chaqueta azul con blanco de la banda.',
    siLabel: 'Sí, tengo la chaqueta',
    aceptacion:
      'Confirmo que tengo en mi poder la chaqueta oficial (azul con blanco) de la Corporación ' +
      'Musical Guardia Real de Antioquia, y me hago responsable de su cuidado, conservación y ' +
      'correcta devolución cuando la dirección lo solicite.',
    confirmada: 'tienes la chaqueta de la banda',
  },
  {
    prenda: 'kepis',
    titulo: 'Confirma tu kepis',
    pregunta: 'La administración te pide confirmar si tienes el kepis de la banda.',
    siLabel: 'Sí, tengo el kepis',
    aceptacion:
      'Confirmo que tengo en mi poder el kepis oficial de la Corporación Musical Guardia Real de ' +
      'Antioquia, y me hago responsable de su cuidado, conservación y correcta devolución cuando ' +
      'la dirección lo solicite.',
    confirmada: 'tienes el kepis de la banda',
  },
]

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

  const load = useCallback(async () => {
    if (!profile) return
    setCargando(true)
    try { setMi(await getMiIntegrante(profile.uid)) }
    catch { /* si no hay ficha, no se muestra nada */ }
    finally { setCargando(false) }
  }, [profile])

  useEffect(() => { load() }, [load])

  if (cargando || !mi) return null

  return (
    <div className="mb-6 space-y-4">
      {TEXTOS.map(t => (
        <PrendaConfirm key={t.prenda} texto={t} mi={mi} uid={profile!.uid} onDone={load} />
      ))}
    </div>
  )
}

function PrendaConfirm({ texto, mi, uid, onDone }: { texto: PrendaTexto; mi: Integrante; uid: string; onDone: () => void }) {
  const info = mi[texto.prenda]
  const [abrir, setAbrir] = useState(false)
  const [firma, setFirma] = useState('')
  const [nombre, setNombre] = useState(`${mi.nombre} ${mi.apellidos}`.trim())
  const [talla, setTalla] = useState(info?.talla ?? '')
  const [guardando, setGuardando] = useState(false)

  const confirmar = async () => {
    if (!nombre.trim()) { toast.error('Escribe tu nombre'); return }
    if (!talla.trim()) { toast.error('Indica tu talla'); return }
    if (!firma) { toast.error('Falta tu firma'); return }
    setGuardando(true)
    try {
      await confirmarPrendaFirmada(mi.id, texto.prenda, uid, firma, nombre.trim(), talla.trim())
      toast.success('¡Gracias! Tu confirmación quedó firmada.')
      setAbrir(false); setFirma('')
      onDone()
    } catch { toast.error('No se pudo guardar tu confirmación') }
    finally { setGuardando(false) }
  }

  const responderNo = async () => {
    setGuardando(true)
    try {
      await responderNoPrenda(mi.id, texto.prenda, uid)
      toast.success('Registramos que no la tienes. ¡Gracias por responder!')
      onDone()
    } catch { toast.error('No se pudo guardar tu respuesta') }
    finally { setGuardando(false) }
  }

  // Ya confirmada → tarjeta verde
  if (info?.estado === 'confirmada') {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-4 flex items-start gap-3">
        <CheckCircle2 size={22} className="text-green-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-green-800">Confirmado ✅</p>
          <p className="text-sm text-green-700">
            Confirmaste que {texto.confirmada}{info.confirmadaEn ? ` el ${fechaLegible(info.confirmadaEn)}` : ''}.
          </p>
        </div>
      </div>
    )
  }

  // Solicitud pendiente → banner de acción
  if (info?.estado !== 'solicitada') return null

  return (
    <div className="rounded-2xl border-2 border-gold/50 bg-gold/5 overflow-hidden">
      <div className="bg-navy p-4 flex items-center gap-3">
        <Shirt size={22} className="text-gold shrink-0" />
        <div>
          <p className="font-bold text-white">{texto.titulo}</p>
          <p className="text-gray-300 text-sm">{texto.pregunta}</p>
        </div>
      </div>

      {!abrir ? (
        <div className="p-4 flex flex-wrap gap-3 items-center">
          <button onClick={() => setAbrir(true)} className="btn btn-gold btn-md">
            <CheckCircle2 size={17} /> {texto.siLabel}
          </button>
          <button onClick={responderNo} disabled={guardando} className="btn btn-ghost btn-md text-gray-600">
            <XCircle size={16} /> No la tengo
          </button>
          {info.solicitadaPorNombre && (
            <span className="text-xs text-gray-400">
              Solicitado por {info.solicitadaPorNombre}{info.solicitadaEn ? ` · ${fechaLegible(info.solicitadaEn)}` : ''}
            </span>
          )}
        </div>
      ) : (
        <div className="p-4 space-y-4">
          <div className="flex gap-2.5 items-start bg-white rounded-xl p-3 border border-gray-100">
            <ShieldCheck size={16} className="text-royal shrink-0 mt-0.5" />
            <p className="text-sm text-gray-600 leading-relaxed">{texto.aceptacion}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-dark mb-1">Tu nombre completo</label>
              <input className="input" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre y apellidos" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark mb-1">Tu talla</label>
              <input className="input" list={`tallas-${texto.prenda}`} value={talla} onChange={e => setTalla(e.target.value)} placeholder="Ej: M, L, 12, 34..." />
              <datalist id={`tallas-${texto.prenda}`}>
                {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map(t => <option key={t} value={t} />)}
              </datalist>
            </div>
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
