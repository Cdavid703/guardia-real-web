'use client'

import { useEffect, useRef } from 'react'

/**
 * Escáner de QR con la cámara (html5-qrcode). Llama onScan con el texto decodificado.
 * Se monta/desmonta con el contenedor; usa la cámara trasera en móvil.
 */
export default function QrScanner({ onScan, onError }: { onScan: (text: string) => void; onError?: (e: string) => void }) {
  const startedRef = useRef(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null)
  const onScanRef = useRef(onScan)
  onScanRef.current = onScan

  useEffect(() => {
    let cancelled = false
    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (cancelled) return
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner
      scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decoded: string) => onScanRef.current(decoded),
        () => { /* errores por frame: ignorar */ },
      ).then(() => { startedRef.current = true })
        .catch((e: unknown) => onError?.(String(e)))
    }).catch(e => onError?.(String(e)))

    return () => {
      cancelled = true
      const s = scannerRef.current
      if (s && startedRef.current) {
        s.stop().then(() => s.clear?.()).catch(() => {})
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div id="qr-reader" className="w-full overflow-hidden rounded-xl [&_video]:rounded-xl" />
}
