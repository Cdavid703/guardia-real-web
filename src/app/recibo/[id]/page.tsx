import Image from 'next/image'
import { getAdminDb } from '@/lib/firebase-admin'
import { getSeccion, instrumentoImage } from '@/lib/secciones'
import PrintButton from './PrintButton'

export const dynamic = 'force-dynamic'

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
function periodoLabel(p?: string) {
  if (!p) return '—'
  const [y, m] = p.split('-')
  const mes = MESES[Number(m) - 1] ?? ''
  return `${mes.charAt(0).toUpperCase()}${mes.slice(1)} ${y}`
}
const fmtCOP = (n?: number | null) => n != null ? `$${Number(n).toLocaleString('es-CO')} COP` : '—'

export default async function ReciboPage({ params, searchParams }: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ t?: string }>
}) {
  const { id } = await params
  const { t } = await searchParams

  let data: Record<string, unknown> | null = null
  let integrante: Record<string, unknown> | null = null
  let recaudador: Record<string, unknown> | null = null
  try {
    const db = getAdminDb()
    const snap = await db.collection('pagos').doc(id).get()
    if (snap.exists) {
      const d = snap.data() as Record<string, unknown>
      if (d.token && d.token === t) {
        data = d
        if (d.integranteId) {
          const i = await db.collection('integrantes').doc(String(d.integranteId)).get()
          integrante = i.exists ? (i.data() as Record<string, unknown>) : null
        }
        if (d.registradoPor) {
          const u = await db.collection('users').doc(String(d.registradoPor)).get()
          recaudador = u.exists ? (u.data() as Record<string, unknown>) : null
        }
      }
    }
  } catch { /* sin datos */ }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-6 text-center">
        <div>
          <Image src="/images/escudo.png" alt="" width={64} height={64} className="mx-auto mb-4 opacity-60" />
          <p className="text-gray-500">Este recibo no existe o el enlace no es válido.</p>
        </div>
      </div>
    )
  }

  const sec = getSeccion((integrante?.seccion as string) ?? '')
  const pagadoEn = data.pagadoEn ? new Date(String(data.pagadoEn)) : null
  const fechaTxt = pagadoEn
    ? pagadoEn.toLocaleDateString('es-CO', { timeZone: 'America/Bogota', day: '2-digit', month: 'long', year: 'numeric' })
    : String(data.fecha ?? '—')
  const horaTxt = pagadoEn
    ? pagadoEn.toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit' })
    : ''
  const nombreIntegrante = (data.integranteNombre as string)
    || `${(integrante?.nombre as string) ?? ''} ${(integrante?.apellidos as string) ?? ''}`.trim() || '—'
  const firma = (recaudador?.firmaRecibo as string) ?? null
  const nombreRecaudador = (recaudador?.displayName as string) ?? 'Recaudador'

  return (
    <div className="min-h-screen bg-[#F5F7FA] py-8 px-4 print:bg-white print:py-0">
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
      <div className="max-w-md mx-auto">
        {/* Recibo */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-200 print:shadow-none print:border-gray-300">
          {/* Cabecera */}
          <div className="bg-gradient-to-br from-[#1B2E6E] via-[#1B2E6E] to-[#0a2350] relative px-6 pt-6 pb-5">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#F2C100]" />
            <div className="absolute right-3 bottom-2 opacity-90">
              <Image src="/images/mascota.png" alt="Mascota Guardia Real" width={64} height={64} className="object-contain drop-shadow-lg" />
            </div>
            <div className="flex items-center gap-3 relative">
              <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                <Image src="/images/escudo.png" alt="Escudo Guardia Real" width={42} height={42} className="object-contain" />
              </div>
              <div className="leading-tight">
                <p className="font-display text-white text-sm font-bold uppercase tracking-wider">Corporación Musical</p>
                <p className="font-display text-[#F2C100] text-base font-bold uppercase tracking-wider">Guardia Real de Antioquia</p>
                <p className="text-sky text-[10px] tracking-wider mt-0.5">Cra. 48 A #73–36, Campo Valdés · Medellín</p>
              </div>
            </div>
            <div className="relative mt-4 flex items-end justify-between">
              <div>
                <p className="text-[10px] text-gray-300 uppercase tracking-widest">Recibo de pago</p>
                <p className="font-display text-white text-xl font-bold tracking-wider">{String(data.reciboNumero ?? id)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-300 uppercase tracking-widest">Fecha y hora</p>
                <p className="text-white text-sm font-semibold">{fechaTxt}</p>
                {horaTxt && <p className="text-[#F2C100] text-xs">{horaTxt}</p>}
              </div>
            </div>
          </div>

          {/* Cuerpo */}
          <div className="px-6 py-5">
            {/* Integrante + instrumento */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Recibido de</p>
                <p className="font-serif font-bold text-[#1B2E6E] text-lg leading-tight">{nombreIntegrante}</p>
                {sec && <p className="text-xs text-gray-500 mt-0.5">{sec.label}</p>}
              </div>
              {sec && (
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#0a1a3f] shrink-0 border-2 border-[#F2C100]/50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={instrumentoImage(sec.slug)} alt={sec.label} className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Detalle */}
            <div className="py-4 space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-gray-400">Concepto</span>
                <span className="text-[#1B2E6E] font-semibold text-right">{String(data.concepto ?? 'Mensualidad')}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-400">Periodo</span>
                <span className="text-[#1B2E6E] font-semibold">{periodoLabel(data.periodo as string)}</span>
              </div>
              {typeof data.metodo === 'string' && data.metodo && (
                <div className="flex justify-between gap-3">
                  <span className="text-gray-400">Método</span>
                  <span className="text-[#1B2E6E] font-semibold">{data.metodo}</span>
                </div>
              )}
            </div>

            {/* Monto */}
            <div className="bg-[#F2C100]/10 border border-[#F2C100]/40 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-bold text-[#8a6d00] uppercase tracking-widest">Valor recibido</span>
              <span className="font-display text-[#1B2E6E] text-2xl font-bold">{fmtCOP(data.monto as number | null)}</span>
            </div>

            {/* Firma */}
            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
              {firma ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={firma} alt="Firma" className="h-16 mx-auto object-contain" />
              ) : (
                <div className="h-10" />
              )}
              <div className="w-48 border-b border-gray-300 mx-auto" />
              <p className="text-[#1B2E6E] text-sm font-bold mt-1.5">Recibido: {nombreRecaudador}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">Recaudador oficial</p>
            </div>
          </div>

          {/* Pie */}
          <div className="bg-gray-50 px-6 py-2.5 text-center">
            <p className="font-serif italic text-[#c9a100] text-[11px]">&ldquo;Disciplina, progreso y honor&rdquo;</p>
            <p className="text-[9px] text-gray-400 mt-0.5">guardiarealdeantioquia.com · Recibo generado digitalmente</p>
          </div>
        </div>

        {/* Acciones */}
        <div className="no-print flex justify-center gap-3 mt-5">
          <PrintButton />
        </div>
      </div>
    </div>
  )
}
