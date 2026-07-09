'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import {
  Wallet, ClipboardCheck, CalendarDays, CheckCircle2, Clock, Plane, Music2, MapPin, BellRing,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getMiIntegrante, getMisPagos, getMiAsistenciaResumen, getEnsayosForRole, getGiras,
} from '@/lib/firebase'
import { cn } from '@/lib/utils'
import type { Integrante, Pago, UserRole } from '@/types'

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const periodoActual = () => new Date().toISOString().slice(0, 7)
function periodoLabel(p: string) { const [y, m] = p.split('-'); return `${MESES[Number(m) - 1] ?? ''} ${y}` }
const fmtCOP = (n?: number) => n != null ? `$${n.toLocaleString('es-CO')}` : ''
function fechaCorta(s?: string) {
  if (!s) return ''
  try { return new Date(s + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short' }) } catch { return s }
}

interface Evento { tipo: 'ensayo' | 'gira'; titulo: string; fecha: string; extra?: string }

export default function MiResumen({ role }: { role: UserRole }) {
  const { profile } = useAuth()
  const [mi, setMi] = useState<Integrante | null>(null)
  const [pagos, setPagos] = useState<Pago[]>([])
  const [asis, setAsis] = useState<{ asistidos: number; total: number } | null>(null)
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    try {
      const hoy = new Date().toISOString().slice(0, 10)
      const f = await getMiIntegrante(profile.uid)
      setMi(f)

      // Próximos ensayos (por rol) + giras donde está inscrito
      const [ensayos, giras] = await Promise.all([
        getEnsayosForRole(role).catch(() => []),
        getGiras().catch(() => []),
      ])
      const evEnsayos: Evento[] = (ensayos as { id: string; title?: string; date?: string; startTime?: string; location?: string }[])
        .filter(e => String(e.date ?? '') >= hoy)
        .map(e => ({ tipo: 'ensayo', titulo: e.title || 'Ensayo', fecha: String(e.date ?? ''), extra: [e.startTime, e.location].filter(Boolean).join(' · ') }))
      const evGiras: Evento[] = giras
        .filter(g => (!f || g.inscritos.includes(f.id)) && g.fechaInicio >= hoy)
        .map(g => ({ tipo: 'gira', titulo: g.titulo, fecha: g.fechaInicio, extra: g.destino }))
      setEventos([...evEnsayos, ...evGiras].sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 6))

      if (f) {
        const [ps, as] = await Promise.all([
          getMisPagos(f.id).catch(() => []),
          getMiAsistenciaResumen(f.id, role).catch(() => ({ asistidos: 0, total: 0 })),
        ])
        setPagos(ps); setAsis(as)
      }
    } catch { /* silencioso */ }
    finally { setLoading(false) }
  }, [profile, role])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-royal/30 border-t-royal rounded-full animate-spin" /></div>

  const pagoMes = pagos.find(p => p.periodo === periodoActual())
  const alDia = !!pagoMes?.pagado
  const pct = asis && asis.total ? Math.round((asis.asistidos / asis.total) * 100) : null

  // Recordatorio: ¿el próximo evento es hoy o mañana?
  const ymd = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
  const hoy = ymd(new Date()); const manana = ymd(new Date(Date.now() + 86400000))
  const proximo = eventos[0]
  const cuando = proximo?.fecha === hoy ? 'Hoy' : proximo?.fecha === manana ? 'Mañana' : null

  return (
    <div>
      {/* Saludo */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy to-[#0a2350] p-6 mb-5">
        <div className="absolute -right-4 -bottom-6 opacity-10"><Image src="/images/escudo.png" alt="" width={140} height={140} /></div>
        <div className="relative">
          <p className="text-gold text-[11px] font-bold uppercase tracking-widest">Mi resumen</p>
          <h2 className="font-display text-white text-2xl font-bold mt-1">Hola, {(profile?.displayName || mi?.nombre || 'integrante').split(' ')[0]} 👋</h2>
          <p className="text-gray-300 text-sm mt-1">Tu estado en la banda de un vistazo.</p>
        </div>
      </div>

      {/* Recordatorio hoy/mañana */}
      {proximo && cuando && (
        <div className="mb-5 rounded-2xl border-2 border-gold/50 bg-gold/5 p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gold flex items-center justify-center shrink-0"><BellRing size={20} className="text-navy" /></div>
          <div className="min-w-0">
            <p className="font-bold text-navy">{cuando} · {proximo.tipo === 'gira' ? 'Gira' : 'Ensayo'}: {proximo.titulo}</p>
            {proximo.extra && <p className="text-sm text-gray-600 flex items-center gap-1"><MapPin size={12} /> {proximo.extra}</p>}
          </div>
        </div>
      )}

      {/* Tarjetas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Pagos */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2"><Wallet size={16} className="text-royal" /><p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Mi mensualidad</p></div>
          {mi ? (
            <>
              <p className={cn('font-display text-2xl font-bold', alDia ? 'text-green-600' : 'text-amber-600')}>{alDia ? 'Al día' : 'Pendiente'}</p>
              <p className="text-sm text-gray-500 mt-0.5">{periodoLabel(periodoActual())}{alDia && pagoMes?.monto ? ` · ${fmtCOP(pagoMes.monto)}` : ''}</p>
              {!alDia && <p className="text-xs text-amber-600 mt-2 flex items-center gap-1"><Clock size={12} /> Aún no registrado este mes</p>}
            </>
          ) : <p className="text-sm text-gray-400">Sin ficha vinculada.</p>}
        </div>

        {/* Asistencia */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2"><ClipboardCheck size={16} className="text-royal" /><p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Mi asistencia</p></div>
          {mi && asis && asis.total > 0 ? (
            <>
              <p className={cn('font-display text-2xl font-bold', (pct ?? 0) >= 80 ? 'text-green-600' : (pct ?? 0) >= 60 ? 'text-amber-600' : 'text-red-500')}>{pct}%</p>
              <p className="text-sm text-gray-500 mt-0.5">{asis.asistidos} de {asis.total} ensayos</p>
              <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full', (pct ?? 0) >= 80 ? 'bg-green-500' : (pct ?? 0) >= 60 ? 'bg-amber-400' : 'bg-red-400')} style={{ width: `${pct}%` }} />
              </div>
            </>
          ) : <p className="text-sm text-gray-400">Aún sin ensayos registrados.</p>}
        </div>

        {/* Próximo */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2"><CalendarDays size={16} className="text-royal" /><p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Lo próximo</p></div>
          {eventos[0] ? (
            <>
              <p className="font-display text-xl font-bold text-navy leading-tight">{eventos[0].titulo}</p>
              <p className="text-sm text-gray-500 mt-0.5 capitalize">{fechaCorta(eventos[0].fecha)}</p>
            </>
          ) : <p className="text-sm text-gray-400">Nada agendado por ahora.</p>}
        </div>
      </div>

      {/* Agenda */}
      <h3 className="font-serif font-bold text-navy text-lg mb-3">Mi agenda</h3>
      {eventos.length === 0 ? (
        <div className="card text-center py-10 text-gray-400 text-sm">No tienes ensayos, eventos ni giras próximas.</div>
      ) : (
        <div className="space-y-2">
          {eventos.map((e, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', e.tipo === 'gira' ? 'bg-gold/15 text-amber-600' : 'bg-royal/10 text-royal')}>
                {e.tipo === 'gira' ? <Plane size={18} /> : <Music2 size={18} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-dark truncate">{e.titulo}</p>
                <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                  <span className="capitalize">{fechaCorta(e.fecha)}</span>
                  {e.extra && <><span>·</span><span className="flex items-center gap-0.5"><MapPin size={10} /> {e.extra}</span></>}
                </p>
              </div>
              <span className={cn('text-[10px] font-medium rounded-full px-2 py-0.5 shrink-0', e.tipo === 'gira' ? 'bg-gold/20 text-amber-700' : 'bg-royal/10 text-royal')}>{e.tipo === 'gira' ? 'Gira' : 'Ensayo'}</span>
            </div>
          ))}
        </div>
      )}

      {/* Historial de pagos */}
      {mi && pagos.length > 0 && (
        <>
          <h3 className="font-serif font-bold text-navy text-lg mt-6 mb-3">Mis pagos</h3>
          <div className="space-y-1.5">
            {pagos.slice(0, 8).map(p => (
              <div key={p.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-3">
                <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                <p className="text-sm font-medium text-dark flex-1 capitalize">{periodoLabel(p.periodo)}</p>
                {p.monto != null && <span className="text-sm text-gray-500">{fmtCOP(p.monto)}</span>}
                {p.fecha && <span className="text-xs text-gray-400">{p.fecha}</span>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
