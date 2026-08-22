'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { X, Printer, Download, Droplet, Shield, IdCard, Plane, Phone, User, BadgeCheck } from 'lucide-react'
import { getSeccion, instrumentoImage } from '@/lib/secciones'
import QrIntegrante from '@/components/dashboard/QrIntegrante'
import type { Integrante } from '@/types'

// Tamaño carné estándar CR80 (ISO/IEC 7810 ID-1): 54 × 85.6 mm (vertical).
const CARD_W = 353   // px  (54 mm)
const CARD_H = 560   // px  (85.6 mm)

// Teléfono con prefijo de Colombia (+57)
const telCo = (t?: string) => {
  const d = (t ?? '').replace(/\D/g, '').replace(/^57/, '')
  return d ? `+57 ${d}` : ''
}

// Número de carné legible, derivado del id del integrante
const carneNumero = (id?: string) =>
  `GRA-${(id ?? '').replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase().padStart(6, '0')}`

/** Carné digital del integrante — vertical, a medida real (CR80), imprimible y en PDF. */
export default function CarneIntegrante({ ficha, onClose }: { ficha: Integrante; onClose: () => void }) {
  const sec = getSeccion(ficha.seccion)
  const cardRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)
  const [instrOk, setInstrOk] = useState(true)
  const showInstr = !!(sec?.slug && instrOk)

  const descargarPDF = async () => {
    const node = cardRef.current
    if (!node) return
    setDownloading(true)
    try {
      const [{ toPng }, { jsPDF }] = await Promise.all([import('html-to-image'), import('jspdf')])
      const dataUrl = await toPng(node, { pixelRatio: 4, cacheBust: true, backgroundColor: '#ffffff' })
      const pdf = new jsPDF({ unit: 'mm', format: [54, 85.6], orientation: 'portrait' })
      pdf.addImage(dataUrl, 'PNG', 0, 0, 54, 85.6)
      const nombre = `${ficha.nombre}-${ficha.apellidos}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-')
      pdf.save(`carne-${nombre || 'integrante'}.pdf`)
    } catch {
      toast.error('No se pudo generar el PDF, intenta de nuevo')
    } finally {
      setDownloading(false)
    }
  }

  const Campo = ({ icon: Icon, label, value, color = 'text-royal' }: { icon: React.ElementType; label: string; value?: string; color?: string }) => (
    <div className="flex items-start gap-1.5 min-w-0">
      <Icon size={13} className={`${color} shrink-0 mt-0.5`} />
      <div className="min-w-0">
        <p className="text-[7px] text-gray-400 uppercase tracking-wide leading-none mb-0.5">{label}</p>
        <p className="text-dark text-[11px] font-semibold leading-tight truncate">{value || '—'}</p>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-4 print:bg-white print:p-0 overflow-auto" onClick={onClose}>
      <style>{`@media print {
        body * { visibility: hidden !important; }
        .carne-printable, .carne-printable * { visibility: visible !important; }
        .carne-printable { position: fixed; inset: 0; margin: auto; box-shadow: none !important; }
        .no-print { display: none !important; }
      }`}</style>

      <div className="w-full max-w-[380px]" onClick={e => e.stopPropagation()}>
        {/* Tarjeta vertical (CR80) */}
        <div ref={cardRef} className="carne-printable bg-white overflow-hidden shadow-2xl mx-auto flex flex-col"
          style={{ width: CARD_W, height: CARD_H, borderRadius: 18 }}>

          {/* Cabecera navy */}
          <div className="bg-navy relative px-4 pt-3 pb-2.5 shrink-0">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gold" />
            <div className="flex flex-col items-center text-center gap-1">
              <Image src="/images/escudo.png" alt="Escudo Guardia Real de Antioquia" width={52} height={52} className="object-contain drop-shadow" />
              <div className="leading-tight">
                <p className="font-display text-white text-[13px] font-bold uppercase tracking-wider">Guardia Real de Antioquia</p>
                <p className="text-sky text-[8px] uppercase tracking-[0.2em]">Corporación Musical</p>
              </div>
              <span className="text-[8px] bg-gold text-navy font-bold uppercase tracking-widest rounded-full px-3 py-0.5 mt-0.5">Carné de integrante</span>
            </div>
          </div>

          {/* Cuerpo */}
          <div className="flex-1 flex flex-col items-center px-5 pt-3 pb-2 min-h-0">
            {/* Foto centrada y grande + insignia del instrumento */}
            <div className="relative w-[148px] h-[176px] rounded-xl bg-royal/10 overflow-hidden border-2 border-gold/60 shadow-md flex items-center justify-center">
              {ficha.fotoURL
                ? <Image src={ficha.fotoURL} alt="" width={148} height={176} className="w-full h-full object-cover" />
                : <span className="font-display text-royal text-5xl font-bold">{(ficha.nombre[0] ?? '?').toUpperCase()}</span>}
              {showInstr && (
                <div className="absolute -bottom-1.5 -right-1.5 w-10 h-10 rounded-full bg-navy border-2 border-white overflow-hidden flex items-center justify-center">
                  <Image src={instrumentoImage(sec!.slug)} alt="" width={40} height={40} onError={() => setInstrOk(false)} className="w-full h-full object-cover scale-125" />
                </div>
              )}
            </div>

            {/* Nombre + sección */}
            <p className="font-serif font-bold text-navy text-[19px] leading-tight text-center mt-2.5">{ficha.nombre} {ficha.apellidos}</p>
            <span className="inline-flex items-center gap-1 bg-royal/10 text-royal text-[10px] font-semibold rounded-full px-2.5 py-0.5 mt-1">{sec?.label ?? ficha.seccion}</span>

            {/* Datos */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 w-full mt-3">
              <Campo icon={IdCard}  label="Documento"      value={ficha.numDoc ? `${ficha.tipoDoc} ${ficha.numDoc}`.trim() : ''} />
              {ficha.pasaporte && <Campo icon={Plane} label="Pasaporte" value={ficha.numeroPasaporte} />}
              <Campo icon={Droplet} label="Tipo de sangre" value={ficha.tipoSangre} color="text-red-500" />
              <Campo icon={Shield}  label="EPS"            value={ficha.eps} />
            </div>

            {/* Franja oficial: N.º de carné + vigencia */}
            <div className="flex items-center justify-between w-full bg-royal/5 border border-royal/10 rounded-md px-2.5 py-1.5 mt-3">
              <div className="flex items-center gap-1.5">
                <BadgeCheck size={12} className="text-royal shrink-0" />
                <p className="text-[8px] text-gray-500 uppercase tracking-wide leading-none">N.º <span className="text-dark font-bold">{carneNumero(ficha.id)}</span></p>
              </div>
              <p className="text-[8px] text-gray-500 uppercase tracking-wide leading-none">Vigencia <span className="text-dark font-bold">{new Date().getFullYear()}</span></p>
            </div>

            {/* Contacto de emergencia */}
            <div className="w-full mt-2.5 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1.5 mb-1">
                <User size={12} className="text-royal shrink-0" />
                <p className="text-[7px] text-gray-400 uppercase tracking-wide leading-none">Contacto de emergencia</p>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-dark text-[11px] font-semibold leading-tight truncate">{ficha.contactoEmergencia || '—'}</p>
                <p className="text-dark text-[11px] font-semibold leading-tight flex items-center gap-1 shrink-0">
                  <Phone size={12} className="text-green-600" />{telCo(ficha.contactoEmergenciaTel) || '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Pie navy: QR + lema + mascota */}
          <div className="bg-navy px-5 py-2.5 flex items-center justify-between shrink-0">
            <div className="flex flex-col items-center">
              <div className="bg-white p-1 rounded-md">
                <QrIntegrante ficha={ficha} size={66} />
              </div>
              <p className="text-sky/80 text-[6px] uppercase tracking-[0.2em] mt-0.5">Escanéame</p>
            </div>
            <div className="text-center px-1">
              <p className="font-serif italic text-gold text-[10px] leading-tight">&ldquo;Disciplina,<br />progreso y honor&rdquo;</p>
            </div>
            <Image src="/images/mascota.png" alt="Mascota Guardia Real de Antioquia" width={74} height={86} className="w-[74px] h-[86px] object-contain drop-shadow" />
          </div>
        </div>

        {/* Acciones */}
        <div className="no-print flex flex-wrap justify-center gap-2 mt-4">
          <button onClick={descargarPDF} disabled={downloading} className="btn btn-gold btn-md disabled:opacity-60">
            <Download size={16} /> {downloading ? 'Generando...' : 'Descargar PDF'}
          </button>
          <button onClick={() => window.print()} className="btn btn-ghost btn-md text-white hover:bg-white/10">
            <Printer size={16} /> Imprimir
          </button>
          <button onClick={onClose} className="btn btn-ghost btn-md text-white hover:bg-white/10">
            <X size={16} /> Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
