'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { X, Printer, Download, Droplet, Shield, IdCard, Plane, Phone, User } from 'lucide-react'
import { getSeccion, instrumentoImage } from '@/lib/secciones'
import QrIntegrante from '@/components/dashboard/QrIntegrante'
import type { Integrante } from '@/types'

// Tamaño carné estándar CR80 (ISO/IEC 7810 ID-1): 85.6 × 54 mm (horizontal).
const CARD_W = 560   // px  (85.6 mm)
const CARD_H = 353   // px  (54 mm)

// Teléfono con prefijo de Colombia (+57)
const telCo = (t?: string) => {
  const d = (t ?? '').replace(/\D/g, '').replace(/^57/, '')
  return d ? `+57 ${d}` : ''
}

/** Carné digital del integrante — horizontal, a medida real, imprimible y en PDF. */
export default function CarneIntegrante({ ficha, onClose }: { ficha: Integrante; onClose: () => void }) {
  const sec = getSeccion(ficha.seccion)
  const cardRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)
  const [instrOk, setInstrOk] = useState(true)

  const descargarPDF = async () => {
    const node = cardRef.current
    if (!node) return
    setDownloading(true)
    try {
      const [{ toPng }, { jsPDF }] = await Promise.all([import('html-to-image'), import('jspdf')])
      const dataUrl = await toPng(node, { pixelRatio: 4, cacheBust: true, backgroundColor: '#ffffff' })
      const pdf = new jsPDF({ unit: 'mm', format: [85.6, 54], orientation: 'landscape' })
      pdf.addImage(dataUrl, 'PNG', 0, 0, 85.6, 54)
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

      <div className="w-full max-w-[600px]" onClick={e => e.stopPropagation()}>
        {/* Tarjeta horizontal (CR80) */}
        <div ref={cardRef} className="carne-printable bg-white overflow-hidden shadow-2xl mx-auto flex flex-col"
          style={{ width: CARD_W, height: CARD_H, borderRadius: 16 }}>
          {/* Cabecera navy */}
          <div className="bg-navy relative px-4 py-2.5 shrink-0">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gold" />
            <div className="relative flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                <Image src="/images/escudo.png" alt="" width={26} height={26} className="object-contain" />
              </div>
              <div className="leading-tight">
                <p className="font-display text-white text-[13px] font-bold uppercase tracking-wider">Guardia Real de Antioquia</p>
                <p className="text-sky text-[9px] uppercase tracking-wider">Corporación Musical · Carné de integrante</p>
              </div>
              <span className="ml-auto text-[9px] bg-gold text-navy font-bold uppercase tracking-wider rounded-full px-2.5 py-1 shrink-0">Integrante</span>
            </div>
          </div>

          {/* Cuerpo */}
          <div className="relative flex-1 flex px-4 py-2.5 gap-3 overflow-hidden">
            {/* Instrumento de fondo (marca de agua visible, llena el espacio) */}
            {sec?.slug && instrOk && (
              <Image src={instrumentoImage(sec.slug)} alt="" width={220} height={220} onError={() => setInstrOk(false)}
                className="absolute right-2 bottom-0 w-44 h-44 object-contain opacity-[0.10] pointer-events-none z-0" />
            )}

            {/* Foto + sección */}
            <div className="relative z-10 shrink-0 w-[96px] flex flex-col items-center justify-center">
              <div className="relative w-[96px] h-[116px] rounded-lg bg-royal/10 overflow-hidden flex items-center justify-center border-2 border-gold/50">
                {ficha.fotoURL
                  ? <Image src={ficha.fotoURL} alt="" width={96} height={116} className="w-[96px] h-[116px] object-cover" />
                  : <span className="font-display text-royal text-3xl font-bold">{(ficha.nombre[0] ?? '?').toUpperCase()}</span>}
              </div>
              <p className="text-royal text-[10px] font-semibold text-center mt-1 leading-tight">{sec?.label ?? ficha.seccion}</p>
            </div>

            {/* Datos (distribuidos verticalmente) */}
            <div className="relative z-10 flex-1 min-w-0 flex flex-col justify-center">
              <p className="font-serif font-bold text-navy text-[16px] leading-tight mb-2">{ficha.nombre} {ficha.apellidos}</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                <Campo icon={IdCard}  label="Documento"      value={ficha.numDoc ? `${ficha.tipoDoc} ${ficha.numDoc}`.trim() : ''} />
                {ficha.pasaporte && <Campo icon={Plane} label="Pasaporte" value={ficha.numeroPasaporte} />}
                <Campo icon={Droplet} label="Tipo de sangre" value={ficha.tipoSangre} color="text-red-500" />
                <Campo icon={Shield}  label="EPS"            value={ficha.eps} />
              </div>
              {/* Contacto de emergencia — fila completa, sin cortar */}
              <div className="flex items-start gap-4 mt-2.5 pt-2 border-t border-gray-100">
                <div className="flex items-start gap-1.5 min-w-0 flex-1">
                  <User size={13} className="text-royal shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[7px] text-gray-400 uppercase tracking-wide leading-none mb-0.5">Contacto de emergencia</p>
                    <p className="text-dark text-[11px] font-semibold leading-tight">{ficha.contactoEmergencia || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-1.5 shrink-0">
                  <Phone size={13} className="text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[7px] text-gray-400 uppercase tracking-wide leading-none mb-0.5">Teléfono</p>
                    <p className="text-dark text-[11px] font-semibold leading-tight">{telCo(ficha.contactoEmergenciaTel) || '—'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* QR */}
            <div className="relative z-10 shrink-0 flex flex-col items-center justify-center">
              <QrIntegrante ficha={ficha} size={84} />
              <p className="text-[7px] text-gray-400 uppercase tracking-wide mt-0.5">Escanéame</p>
            </div>
          </div>

          {/* Pie */}
          <div className="bg-gray-50 px-4 py-1 text-center border-t border-gray-100 shrink-0">
            <p className="font-serif italic text-gold text-[10px]">&ldquo;Disciplina, progreso y honor&rdquo;</p>
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
