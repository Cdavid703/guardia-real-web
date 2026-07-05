'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { Eraser } from 'lucide-react'

/**
 * Pad de firma con el dedo/mouse. Dibuja sobre un <canvas> y expone la firma
 * como PNG (dataURL) vía onChange. Devuelve cadena vacía cuando está en blanco.
 */
export default function SignaturePad({
  onChange,
  height = 200,
}: {
  onChange: (dataUrl: string) => void
  height?: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)
  const [vacio, setVacio] = useState(true)

  // Ajusta el canvas al ancho real del contenedor (con densidad de píxeles).
  const setup = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ratio = window.devicePixelRatio || 1
    const width = canvas.parentElement?.clientWidth ?? 320
    canvas.width = width * ratio
    canvas.height = height * ratio
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(ratio, ratio)
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#0a2350'
  }, [height])

  useEffect(() => {
    setup()
    window.addEventListener('resize', setup)
    return () => window.removeEventListener('resize', setup)
  }, [setup])

  const posFromEvent = (e: PointerEvent | React.PointerEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const start = (e: React.PointerEvent) => {
    e.preventDefault()
    canvasRef.current?.setPointerCapture(e.pointerId)
    drawing.current = true
    last.current = posFromEvent(e)
  }

  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return
    e.preventDefault()
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx || !last.current) return
    const p = posFromEvent(e)
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    last.current = p
    if (vacio) setVacio(false)
  }

  const end = () => {
    if (!drawing.current) return
    drawing.current = false
    last.current = null
    const canvas = canvasRef.current
    if (canvas) onChange(vacio ? '' : canvas.toDataURL('image/png'))
  }

  const limpiar = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    setVacio(true)
    onChange('')
  }

  return (
    <div>
      <div className="relative rounded-xl border-2 border-dashed border-navy/25 bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          className="touch-none block w-full cursor-crosshair"
        />
        {vacio && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-gray-300 text-sm select-none">Firma aquí con tu dedo ✍️</span>
          </div>
        )}
        {/* Línea base de firma */}
        <div className="absolute left-6 right-6 bottom-8 border-b border-gray-200 pointer-events-none" />
      </div>
      <div className="flex justify-end mt-2">
        <button type="button" onClick={limpiar} disabled={vacio}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-red-500 disabled:opacity-40">
          <Eraser size={13} /> Borrar
        </button>
      </div>
    </div>
  )
}
