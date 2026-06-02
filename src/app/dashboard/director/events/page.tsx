'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Plus, Edit2, Trash2, ClipboardList, ArrowLeft,
  Bell, Calendar, MapPin,
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { createEnsayo, getAllEnsayos, updateEnsayo, deleteEnsayo } from '@/lib/firebase'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────
type EnsayoType = 'general' | 'vientos' | 'percusion' | 'colorguard' | 'brass' | 'reunion'
type Audience   = 'integrante' | 'director' | 'junta' | 'admin'

interface EnsayoForm {
  id:        string | null
  title:     string
  type:      EnsayoType
  date:      string
  startTime: string
  endTime:   string
  location:  string
  objective: string
  notes:     string
  image:     string
  visibleTo: Audience[]
}

const EMPTY: EnsayoForm = {
  id: null, title: '', type: 'general', date: '', startTime: '', endTime: '',
  location: '', objective: '', notes: '', image: '',
  visibleTo: ['integrante', 'director', 'admin'],
}

const ENSAYO_TYPES: { value: EnsayoType; label: string; emoji: string; desc: string }[] = [
  { value: 'general',    label: 'Ensayo General',       emoji: '🎺', desc: 'Toda la banda' },
  { value: 'vientos',    label: 'Solo Vientos',         emoji: '🪗', desc: 'Sección de vientos' },
  { value: 'percusion',  label: 'Solo Percusión',       emoji: '🥁', desc: 'Sección de percusión' },
  { value: 'colorguard', label: 'Solo Color Guard',     emoji: '🚩', desc: 'Sección de color guard' },
  { value: 'brass',      label: 'Solo Brass',           emoji: '📯', desc: 'Sección de brass' },
  { value: 'reunion',    label: 'Reunión',              emoji: '📋', desc: 'Reunión de directivos' },
]

const AUDIENCE_OPTIONS: { value: Audience; label: string }[] = [
  { value: 'integrante', label: 'Integrantes' },
  { value: 'director',   label: 'Directores' },
  { value: 'junta',      label: 'Junta directiva' },
  { value: 'admin',      label: 'Administradores' },
]

