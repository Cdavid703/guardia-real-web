'use client'

import Image from 'next/image'
import { X, Printer, Droplet, Shield, IdCard } from 'lucide-react'
import { getSeccion } from '@/lib/secciones'
import type { Integrante } from '@/types'

/** Carné digital del integrante — imprimible. */
export default function CarneIntegrante({ ficha, onClose }: { ficha: Integrante; onClose: () => void }) {
  const sec = getSeccion(ficha.seccion)

  return (
    <div className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-4 print:bg-white print:p-0" onClick={onClose}>
      {/* Regla de impresión: solo el carné se imprime */}
      <style>{`@media print {
        body * { visibility: hidden !important; }
        .carne-printable, .carne-printable * { visibility: visible !important; }
        .carne-printable { position: fixed; inset: 0; margin: auto; box-shadow: none !important; }
        .no-print { display: none !important; }
      }`}</style>

      <div className="w-full max-w-sm" onClick={e => e.stopPropagation()}>
        {/* Tarjeta */}
        <div className="carne-printable bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
          {/* Cabecera navy */}
          <div className="bg-navy relative px-5 pt-5 pb-4">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gold" />
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                <Image src="/images/escudo.png" alt="" width={30} height={30} className="object-contain" />
              </div>
              <div className="leading-tight">
                <p className="font-display text-white text-sm font-bold uppercase tracking-wider">Guardia Real</p>
                <p className="text-sky text-[10px] uppercase tracking-wider">de Antioquia</p>
              </div>
              <span className="ml-auto text-[9px] bg-gold text-navy font-bold uppercase tracking-wider rounded-full px-2 py-1">Integrante</span>
            </div>
          </div>

          {/* Cuerpo */}
          <div className="px-5 py-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 rounded-xl bg-royal/10 overflow-hidden flex items-center justify-center shrink-0 border-2 border-gold/40">
                {ficha.fotoURL
                  ? <Image src={ficha.fotoURL} alt="" width={80} height={80} className="w-20 h-20 object-cover" />
                  : <span className="font-display text-royal text-2xl font-bold">{(ficha.nombre[0] ?? '?').toUpperCase()}</span>}
              </div>
              <div className="min-w-0">
                <p className="font-serif font-bold text-navy text-lg leading-tight">{ficha.nombre} {ficha.apellidos}</p>
                <p className="text-royal text-sm font-medium">{sec?.label ?? ficha.seccion}</p>
                {ficha.numDoc && (
                  <p className="text-gray-400 text-xs mt-1 flex items-center gap-1">
                    <IdCard size={11} /> {ficha.tipoDoc} {ficha.numDoc}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Droplet size={14} className="text-red-500 shrink-0" />
                <div>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wide">Tipo de sangre</p>
                  <p className="text-dark text-sm font-semibold">{ficha.tipoSangre || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-royal shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] text-gray-400 uppercase tracking-wide">EPS</p>
                  <p className="text-dark text-sm font-semibold truncate">{ficha.eps || '—'}</p>
                </div>
              </div>
            </div>

            {ficha.contactoEmergencia && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-[9px] text-gray-400 uppercase tracking-wide">Contacto de emergencia</p>
                <p className="text-dark text-xs">{ficha.contactoEmergencia}</p>
              </div>
            )}
          </div>

          {/* Pie */}
          <div className="bg-gray-50 px-5 py-2 text-center">
            <p className="font-serif italic text-gold text-[11px]">&ldquo;Disciplina, progreso y honor&rdquo;</p>
          </div>
        </div>

        {/* Acciones */}
        <div className="no-print flex justify-center gap-3 mt-4">
          <button onClick={() => window.print()} className="btn btn-gold btn-md">
            <Printer size={16} /> Imprimir / Guardar
          </button>
          <button onClick={onClose} className="btn btn-ghost btn-md text-white hover:bg-white/10">
            <X size={16} /> Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
