'use client'

import { useEffect, useState } from 'react'
import { Heart, Inbox, CheckCircle2, XCircle, ChevronDown, ChevronUp, FileText, DollarSign } from 'lucide-react'
import { getAllDonations, updateDonationStatus } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { cn, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import type { Donation } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  recibida:   'bg-blue-100 text-blue-700',
  verificada: 'bg-green-100 text-green-700',
  rechazada:  'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<string, string> = {
  recibida:   'Recibida',
  verificada: 'Verificada',
  rechazada:  'Rechazada',
}

export default function AdminDonacionesPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [donations, setDonations] = useState<(Donation & { id: string })[]>([])
  const [loading,   setLoading]   = useState(true)
  const [expanded,  setExpanded]  = useState<string | null>(null)

  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      router.replace('/dashboard')
    }
  }, [profile, router])

  useEffect(() => {
    fetchDonations()
  }, [])

  const fetchDonations = async () => {
    setLoading(true)
    try {
      const data = await getAllDonations()
      setDonations(data as (Donation & { id: string })[])
    } catch {
      toast.error('Error al cargar las donaciones')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (id: string, status: 'recibida' | 'verificada' | 'rechazada') => {
    try {
      await updateDonationStatus(id, status)
      setDonations(prev => prev.map(d => d.id === id ? { ...d, status } : d))
      toast.success(`Estado actualizado a "${STATUS_LABELS[status]}"`)
    } catch {
      toast.error('Error al actualizar el estado')
    }
  }

  const totalVerificado = donations
    .filter(d => d.status === 'verificada' && d.monto)
    .reduce((sum, d) => sum + (parseInt(d.monto!.replace(/\D/g, ''), 10) || 0), 0)

  const stats = [
    { label: 'Total donaciones', value: donations.length,                                       icon: Heart,       color: 'text-navy' },
    { label: 'Por revisar',      value: donations.filter(d => d.status === 'recibida').length,  icon: Inbox,       color: 'text-blue-600' },
    { label: 'Verificadas',      value: donations.filter(d => d.status === 'verificada').length,icon: CheckCircle2,color: 'text-green-600' },
    { label: 'Total verificado', value: `$${totalVerificado.toLocaleString('es-CO')}`,           icon: DollarSign,  color: 'text-gold' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-navy text-2xl font-bold uppercase tracking-wider">
          Donaciones
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Donaciones registradas a través del formulario público de apoyo
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
              <Icon size={18} className={color} />
            </div>
            <p className={`text-3xl font-bold font-display ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Donations list */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-royal/30 border-t-royal rounded-full animate-spin" />
          </div>
        ) : donations.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Heart size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Todavía no se ha registrado ninguna donación</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {donations.map(d => (
              <div key={d.id} className="px-5 py-4">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpanded(expanded === d.id ? null : d.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-navy text-white text-sm font-bold flex items-center justify-center shrink-0">
                      {d.nombre?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-dark">{d.nombre}</p>
                      <p className="text-xs text-gray-400">
                        {d.monto ? `COP $${d.monto}` : 'Monto no especificado'} · {d.telefono}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn('badge text-xs', STATUS_COLORS[d.status] ?? 'bg-gray-100 text-gray-600')}>
                      {STATUS_LABELS[d.status] ?? d.status}
                    </span>
                    <p className="text-xs text-gray-400 hidden sm:block">
                      {formatDate(d.createdAt as Date, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    {expanded === d.id
                      ? <ChevronUp size={16} className="text-gray-400" />
                      : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>

                {expanded === d.id && (
                  <div className="mt-4 ml-12 space-y-4">
                    {/* Datos del donante */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      {[
                        ['Email',          d.email],
                        ['Teléfono',       d.telefono],
                        ['Identificación', d.identificacion ?? '—'],
                        ['Monto',          d.monto ? `COP $${d.monto}` : '—'],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <p className="font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                          <p className="text-dark break-words">{value}</p>
                        </div>
                      ))}
                      {d.comentarios && (
                        <div className="col-span-full">
                          <p className="font-bold text-gray-400 uppercase tracking-wider mb-0.5">Mensaje</p>
                          <p className="text-dark italic">{d.comentarios}</p>
                        </div>
                      )}
                    </div>

                    {/* Comprobante */}
                    {d.evidenciaUrl && (
                      <div className="pt-3 border-t border-gray-100">
                        <a
                          href={d.evidenciaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-navy hover:bg-navy/90 text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                          <FileText size={14} />
                          Ver comprobante
                        </a>
                      </div>
                    )}

                    {/* Cambio de estado */}
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px] mb-2">
                        Cambiar estado
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(['recibida', 'verificada', 'rechazada'] as const).map(s => (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(d.id, s)}
                            disabled={d.status === s}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                              d.status === s
                                ? `${STATUS_COLORS[s]} cursor-default ring-2 ring-offset-1 ring-navy/30`
                                : 'bg-white text-gray-600 border border-gray-200 hover:border-navy hover:text-navy'
                            )}
                          >
                            {s === 'verificada' && <CheckCircle2 size={12} className="inline mr-1" />}
                            {s === 'rechazada'  && <XCircle      size={12} className="inline mr-1" />}
                            {STATUS_LABELS[s]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
