'use client'

import { useEffect, useRef, useState } from 'react'
import { X, ZoomIn, Check } from 'lucide-react'

const FRAME = 260   // tamaño del marco en pantalla (px)
const OUT   = 512   // tamaño de la imagen final (px)

/** Recortador circular: el usuario mueve y hace zoom antes de subir la foto. */
export default function FotoCropper({ file, onCancel, onCropped }: {
  file: File
  onCancel: () => void
  onCropped: (blob: Blob) => void
}) {
  const [src,  setSrc]  = useState('')
  const [zoom, setZoom] = useState(1)
  const [off,  setOff]  = useState({ x: 0, y: 0 })
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const drag   = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const onImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    const nw = img.naturalWidth, nh = img.naturalHeight
    // tamaño base para que la imagen cubra el marco con zoom = 1
    const d = nw >= nh ? { h: FRAME, w: FRAME * nw / nh } : { w: FRAME, h: FRAME * nh / nw }
    setDims(d)
    setOff({ x: 0, y: 0 })
    setZoom(1)
  }

  const start = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX - off.x, y: e.clientY - off.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const move = (e: React.PointerEvent) => {
    if (!drag.current) return
    setOff({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y })
  }
  const end = () => { drag.current = null }

  const confirmar = () => {
    const img = imgRef.current
    if (!img || !dims) return
    const canvas = document.createElement('canvas')
    canvas.width = OUT; canvas.height = OUT
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, OUT, OUT)
    const ratio = OUT / FRAME
    ctx.save()
    ctx.translate(OUT / 2, OUT / 2)
    ctx.translate(off.x * ratio, off.y * ratio)
    ctx.scale(zoom, zoom)
    const w = dims.w * ratio, h = dims.h * ratio
    ctx.drawImage(img, -w / 2, -h / 2, w, h)
    ctx.restore()
    canvas.toBlob(b => { if (b) onCropped(b) }, 'image/jpeg', 0.9)
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-black/70 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-xs" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif font-bold text-navy text-base">Ajusta tu foto</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-navy"><X size={18} /></button>
        </div>

        {/* Marco circular */}
        <div
          className="relative mx-auto rounded-full overflow-hidden bg-gray-100 cursor-move touch-none select-none"
          style={{ width: FRAME, height: FRAME }}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
        >
          {src && dims && (
            <img
              ref={imgRef}
              src={src}
              alt=""
              onLoad={onImgLoad}
              draggable={false}
              style={{
                position: 'absolute', left: '50%', top: '50%',
                width: dims.w, height: dims.h, maxWidth: 'none',
                transform: `translate(-50%, -50%) translate(${off.x}px, ${off.y}px) scale(${zoom})`,
                transformOrigin: 'center',
              }}
            />
          )}
          {/* Imagen oculta para medir antes de tener dims */}
          {src && !dims && <img ref={imgRef} src={src} alt="" onLoad={onImgLoad} className="opacity-0" />}
          <div className="absolute inset-0 rounded-full ring-2 ring-white/70 pointer-events-none" />
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-2 mt-4">
          <ZoomIn size={16} className="text-gray-400 shrink-0" />
          <input type="range" min={1} max={3} step={0.01} value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            className="flex-1 accent-royal" />
        </div>
        <p className="text-[11px] text-gray-400 text-center mt-2">Arrastra para mover · desliza para acercar</p>

        <div className="flex gap-3 mt-4">
          <button onClick={confirmar} className="btn btn-primary btn-md flex-1 justify-center"><Check size={15} /> Usar foto</button>
          <button onClick={onCancel} className="btn btn-ghost btn-md">Cancelar</button>
        </div>
      </div>
    </div>
  )
}
