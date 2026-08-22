'use client'

import { QRCodeSVG } from 'qrcode.react'
import type { Integrante } from '@/types'

/**
 * Código QR del integrante: enlaza a su página pública de verificación,
 * donde se confirma que es integrante oficial de la Guardia Real de Antioquia.
 */
export function qrValue(ficha: Integrante): string {
  return `https://www.guardiarealdeantioquia.com/integrante/${ficha.id}`
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
