'use client'

import { QRCodeSVG } from 'qrcode.react'

/** QR que apunta al propio recibo digital: sirve para verificar su autenticidad. */
export default function ReciboQR({ url }: { url: string }) {
  return <QRCodeSVG value={url} size={64} level="M" bgColor="#ffffff" fgColor="#0a1a3f" marginSize={1} />
}