export default function EnsayosPage() {
  const { profile } = useAuth()
  const router      = useRouter()

  const [ensayos,  setEnsayos]  = useState<Record<string, unknown>[]>([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form,     setForm]     = useState<EnsayoForm>(EMPTY)
  const [saving,   setSaving]   = useState(false)
  const [notifying, setNotifying] = useState<string | null>(null)

  useEffect(() => {
    if (profile && profile.role !== 'director' && profile.role !== 'admin') {
      router.replace('/dashboard')
    }
  }, [profile, router])

  const fetchEnsayos = useCallback(async () => {
    setLoading(true)
    try { setEnsayos(await getAllEnsayos()) }
    catch { toast.error('Error al cargar los ensayos') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchEnsayos() }, [fetchEnsayos])

  const startCreate = () => { setForm(EMPTY); setShowForm(true) }
  const startEdit   = (e: Record<string, unknown>) => {
    setForm({
      id:        e.id as string,
      title:     (e.title     as string) ?? '',
      type:      (e.type      as EnsayoType) ?? 'general',
      date:      (e.date      as string) ?? '',
      startTime: (e.startTime as string) ?? '',
      endTime:   (e.endTime   as string) ?? '',
      location:  (e.location  as string) ?? '',
      objective: (e.objective as string) ?? '',
      notes:     (e.notes     as string) ?? '',
      image:     (e.image     as string) ?? '',
      visibleTo: ((e.visibleTo as Audience[]) ?? []).filter(Boolean),
    })
    setShowForm(true)
  }

  const toggleAudience = (v: Audience) => {
    setForm(prev => {
      const has  = prev.visibleTo.includes(v)
      const next = has ? prev.visibleTo.filter(a => a !== v) : [...prev.visibleTo, v]
      return { ...prev, visibleTo: next }
    })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.date) { toast.error('Título y fecha son obligatorios'); return }
    setSaving(true)
    try {
      const payload = {
        title:     form.title.trim(),
        type:      form.type,
        date:      form.date,
        startTime: form.startTime,
        endTime:   form.endTime || null,
        location:  form.location.trim(),
        objective: form.objective.trim(),
        notes:     form.notes.trim(),
        image:     form.image.trim() || null,
        visibleTo: form.visibleTo,
        createdBy: profile?.uid ?? '',
      }
      if (form.id) {
        await updateEnsayo(form.id, payload)
        toast.success('Ensayo actualizado')
      } else {
        const docRef = await createEnsayo(payload)
        toast.success('Ensayo programado')
        toast.info('Notificando a integrantes...')
        fetch('/api/ensayos/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ensayo: { ...payload, id: docRef.id } }),
        }).then(r => {
          if (r.ok) toast.success('¡Notificados!')
        }).catch(() => {})
      }
      setShowForm(false)
      setForm(EMPTY)
      fetchEnsayos()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('createEnsayo error:', err)
      toast.error(`Error al guardar: ${msg.slice(0, 80)}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (en: Record<string, unknown>) => {
    if (!confirm(`¿Eliminar "${en.title}"?`)) return
    try { await deleteEnsayo(en.id as string); toast.success('Eliminado'); fetchEnsayos() }
    catch { toast.error('Error al eliminar') }
  }

  const handleNotify = async (en: Record<string, unknown>) => {
    setNotifying(en.id as string)
    try {
      const r = await fetch('/api/ensayos/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ensayo: en }),
      })
      if (!r.ok) throw new Error()
      toast.success('Notificaciones enviadas a los integrantes')
      fetchEnsayos()
    } catch { toast.error('Error enviando notificaciones') }
    finally { setNotifying(null) }
  }

  const typeInfo = (t: string) => ENSAYO_TYPES.find(x => x.value === t) ?? { emoji: '📋', label: t, desc: '' }

  const upcoming = ensayos.filter(e => (e.date as string) >= new Date().toISOString().split('T')[0])
  const past     = ensayos.filter(e => (e.date as string) <  new Date().toISOString().split('T')[0])

  const EnsayoCard = ({ en, isPast = false }: { en: Record<string, unknown>; isPast?: boolean }) => {
    const info    = typeInfo(en.type as string)
    const isNotif = notifying === (en.id as string)
    return (
      <div className={cn('p-4 rounded-xl border transition-colors', isPast ? 'border-gray-100 bg-gray-50/50 opacity-70' : 'border-gray-200 bg-white hover:border-royal/30 hover:shadow-sm')}>
        <div className="flex items-start gap-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0', isPast ? 'bg-gray-100' : 'bg-navy/8')}>
            {info.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] font-bold bg-navy/10 text-navy rounded-full px-2 py-0.5">{info.label}</span>
              {isPast && <span className="text-[10px] bg-gray-200 text-gray-500 rounded-full px-2 py-0.5">Pasado</span>}
              {en.notified ? <span className="text-[10px] bg-green-100 text-green-700 rounded-full px-2 py-0.5">✓ Notificado</span> : null}
            </div>
            <h3 className="font-serif font-bold text-navy text-sm mb-1">{en.title as string}</h3>
            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Calendar size={11} /> {en.date as string}{en.startTime ? ` · ${String(en.startTime)}` : null}</span>
              {en.location ? <span className="flex items-center gap-1"><MapPin size={11} />{String(en.location)}</span> : null}
            </div>
            {en.objective ? (
              <p className="text-xs text-gray-600 mt-1.5 italic">{String(en.objective)}</p>
            ) : null}
          </div>
          <div className="flex gap-1.5 shrink-0">
            {!isPast && (
              <button onClick={() => handleNotify(en)} disabled={!!isNotif}
                className="p-2 rounded-lg hover:bg-gold/20 text-gray-400 hover:text-amber-600 transition-colors disabled:opacity-40"
                title="Notificar a integrantes">
                <Bell size={15} className={isNotif ? 'animate-pulse' : ''} />
              </button>
            )}
            <button onClick={() => startEdit(en)}
              className="p-2 rounded-lg hover:bg-royal/10 text-gray-400 hover:text-royal transition-colors">
              <Edit2 size={15} />
            </button>
            <button onClick={() => handleDelete(en)}
              className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <Link href="/dashboard/director" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-navy mb-1">
            <ArrowLeft size={12} /> Repertorio
          </Link>
          <h1 className="font-display text-navy text-2xl font-bold uppercase tracking-wider">Ensayos</h1>
          <p className="text-gray-400 text-sm mt-1">Programa ensayos y notifica a los integrantes</p>
        </div>
        {!showForm && (
          <button onClick={startCreate} className="btn btn-primary btn-md">
            <Plus size={16} /> Programar ensayo
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-6 mb-6 border-l-4 border-royal">
          <h3 className="font-serif font-bold text-navy text-lg mb-4">
            {form.id ? 'Editar ensayo' : 'Programar ensayo'}
          </h3>
          <form onSubmit={handleSave} className="space-y-4">
            {/* Ensayo type selector */}
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">Tipo de ensayo *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ENSAYO_TYPES.map(t => (
                  <label key={t.value} className={cn(
                    'flex items-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-colors',
                    form.type === t.value ? 'border-royal bg-royal/5' : 'border-gray-200 hover:border-gray-300'
                  )}>
                    <input type="radio" name="ensayoType" value={t.value} checked={form.type === t.value}
                      onChange={() => setForm({...form, type: t.value})} className="sr-only" />
                    <span className="text-lg">{t.emoji}</span>
                    <div>
                      <p className="text-sm font-semibold text-dark leading-tight">{t.label}</p>
                      <p className="text-[10px] text-gray-400">{t.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-dark mb-1.5">Título *</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  className="input" placeholder="Ej. Ensayo General — Preparación Feria de las Flores" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark mb-1.5">Fecha *</label>
                <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="input" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark mb-1.5">Hora de inicio</label>
                <input type="time" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} className="input" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark mb-1.5">Hora de fin</label>
                <input type="time" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} className="input" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark mb-1.5">Lugar</label>
                <input value={form.location} onChange={e => setForm({...form, location: e.target.value})}
                  className="input" placeholder="Sede de ensayos, Cra. 48 #73-36" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-dark mb-1.5">Objetivo del ensayo</label>
                <input value={form.objective} onChange={e => setForm({...form, objective: e.target.value})}
                  className="input" placeholder="Ej. Pulir la afinación de Colombia Tierra Querida y trabajar formaciones" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-dark mb-1.5">Notas adicionales <span className="font-normal text-gray-400">(opcionales)</span></label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                  className="input resize-none" rows={2}
                  placeholder="Indicaciones especiales, materiales necesarios, etc." />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-dark mb-1.5">URL imagen <span className="font-normal text-gray-400">(opcional)</span></label>
                <input value={form.image} onChange={e => setForm({...form, image: e.target.value})}
                  className="input" placeholder="https://..." />
              </div>
            </div>

            {/* Audience */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm font-semibold text-dark mb-2">¿Quién debe asistir?</p>
              <p className="text-xs text-gray-500 mb-3">Selecciona las secciones que recibirán notificación de este ensayo.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {AUDIENCE_OPTIONS.map(opt => {
                  const checked = form.visibleTo.includes(opt.value)
                  return (
                    <label key={opt.value} className={cn(
                      'flex items-center gap-2 p-2.5 border-2 rounded-lg cursor-pointer text-sm transition-colors',
                      checked ? 'border-royal bg-royal/5' : 'border-gray-200 hover:border-gray-300'
                    )}>
                      <input type="checkbox" checked={checked} onChange={() => toggleAudience(opt.value)}
                        className="w-4 h-4 accent-royal" />
                      {opt.label}
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn btn-primary btn-md disabled:opacity-60">
                {saving ? 'Guardando...' : form.id ? 'Guardar cambios' : 'Programar ensayo'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost btn-md">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Lists */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-2 border-royal/30 border-t-royal rounded-full animate-spin" />
        </div>
      ) : ensayos.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <ClipboardList size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm mb-4">No hay ensayos programados</p>
          <button onClick={startCreate} className="btn btn-primary btn-sm"><Plus size={14} /> Programar el primero</button>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div>
              <h2 className="font-serif font-bold text-navy text-lg mb-3 flex items-center gap-2">
                <Calendar size={17} className="text-royal" /> Próximos ensayos ({upcoming.length})
              </h2>
              <div className="space-y-3">
                {upcoming.map(en => <EnsayoCard key={en.id as string} en={en} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 className="font-serif text-gray-400 text-base mb-3">Ensayos pasados ({past.length})</h2>
              <div className="space-y-2">
                {past.slice(0, 5).map(en => <EnsayoCard key={en.id as string} en={en} isPast />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
