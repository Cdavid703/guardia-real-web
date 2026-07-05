'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ShieldAlert, CheckCircle2, PenLine, FileDown, ShieldCheck } from 'lucide-react'
import { firmarAutorizacionMenor, getAutorizacionMenorFirma } from '@/lib/firebase'
import { descargarAutorizacionMenor } from '@/lib/constancia'
import { getSeccion } from '@/lib/secciones'
import { esMenorDeEdad } from '@/lib/integrantes-utils'
import SignaturePad from '@/components/dashboard/SignaturePad'
import type { Integrante } from '@/types'

function fechaLegible(iso?: string) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }) }
  catch { return iso }
}

const PARENTESCOS = ['Madre', 'Padre', 'Abuelo(a)', 'Tío(a)', 'Hermano(a) mayor', 'Tutor(a) legal', 'Otro']

/** Autorización del acudiente para integrantes menores de edad. Se oculta si no aplica. */
export default function AutorizacionMenor({ ficha, uid, onDone }: { ficha: Integrante; uid: string; onDone: () => void }) {
  const [abrir, setAbrir] = useState(false)
  const [nombre, setNombre] = useState('')
  const [parentesco, setParentesco] = useState('Madre')
  const [doc, setDoc] = useState('')
  const [tel, setTel] = useState('')
  const [firma, setFirma] = useState('')
  const [guardando, setGuardando] = useState(false)

  if (!esMenorDeEdad(ficha.fechaNacimiento)) return null

  const info = ficha.autorizacionMenor

  const descargar = async () => {
    const f = await getAutorizacionMenorFirma(ficha.id).catch(() => null)
    descargarAutorizacionMenor({
      menorNombre: `${ficha.nombre} ${ficha.apellidos}`.trim(),
      menorDoc: ficha.numDoc ? `${ficha.tipoDoc} ${ficha.numDoc}` : '',
      menorNacimiento: ficha.fechaNacimiento,
      seccion: getSeccion(ficha.seccion)?.label ?? ficha.seccion,
      acudienteNombre: info?.acudienteNombre ?? '',
      parentesco: info?.parentesco ?? '',
      acudienteDoc: info?.acudienteDoc ?? '',
      acudienteTel: info?.acudienteTel,
      firmaDataUrl: f, firmadaEn: info?.firmadaEn,
    })
  }

  const firmar = async () => {
    if (!nombre.trim() || !doc.trim()) { toast.error('Completa nombre y documento del acudiente'); return }
    if (!firma) { toast.error('Falta la firma del acudiente'); return }
    setGuardando(true)
    try {
      await firmarAutorizacionMenor(ficha.id, uid,
        { acudienteNombre: nombre.trim(), parentesco, acudienteDoc: doc.trim(), acudienteTel: tel.trim() }, firma)
      toast.success('Autorización firmada. ¡Gracias!')
      setAbrir(false); setFirma('')
      onDone()
    } catch { toast.error('No se pudo guardar la autorización') }
    finally { setGuardando(false) }
  }

  // Ya firmada
  if (info?.estado === 'firmada') {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-4 flex items-start gap-3">
        <CheckCircle2 size={22} className="text-green-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-green-800">Autorización de menor firmada ✅</p>
          <p className="text-sm text-green-700">
            Firmada por {info.acudienteNombre} ({info.parentesco}){info.firmadaEn ? ` el ${fechaLegible(info.firmadaEn)}` : ''}.
          </p>
          <button onClick={descargar} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 hover:text-green-900">
            <FileDown size={13} /> Descargar autorización (PDF)
          </button>
        </div>
      </div>
    )
  }

  // Pendiente
  return (
    <div className="rounded-2xl border-2 border-gold/50 bg-gold/5 overflow-hidden">
      <div className="bg-navy p-4 flex items-center gap-3">
        <ShieldAlert size={22} className="text-gold shrink-0" />
        <div>
          <p className="font-bold text-white">Autorización de menor de edad</p>
          <p className="text-gray-300 text-sm">Este integrante es menor de edad. Su acudiente debe autorizar y firmar su participación en la banda.</p>
        </div>
      </div>

      {!abrir ? (
        <div className="p-4">
          <button onClick={() => setAbrir(true)} className="btn btn-gold btn-md"><PenLine size={16} /> Firmar autorización</button>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          <div className="flex gap-2.5 items-start bg-white rounded-xl p-3 border border-gray-100">
            <ShieldCheck size={16} className="text-royal shrink-0 mt-0.5" />
            <p className="text-sm text-gray-600 leading-relaxed">
              Como acudiente de <strong>{ficha.nombre} {ficha.apellidos}</strong>, autorizo su participación en ensayos,
              presentaciones, desfiles, concursos y viajes de la Corporación Musical Guardia Real de Antioquia, así como
              el uso de su imagen con fines institucionales, conforme a la Ley 1581 de 2012.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-dark mb-1">Nombre del acudiente</label>
              <input className="input" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre y apellidos" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark mb-1">Parentesco</label>
              <select className="input" value={parentesco} onChange={e => setParentesco(e.target.value)}>
                {PARENTESCOS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark mb-1">Documento del acudiente</label>
              <input className="input" value={doc} onChange={e => setDoc(e.target.value)} placeholder="C.C. 1234567" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark mb-1">Teléfono <span className="font-normal text-gray-400">(opcional)</span></label>
              <input className="input" value={tel} onChange={e => setTel(e.target.value)} placeholder="3001234567" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark mb-1 flex items-center gap-1"><PenLine size={13} /> Firma del acudiente</label>
            <SignaturePad onChange={setFirma} />
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={firmar} disabled={guardando || !firma} className="btn btn-primary btn-md disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Firmar autorización'}
            </button>
            <button onClick={() => { setAbrir(false); setFirma('') }} className="btn btn-ghost btn-md">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  )
}
