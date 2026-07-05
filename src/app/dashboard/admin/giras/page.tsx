'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Plane, Plus, Search, X, Trash2, Pencil, Users2, FileDown, MapPin, Calendar,
  UserPlus, ChevronLeft, AlertTriangle,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getGiras, createGira, updateGira, deleteGira,
  getAllIntegrantes, getIntegrantePrivado, type IntegranteBase,
} from '@/lib/firebase'
import { getSeccion } from '@/lib/secciones'
import { edadDesde, esMenorDeEdad, descargarCSV } from '@/lib/integrantes-utils'
import type { Gira, Integrante } from '@/types'
import { cn } from '@/lib/utils'

const norm = (s: string) => (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

function rango(g: Gira) {
  const f = (s?: string) => s ? new Date(s + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
  return g.fechaFin && g.fechaFin !== g.fechaInicio ? `${f(g.fechaInicio)} → ${f(g.fechaFin)}` : f(g.fechaInicio)
}

export default function GirasAdminPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [giras, setGiras] = useState<Gira[]>([])
  const [roster, setRoster] = useState<IntegranteBase[]>([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState<Gira | 'nueva' | null>(null)
  const [abierta, setAbierta] = useState<Gira | null>(null)

  useEffect(() => { if (profile && profile.role !== 'admin') router.replace('/dashboard') }, [profile, router])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [g, r] = await Promise.all([getGiras(), getAllIntegrantes()])
      setGiras(g); setRoster(r)
      // Mantén la gira abierta sincronizada
      setAbierta(a => a ? g.find(x => x.id === a.id) ?? null : null)
    } catch { toast.error('Error al cargar las giras') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const eliminar = async (g: Gira) => {
    if (!confirm(`¿Eliminar la gira "${g.titulo}"?`)) return
    try { await deleteGira(g.id); toast.success('Gira eliminada'); setAbierta(null); load() }
    catch { toast.error('No se pudo eliminar') }
  }

  if (abierta) {
    return <GiraDetalle gira={abierta} roster={roster} onBack={() => setAbierta(null)} onChanged={load} onEdit={() => setEditando(abierta)} onDelete={() => eliminar(abierta)} />
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-navy text-2xl font-bold uppercase tracking-wider flex items-center gap-2"><Plane size={22} className="text-royal" /> Giras y viajes</h1>
          <p className="text-gray-400 text-sm mt-1">Crea las giras, gestiona los inscritos y exporta la lista con datos médicos y logísticos</p>
        </div>
        <button onClick={() => setEditando('nueva')} className="btn btn-primary btn-md shrink-0"><Plus size={16} /> Nueva gira</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-royal/30 border-t-royal rounded-full animate-spin" /></div>
      ) : giras.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <Plane size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aún no hay giras. Crea la primera con “Nueva gira”.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {giras.map(g => (
            <button key={g.id} onClick={() => setAbierta(g)} className="text-left card p-0 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all border-t-4 border-gold">
              <div className="bg-gradient-to-br from-navy to-[#0a2350] p-5">
                <h3 className="font-serif font-bold text-white text-lg leading-tight">{g.titulo}</h3>
                <p className="text-gold text-xs flex items-center gap-1 mt-1"><MapPin size={11} /> {g.destino || '—'}</p>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-500 flex items-center gap-1.5"><Calendar size={13} className="text-royal" /> {rango(g)}</p>
                <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1.5"><Users2 size={13} className="text-royal" /> {g.inscritos.length} inscrito(s)</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {editando && (
        <GiraFormModal
          gira={editando === 'nueva' ? null : editando}
          uid={profile?.uid ?? ''}
          onClose={() => setEditando(null)}
          onSaved={() => { setEditando(null); load() }}
        />
      )}
    </div>
  )
}

function GiraDetalle({ gira, roster, onBack, onChanged, onEdit, onDelete }: {
  gira: Gira; roster: IntegranteBase[]; onBack: () => void; onChanged: () => void; onEdit: () => void; onDelete: () => void
}) {
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)
  const [soloInscritos, setSoloInscritos] = useState(false)
  const inscritosSet = useMemo(() => new Set(gira.inscritos), [gira.inscritos])

  const lista = useMemo(() => {
    const q = norm(search.trim())
    return roster
      .filter(i => !soloInscritos || inscritosSet.has(i.id))
      .filter(i => !q || norm(`${i.nombre} ${i.apellidos} ${getSeccion(i.seccion)?.label ?? ''}`).includes(q))
  }, [roster, search, soloInscritos, inscritosSet])

  const toggle = async (i: IntegranteBase) => {
    setBusy(true)
    const nuevos = inscritosSet.has(i.id) ? gira.inscritos.filter(x => x !== i.id) : [...gira.inscritos, i.id]
    try { await updateGira(gira.id, { inscritos: nuevos }); onChanged() }
    catch { toast.error('No se pudo actualizar') }
    finally { setBusy(false) }
  }

  const menores = useMemo(() => roster.filter(i => inscritosSet.has(i.id) && i.esMenor).length, [roster, inscritosSet])

  const exportar = async () => {
    const ins = roster.filter(i => inscritosSet.has(i.id))
    if (!ins.length) { toast.info('Aún no hay inscritos'); return }
    setBusy(true)
    try {
      const privados = new Map<string, Partial<Integrante>>()
      await Promise.all(ins.map(async i => privados.set(i.id, await getIntegrantePrivado(i.id) ?? {})))
      descargarCSV(`gira-${norm(gira.titulo).replace(/\s+/g, '-')}`,
        ['Apellidos', 'Nombre', 'Sección', 'Edad', 'Menor', 'Sangre', 'EPS', 'Pasaporte', 'Contacto emergencia', 'Condición médica', 'WhatsApp', 'Autorización menor'],
        ins.map(i => {
          const p = privados.get(i.id) ?? {}
          const menor = esMenorDeEdad(p.fechaNacimiento)
          return [
            i.apellidos, i.nombre, getSeccion(i.seccion)?.label ?? i.seccion,
            String(edadDesde(p.fechaNacimiento) ?? ''), menor ? 'SÍ' : 'No',
            p.tipoSangre ?? '', p.eps ?? '', p.pasaporte ? 'Sí' : 'No',
            p.contactoEmergencia ?? '', p.diagnostico ?? '', i.whatsapp,
            !menor ? 'N/A' : (i.autorizacionMenor?.estado === 'firmada' ? 'Firmada' : 'PENDIENTE'),
          ]
        }))
      toast.success(`Lista de ${ins.length} inscrito(s) descargada`)
    } catch { toast.error('No se pudo exportar') }
    finally { setBusy(false) }
  }

  return (
    <div>
      <button onClick={onBack} className="text-sm text-royal hover:underline flex items-center gap-1 mb-4"><ChevronLeft size={15} /> Volver a giras</button>

      <div className="rounded-2xl bg-gradient-to-br from-navy to-[#0a2350] p-6 mb-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-white text-2xl font-bold uppercase tracking-wide">{gira.titulo}</h1>
            <p className="text-gold text-sm flex items-center gap-1 mt-1"><MapPin size={13} /> {gira.destino || '—'} · {rango(gira)}</p>
            {gira.descripcion && <p className="text-gray-300 text-sm mt-2 max-w-lg">{gira.descripcion}</p>}
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={onEdit} className="btn btn-ghost btn-sm text-white hover:bg-white/10"><Pencil size={13} /> Editar</button>
            <button onClick={onDelete} className="btn btn-ghost btn-sm text-red-300 hover:bg-red-500/10"><Trash2 size={13} /> Eliminar</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat label="Inscritos" value={gira.inscritos.length} color="text-navy" />
        <Stat label="Menores" value={menores} color="text-amber-600" />
        <Stat label="En el roster" value={roster.length} color="text-gray-400" />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" placeholder="Buscar integrante..." />
        </div>
        <button onClick={() => setSoloInscritos(s => !s)} className={cn('btn btn-sm', soloInscritos ? 'btn-primary' : 'btn-ghost')}>
          <Users2 size={14} /> {soloInscritos ? 'Viendo inscritos' : 'Ver solo inscritos'}
        </button>
        <button onClick={exportar} disabled={busy} className="btn btn-primary btn-sm disabled:opacity-60"><FileDown size={14} /> Exportar lista</button>
      </div>

      <div className="space-y-1.5">
        {lista.map(i => {
          const insc = inscritosSet.has(i.id)
          return (
            <div key={i.id} className={cn('flex items-center gap-3 border rounded-xl p-3', insc ? 'border-green-200 bg-green-50/50' : 'border-gray-100 bg-white')}>
              <div className="w-9 h-9 rounded-full bg-royal/10 flex items-center justify-center text-royal text-sm font-bold shrink-0">{(i.nombre[0] ?? '?').toUpperCase()}</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-dark truncate flex items-center gap-1.5">
                  {i.nombre} {i.apellidos}
                  {i.esMenor && <span className="text-[9px] bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5 font-medium shrink-0">menor</span>}
                  {i.esMenor && insc && i.autorizacionMenor?.estado !== 'firmada' && (
                    <span className="text-[9px] bg-red-100 text-red-600 rounded-full px-1.5 py-0.5 font-medium shrink-0 flex items-center gap-0.5"><AlertTriangle size={9} /> sin autorización</span>
                  )}
                </p>
                <p className="text-xs text-gray-400 truncate">{getSeccion(i.seccion)?.label ?? i.seccion}</p>
              </div>
              <button onClick={() => toggle(i)} disabled={busy}
                className={cn('btn btn-sm shrink-0 disabled:opacity-50', insc ? 'btn-ghost text-red-500' : 'btn-primary')}>
                {insc ? <><X size={13} /> Quitar</> : <><UserPlus size={13} /> Inscribir</>}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function GiraFormModal({ gira, uid, onClose, onSaved }: { gira: Gira | null; uid: string; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState<Partial<Gira>>(gira ?? { titulo: '', destino: '', fechaInicio: '', fechaFin: '', descripcion: '' })
  const [saving, setSaving] = useState(false)
  const set = (k: keyof Gira, v: unknown) => setF(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!f.titulo?.trim()) { toast.error('El título es obligatorio'); return }
    if (!f.fechaInicio) { toast.error('La fecha de inicio es obligatoria'); return }
    setSaving(true)
    try {
      if (gira) await updateGira(gira.id, f)
      else await createGira(f, uid)
      toast.success(gira ? 'Gira actualizada' : 'Gira creada')
      onSaved()
    } catch { toast.error('Error al guardar') } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif font-bold text-navy text-lg">{gira ? 'Editar gira' : 'Nueva gira'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-navy"><X size={18} /></button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <F label="Título *" full><input className="input" value={f.titulo ?? ''} onChange={e => set('titulo', e.target.value)} placeholder="Gira Calarcá 2026" /></F>
          <F label="Destino"><input className="input" value={f.destino ?? ''} onChange={e => set('destino', e.target.value)} placeholder="Calarcá, Quindío" /></F>
          <F label="Fecha inicio *"><input type="date" className="input" value={f.fechaInicio ?? ''} onChange={e => set('fechaInicio', e.target.value)} /></F>
          <F label="Fecha fin"><input type="date" className="input" value={f.fechaFin ?? ''} onChange={e => set('fechaFin', e.target.value)} /></F>
          <F label="Descripción" full><textarea className="input resize-none" rows={2} value={f.descripcion ?? ''} onChange={e => set('descripcion', e.target.value)} /></F>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={save} disabled={saving} className="btn btn-primary btn-md disabled:opacity-60">{saving ? 'Guardando...' : (gira ? 'Guardar' : 'Crear gira')}</button>
          <button onClick={onClose} className="btn btn-ghost btn-md">Cancelar</button>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return <div className="bg-white border border-gray-100 rounded-xl p-4"><div className={cn('font-display text-2xl font-bold', color)}>{value}</div><div className="text-xs text-gray-400">{label}</div></div>
}
function F({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return <div className={cn(full && 'sm:col-span-2')}><label className="block text-xs font-semibold text-dark mb-1">{label}</label>{children}</div>
}
