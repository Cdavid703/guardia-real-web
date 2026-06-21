'use client'

import { QRCodeSVG } from 'qrcode.react'
import type { Integrante } from '@/types'
import { getSeccion } from '@/lib/secciones'

/**
 * Código QR único del integrante. Codifica un texto verificable con su id
 * (único e inmutable), nombre y sección — sirve como credencial de identidad.
 */
export function qrValue(ficha: Integrante): string {
  const sec = getSeccion(ficha.seccion)?.label ?? ficha.seccion
  return [
    'GUARDIA REAL DE ANTIOQUIA',
    `Integrante: ${ficha.nombre} ${ficha.apellidos}`.trim(),
    `Sección: ${sec}`,
    `ID: ${ficha.id}`,
  ].join('\n')
}

export default function QrIntegrante({ ficha, size = 96 }: { ficha: Integrante; size?: number }) {
  return (
    <QRCodeSVG
      value={qrValue(ficha)}
      size={size}
      level="M"
      bgColor="#ffffff"
      fgColor="#0a1a3f"
      marginSize={2}
    />
  )
}
