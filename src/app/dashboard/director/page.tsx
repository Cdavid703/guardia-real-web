'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Plus, Edit2, Trash2, Music, BookOpen, Upload, ArrowLeft,
  ChevronDown, Download, FileText, Users,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  createRepertoireItem, getAllRepertoireItems, updateRepertoireItem, deleteRepertoireItem,
  storage,
} from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { cn } from '@/lib/utils'
import type { ScoreFile } from '@/types'

// ── Types ──────────────────────────────────────────────────────────
type Level   = 'basico' | 'intermedio' | 'avanzado'
type Section = 'todos' | 'vientos' | 'percusion' | 'colorguard' | 'brass'
type Audience = 'integrante' | 'director' | 'junta' | 'admin'

interface SongForm {
  id:          string | null
  title:       string
  composer:    string
  arranger:    string
  transcriber: string
  genre:       string
  level:       Level
  notes:       string
  visibleTo:   Audience[]
}

const EMPTY_SONG: SongForm = {
  id: null, title: '', composer: '', arranger: '', transcriber: '',
  genre: '', level: 'intermedio', notes: '',
  visibleTo: ['integrante', 'director', 'admin'],
}

const SECTIONS: { value: Section; label: string; emoji: string }[] = [
  { value: 'todos',      label: 'Todos / General',  emoji: '🎼' },
  { value: 'vientos',    label: 'Vientos',          emoji: '🎺' },
  { value: 'percusion',  label: 'Percusión',        emoji: '🥁' },
  { value: 'colorguard', label: 'Color Guard',      emoji: '🚩' },
  { value: 'brass',      label: 'Brass',            emoji: '📯' },
]

const AUDIENCE_OPTIONS: { value: Audience; label: string }[] = [
  { value: 'integrante', label: 'Integrantes' },
  { value: 'director',   label: 'Directores' },
  { value: 'junta',      label: 'Junta' },
  { value: 'admin',      label: 'Admins' },
]

const LEVEL_COLORS: Record<Level, string> = {
  basico:      'bg-green-100 text-green-700',
  intermedio:  'bg-amber-100 text-amber-700',
  avanzado:    'bg-red-100 text-red-700',
}

// ── Score upload row ───────────────────────────────────────────────
function ScoreUploadRow({
  section, onUploaded,
}: { section: Section; onUploaded: (score: Omit<ScoreFile, 'id'>) => void }) {
  const fileRef    = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (file: File) => {
    setUploading(true)
    try {
      const path     = `repertoire/${Date.now()}_${section}_${file.name.replace(/\s/g, '_')}`
      const storageRef = ref(storage, path)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      const info = SECTIONS.find(s => s.value === section)!
      onUploaded({ section, label: `${info.emoji} ${info.label}`, url, filename: file.name })
      toast.success(`Partitura de ${info.label} subida`)
    } catch { toast.error('Error al subir — verifica las reglas de Firebase Storage') }
    finally { setUploading(false) }
  }

  const info = SECTIONS.find(s => s.value === section)!

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg border border-dashed border-gray-200 hover:border-royal transition-colors">
      <span className="text-base">{info.emoji}</span>
      <span className="text-sm font-medium text-gray-600 flex-1">{info.label}</span>
      <button
        type="button"
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-1.5 text-xs text-royal hover:text-navy font-semibold disabled:opacity-50"
      >
        {uploading ? (
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 border border-royal/30 border-t-royal rounded-full animate-spin" /> Subiendo...
          </span>
        ) : (
          <><Upload size={12} /> Subir PDF</>
        )}
      </button>
      <input ref={fileRef} type="file" accept=".pdf,.xml,.mxl,.musicxml" className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
    </div>
  )
}

