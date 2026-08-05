'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Wallet, Receipt, Clock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getMiIntegrante, getMisPagos } from '@/lib/firebase'
import type { Pago } from '@/types'

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const fmtCOP = (n?: number) => n != null ? `$${n.toLocaleString('es-CO')}` : ''
function periodoLabel(p?: string) { if (!p) return ''; const [y, m] = p.split('-'); const mes = MESES[Number(m) - 1] ?? ''; return `${mes.charAt(0).toUpperCase()}${mes.slice(1)} ${y}` }

export default function StaffPage() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [pagos, setPagos] = useState<Pago[]>([])
  const [nombre, setNombre] = useState('')
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!loading && profile && profile.role !== 'staff' && profile.role !== 'admin') router.replace('/dashboard')
  }, [profile, loading, router])

  useEffect(() => {
    if (!profile) return
    ;(async () => {
      try {
        const ficha = await getMiIntegrante(profile.uid)
        if (ficha) { setNombre(`${ficha.nombre} ${ficha.apellidos}`.trim()); setPagos(await getMisPagos(ficha.id)) }
      } catch { /* noop */ }
      finally { setCargando(false) }
    })()
  }, [profile])

  const total = pagos.reduce((s, p) => s + (p.monto ?? 0), 0)

  return (
    <div>
      {/* Encabezado */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy to-[#0a2350] p-6 sm:p-7 mb-6">
        <div className="absolute -right-6 -bottom-6 opacity-10"><Image src="/images/escudo.png" alt="" width={150} height={150} /></div>
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-gold/15 border border-gold/30 text-gold text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
            <Wallet size={12} /> Staff
          </div>
          <h1 className="font-display text-white text-2xl font-bold uppercase tracking-wider">Mis pagos</h1>
          <p className="text-gray-300 text-sm mt-1 max-w-lg">{nombre ? `Hola ${nombre.split(' ')[0]}, ` : ''}aquí ves tus pagos y aportes a la Guardia Real de Antioquia (giras y demás).</p>
        </div>
      </div>

      {cargando ? (
        <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-royal/30 border-t-royal rounded-full animate-spin" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-5 max-w-md">
            <div className="bg-white border border-gray-100 rounded-xl p-4"><Receipt size={18} className="mb-1 text-royal" /><div className="font-display text-2xl font-bold text-royal">{pagos.length}</div><div className="text-xs text-gray-400">Pagos registrados</div></div>
            <div className="bg-white border border-gray-100 rounded-xl p-4"><Wallet size={18} className="mb-1 text-navy" /><div className="font-display text-2xl font-bold text-navy">{fmtCOP(total) || '$0'}</div><div className="text-xs text-gray-400">Total aportado</div></div>
          </div>

          {pagos.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 text-center py-12 text-gray-400 text-sm flex flex-col items-center gap-2">
              <Clock size={28} className="opacity-30" />
              Aún no tienes pagos registrados.
            </div>
          ) : (
            <div className="space-y-1.5">
              {pagos.map(p => (
                <div key={p.id} className="flex items-center gap-3 border border-gray-100 bg-white rounded-xl p-3">
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0"><Receipt size={16} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-dark truncate">{p.concepto} · {periodoLabel(p.periodo)}</p>
                    <p className="text-xs text-gray-400 truncate">{p.fecha ?? ''}{p.reciboNumero ? ` · Recibo ${p.reciboNumero}` : ''}</p>
                  </div>
                  <span className="font-semibold text-navy shrink-0">{fmtCOP(p.monto)}</span>
                  {p.token && (
                    <a href={`/recibo/${p.id}?t=${p.token}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm text-royal shrink-0"><Receipt size={13} /> Recibo</a>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
