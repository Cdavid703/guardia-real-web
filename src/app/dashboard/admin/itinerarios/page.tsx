'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  CalendarClock, Plus, Pencil, Trash2, X, Star, Download, ChevronLeft, GripVertical,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getItinerariosDB, upsertItinerario, deleteItinerario, setItinerarioActivo,
} from '@/lib/firebase'
import { ITINERARIOS, type Itinerario, type EventoItinerario } from '@/lib/itinerarios'
import { cn } from '@/lib/utils'

const nuevoEvento = (): EventoItinerario => ({
  id: `e-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  fechaISO: '', hora: '', evento: '', lugar: '', puntoEncuentro: 'Se informará por WhatsApp', uniforme: [],
})

export default function ItinerariosAdminPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [lista, setLista] = useState<Itinerario[]>([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState<Itinerario | null>(null)

  useEffect(() => { if (profile && profile.role !== 'admin' && profile.role !== 'director') router.replace('/dashboard') }, [profile, router])

  const load = useCallback(async () => {
    setLoading(true)
    try { setLista(await getItinerariosDB()) } catch { toast.error('Error al cargar') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const enBase = new Set(lista.map(i => i.id))
  const seedPendientes = ITINERARIOS.filter(s => !enBase.has(s.id))

  const importarSeed = async (s: Itinerario) => {
    const { id, ...data } = s
    try { await upsertItinerario(id, data); toast.success('Itinerario importado a la base'); load() }
    catch { toast.error('No se pudo importar') }
  }

  const activar = async (i: Itinerario) => {
    try { await setItinerarioActivo(i.id); toast.success(`"${i.titulo}" es ahora el itinerario activo`); load() }
    catch { toast.error('No se pudo activar') }
  }

  const eliminar = async (i: Itinerario) => {
    if (!confirm(`¿Eliminar el itinerario "${i.titulo}"?`)) return
    try { await deleteItinerario(i.id); toast.success('Eliminado'); load() }
    catch { toast.error('No se pudo eliminar') }
  }

  if (editando) {
    return <EditorItinerario itinerario={editando} onClose={() => setEditando(null)} onSaved={() => { setEditando(null); load() }} />
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-navy text-2xl font-bold uppercase tracking-wider flex items-center gap-2"><CalendarClock size={22} className="text-royal" /> Itinerarios</h1>
          <p className="text-gray-400 text-sm mt-1">Crea y edita los itinerarios de presentaciones que ven los integrantes. Solo uno puede estar activo.</p>
        </div>
        <button onClick={() => setEditando({ id: `it-${Date.now()}`, titulo: '', rango: '', descripcion: '', activo: false, cronograma: [nuevoEvento()] })} className="btn btn-primary btn-md shrink-0"><Plus size={16} /> Nuevo itinerario</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-royal/30 border-t-royal rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {lista.length === 0 && seedPendientes.length === 0 && (
            <div className="card text-center py-14 text-gray-400 text-sm">Aún no hay itinerarios. Crea el primero.</div>
          )}

          {lista.map(i => (
            <div key={i.id} className={cn('card p-4 flex items-center gap-3', i.activo && 'border-l-4 border-green-500')}>
              <div className="min-w-0 flex-1">
                <p className="font-serif font-bold text-navy flex items-center gap-2">{i.titulo || '(sin título)'}
                  {i.activo && <span className="text-[10px] bg-green-100 text-green-700 rounded-full px-2 py-0.5 font-medium">ACTIVO</span>}</p>
                <p className="text-xs text-gray-400">{i.rango} · {i.cronograma.length} evento(s)</p>
              </div>
              {!i.activo && <button onClick={() => activar(i)} className="btn btn-ghost btn-sm text-green-600"><Star size={13} /> Activar</button>}
              <button onClick={() => setEditando(i)} className="btn btn-ghost btn-sm"><Pencil size={13} /> Editar</button>
              <button onClick={() => eliminar(i)} className="btn btn-ghost btn-sm text-red-500"><Trash2 size={13} /></button>
            </div>
          ))}

          {seedPendientes.map(s => (
            <div key={s.id} className="card p-4 flex items-center gap-3 border-dashed">
              <div className="min-w-0 flex-1">
                <p className="font-serif font-bold text-gray-500 flex items-center gap-2">{s.titulo}
                  <span className="text-[10px] bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 font-medium">EN CÓDIGO</span></p>
                <p className="text-xs text-gray-400">{s.rango} · {s.cronograma.length} evento(s) · impórtalo para poder editarlo</p>
              </div>
              <button onClick={() => importarSeed(s)} className="btn btn-primary btn-sm"><Download size={13} /> Importar para editar</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function EditorItinerario({ itinerario, onClose, onSaved }: { itinerario: Itinerario; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState<Itinerario>(itinerario)
  const [saving, setSaving] = useState(false)
  const set = (k: keyof Itinerario, v: unknown) => setF(p => ({ ...p, [k]: v }))

  const setEv = (idx: number, k: keyof EventoItinerario, v: unknown) =>
    setF(p => ({ ...p, cronograma: p.cronograma.map((e, i) => i === idx ? { ...e, [k]: v } : e) }))
  const addEv = () => setF(p => ({ ...p, cronograma: [...p.cronograma, nuevoEvento()] }))
  const delEv = (idx: number) => setF(p => ({ ...p, cronograma: p.cronograma.filter((_, i) => i !== idx) }))

  const guardar = async () => {
    if (!f.titulo.trim()) { toast.error('El título es obligatorio'); return }
    setSaving(true)
    try {
      const { id, ...data } = f
      await upsertItinerario(id, data)
      toast.success('Itinerario guardado')
      onSaved()
    } catch { toast.error('Error al guardar') } finally { setSaving(false) }
  }

  return (
    <div>
      <button onClick={onClose} className="text-sm text-royal hover:underline flex items-center gap-1 mb-4"><ChevronLeft size={15} /> Volver</button>

      <div className="card p-5 mb-4">
        <h2 className="font-serif font-bold text-navy text-lg mb-4">Datos del itinerario</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <F label="Título *" full><input className="input" value={f.titulo} onChange={e => set('titulo', e.target.value)} placeholder="Instructivo 18–20 de julio 2026" /></F>
          <F label="Rango de fechas"><input className="input" value={f.rango} onChange={e => set('rango', e.target.value)} placeholder="18 al 20 de julio de 2026" /></F>
          <F label="URL del PDF (opcional)"><input className="input" value={f.pdfUrl ?? ''} onChange={e => set('pdfUrl', e.target.value)} placeholder="/docs/instructivo-....pdf" /></F>
          <F label="Descripción" full><textarea className="input resize-none" rows={2} value={f.descripcion} onChange={e => set('descripcion', e.target.value)} /></F>
        </div>
        <label className="flex items-center gap-2 mt-3 text-sm cursor-pointer">
          <input type="checkbox" checked={f.activo} onChange={e => set('activo', e.target.checked)} className="w-4 h-4 accent-green-600" />
          <span>Marcar como <strong>activo</strong> (el que ven los integrantes)</span>
        </label>
      </div>

      <div className="flex items-center justify-between mb-2">
        <h2 className="font-serif font-bold text-navy text-lg">Eventos ({f.cronograma.length})</h2>
        <button onClick={addEv} className="btn btn-ghost btn-sm"><Plus size={14} /> Agregar evento</button>
      </div>
      <div className="space-y-3 mb-5">
        {f.cronograma.map((e, idx) => (
          <div key={e.id} className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <GripVertical size={15} className="text-gray-300" />
              <span className="text-xs font-bold text-gray-400">Evento {idx + 1}</span>
              <button onClick={() => delEv(idx)} className="ml-auto text-red-400 hover:text-red-600"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <F label="Fecha"><input type="date" className="input" value={e.fechaISO} onChange={ev => setEv(idx, 'fechaISO', ev.target.value)} /></F>
              <F label="Hora"><input className="input" value={e.hora} onChange={ev => setEv(idx, 'hora', ev.target.value)} placeholder="6:00 p.m." /></F>
              <F label="Evento" full><input className="input" value={e.evento} onChange={ev => setEv(idx, 'evento', ev.target.value)} placeholder="Desfile..." /></F>
              <F label="Lugar"><input className="input" value={e.lugar} onChange={ev => setEv(idx, 'lugar', ev.target.value)} /></F>
              <F label="Punto de encuentro"><input className="input" value={e.puntoEncuentro} onChange={ev => setEv(idx, 'puntoEncuentro', ev.target.value)} /></F>
              <F label="Uniforme (una prenda por línea)" full>
                <textarea className="input resize-none" rows={4} value={e.uniforme.join('\n')}
                  onChange={ev => setEv(idx, 'uniforme', ev.target.value.split('\n').map(s => s.trim()).filter(Boolean))}
                  placeholder={'Pantalón overol NEGRO\nChaqueta negra con azul\nQuepis con pluma BLANCA'} />
              </F>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={guardar} disabled={saving} className="btn btn-primary btn-md disabled:opacity-60">{saving ? 'Guardando...' : 'Guardar itinerario'}</button>
        <button onClick={onClose} className="btn btn-ghost btn-md">Cancelar</button>
      </div>
    </div>
  )
}

function F({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return <div className={cn(full && 'sm:col-span-2')}><label className="block text-xs font-semibold text-dark mb-1">{label}</label>{children}</div>
}