// ── Song card ─────────────────────────────────────────────────────
function SongCard({
  song, onEdit, onDelete,
}: { song: Record<string, unknown>; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const scores = (song.scores as ScoreFile[]) ?? []

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-royal/30 transition-colors overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 rounded-lg bg-navy/10 flex items-center justify-center shrink-0">
          <Music size={18} className="text-navy" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className={cn('text-[10px] font-bold rounded-full px-2 py-0.5', LEVEL_COLORS[song.level as Level])}>
              {song.level as string}
            </span>
            {song.genre && <span className="badge bg-navy/10 text-navy text-[10px]">{song.genre as string}</span>}
            <span className="badge bg-gray-100 text-gray-500 text-[10px] flex items-center gap-1">
              <FileText size={8} /> {scores.length} partitura{scores.length !== 1 && 's'}
            </span>
          </div>
          <p className="font-serif font-bold text-navy">{song.title as string}</p>
          <p className="text-xs text-gray-400">
            {[song.composer, song.arranger && `Arr. ${song.arranger}`, song.transcriber && `Trans. ${song.transcriber}`]
              .filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <ChevronDown size={15} className={cn('transition-transform', expanded && 'rotate-180')} />
          </button>
          <button onClick={onEdit} className="p-2 rounded-lg hover:bg-royal/10 text-gray-400 hover:text-royal transition-colors">
            <Edit2 size={15} />
          </button>
          <button onClick={onDelete} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3">
          {scores.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-2">No hay partituras subidas aún</p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Partituras disponibles</p>
              {scores.map((s: ScoreFile, i: number) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm">{SECTIONS.find(x => x.value === s.section)?.emoji ?? '🎼'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-dark truncate">{s.label}</p>
                    <p className="text-[10px] text-gray-400 truncate">{s.filename}</p>
                  </div>
                  <a href={s.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-royal hover:text-navy font-semibold">
                    <Download size={12} /> Descargar
                  </a>
                </div>
              ))}
            </div>
          )}
          {song.notes && (
            <div className="mt-3 p-3 bg-navy/5 rounded-lg">
              <p className="text-xs font-bold text-navy mb-1">Notas del director</p>
              <p className="text-xs text-gray-600">{song.notes as string}</p>
            </div>
          )}
          <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-400">
            <Users size={10} /> Visible para: {((song.visibleTo as string[]) ?? []).join(', ')}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────
export default function DirectorPage() {
  const { profile } = useAuth()
  const router      = useRouter()

  const [songs,    setSongs]    = useState<Record<string, unknown>[]>([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form,     setForm]     = useState<SongForm>(EMPTY_SONG)
  const [scores,   setScores]   = useState<Omit<ScoreFile, 'id'>[]>([])
  const [saving,   setSaving]   = useState(false)
  const [search,   setSearch]   = useState('')

  useEffect(() => {
    if (profile && profile.role !== 'director' && profile.role !== 'admin') {
      router.replace('/dashboard')
    }
  }, [profile, router])

  const fetchSongs = useCallback(async () => {
    setLoading(true)
    try { setSongs(await getAllRepertoireItems()) }
    catch { toast.error('Error al cargar el repertorio') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchSongs() }, [fetchSongs])

  const startCreate = () => { setForm(EMPTY_SONG); setScores([]); setShowForm(true) }
  const startEdit   = (song: Record<string, unknown>) => {
    setForm({
      id:          song.id as string,
      title:       (song.title       as string) ?? '',
      composer:    (song.composer    as string) ?? '',
      arranger:    (song.arranger    as string) ?? '',
      transcriber: (song.transcriber as string) ?? '',
      genre:       (song.genre       as string) ?? '',
      level:       (song.level       as Level)  ?? 'intermedio',
      notes:       (song.notes       as string) ?? '',
      visibleTo:   ((song.visibleTo  as Audience[]) ?? []).filter(Boolean),
    })
    setScores(((song.scores as ScoreFile[]) ?? []).map(s => ({ ...s })))
    setShowForm(true)
  }

  const addScore  = (score: Omit<ScoreFile, 'id'>) => setScores(prev => [...prev.filter(s => s.section !== score.section || s.filename !== score.filename), score])
  const delScore  = (i: number) => setScores(prev => prev.filter((_, idx) => idx !== i))

  const toggleAudience = (v: Audience) => {
    setForm(prev => {
      const has  = prev.visibleTo.includes(v)
      const next = has ? prev.visibleTo.filter(a => a !== v) : [...prev.visibleTo, v]
      return { ...prev, visibleTo: next }
    })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('El título es obligatorio'); return }
    setSaving(true)
    try {
      const payload = {
        title:       form.title.trim(),
        composer:    form.composer.trim(),
        arranger:    form.arranger.trim(),
        transcriber: form.transcriber.trim(),
        genre:       form.genre.trim(),
        level:       form.level,
        notes:       form.notes.trim(),
        scores:      scores.map((s, i) => ({ ...s, id: String(i) })),
        visibleTo:   form.visibleTo,
        addedBy:     profile?.uid ?? '',
      }
      if (form.id) { await updateRepertoireItem(form.id, payload); toast.success('Pieza actualizada') }
      else         { await createRepertoireItem(payload);          toast.success('Pieza agregada al repertorio') }
      setShowForm(false)
      setForm(EMPTY_SONG)
      setScores([])
      fetchSongs()
    } catch { toast.error('Error al guardar') }
    finally { setSaving(false) }
  }

  const handleDelete = async (song: Record<string, unknown>) => {
    if (!confirm(`¿Eliminar "${song.title}"?`)) return
    try { await deleteRepertoireItem(song.id as string); toast.success('Eliminado'); fetchSongs() }
    catch { toast.error('Error al eliminar') }
  }

  const filtered = songs.filter(s =>
    !search || (s.title as string)?.toLowerCase().includes(search.toLowerCase()) ||
    (s.composer as string)?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-navy text-2xl font-bold uppercase tracking-wider">Repertorio</h1>
          <p className="text-gray-400 text-sm mt-1">Gestiona el repertorio activo y las partituras de la banda</p>
        </div>
        {!showForm && (
          <button onClick={startCreate} className="btn btn-primary btn-md">
            <Plus size={16} /> Nueva pieza
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-6 mb-6 border-l-4 border-royal">
          <h3 className="font-serif font-bold text-navy text-lg mb-5">
            {form.id ? 'Editar pieza' : 'Nueva pieza del repertorio'}
          </h3>
          <form onSubmit={handleSave} className="space-y-5">
            {/* Basic info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-dark mb-1.5">Título de la pieza *</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  className="input" placeholder="Ej. Colombia Tierra Querida" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark mb-1.5">Compositor / Autor</label>
                <input value={form.composer} onChange={e => setForm({...form, composer: e.target.value})}
                  className="input" placeholder="Lucho Bermúdez" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark mb-1.5">Arreglista</label>
                <input value={form.arranger} onChange={e => setForm({...form, arranger: e.target.value})}
                  className="input" placeholder="Nombre del arreglista" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark mb-1.5">Transcripción por</label>
                <input value={form.transcriber} onChange={e => setForm({...form, transcriber: e.target.value})}
                  className="input" placeholder="Nombre del transcriptor" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark mb-1.5">Ritmo / Género</label>
                <input value={form.genre} onChange={e => setForm({...form, genre: e.target.value})}
                  className="input" placeholder="Porro, Cumbia, Pasodoble, March..." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark mb-1.5">Nivel</label>
                <select value={form.level} onChange={e => setForm({...form, level: e.target.value as Level})} className="input">
                  <option value="basico">Básico</option>
                  <option value="intermedio">Intermedio</option>
                  <option value="avanzado">Avanzado</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-dark mb-1.5">Notas del director</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                  className="input resize-none" rows={2}
                  placeholder="Indicaciones de interpretación, tempo, etc." />
              </div>
            </div>

            {/* Sheet music upload */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm font-semibold text-dark mb-1">Partituras</p>
              <p className="text-xs text-gray-500 mb-3">
                Sube las partituras por sección. Formatos: PDF, MusicXML. Los integrantes solo verán la de su sección.
              </p>
              <div className="space-y-2 mb-4">
                {SECTIONS.map(s => (
                  <ScoreUploadRow key={s.value} section={s.value} onUploaded={addScore} />
                ))}
              </div>

              {/* Uploaded scores */}
              {scores.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Partituras cargadas:</p>
                  {scores.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <span>{SECTIONS.find(x => x.value === s.section)?.emoji}</span>
                      <span className="text-xs font-medium text-dark flex-1 truncate">{s.label} — {s.filename}</span>
                      <button type="button" onClick={() => delScore(i)}
                        className="text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Visibility */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm font-semibold text-dark mb-2">¿Quién puede ver y descargar?</p>
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
                {saving ? 'Guardando...' : form.id ? 'Guardar cambios' : 'Agregar al repertorio'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setScores([]) }} className="btn btn-ghost btn-md">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      {!showForm && songs.length > 0 && (
        <div className="mb-4">
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="input max-w-sm" placeholder="Buscar por título o compositor..." />
        </div>
      )}

      {/* Song list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-2 border-royal/30 border-t-royal rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <BookOpen size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm mb-4">{search ? 'Sin resultados' : 'El repertorio está vacío'}</p>
          {!search && (
            <button onClick={startCreate} className="btn btn-primary btn-sm"><Plus size={14} /> Agregar la primera pieza</button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(song => (
            <SongCard
              key={song.id as string}
              song={song}
              onEdit={() => startEdit(song)}
              onDelete={() => handleDelete(song)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
