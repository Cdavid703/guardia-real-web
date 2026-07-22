'use client'

import { Printer, Download } from 'lucide-react'

export default function PrintButton() {
  return (
    <>
      <button onClick={() => window.print()} className="btn btn-primary btn-md">
        <Printer size={16} /> Imprimir
      </button>
      <button onClick={() => window.print()} className="btn btn-ghost btn-md">
        <Download size={16} /> Guardar como PDF
      </button>
    </>
  )
}
