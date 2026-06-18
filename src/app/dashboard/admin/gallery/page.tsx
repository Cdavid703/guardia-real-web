'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'sonner'
import {
  Plus, Trash2, Image as ImageIcon, ArrowLeft, Video,
  Instagram, Facebook, Upload, Link as LinkIcon, Eye, EyeOff,
  X, CheckCircle2, AlertCircle, Play, ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { createGalleryMedia, getAllGalleryMedia, deleteGalleryMedia, storage } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { cn } from '@/lib/utils'

type MediaType = 'photo' | 'video' | 'instagram' | 'facebook'
type Audience  = 'public' | 'integrante' | 'director' | 'junta' | 'admin'
type UploadStatus = 'pending' | 'uploading' | 'done' | 'error'

interface LinkRow { type: Exclude<MediaType, 'photo'>; url: string; title: string }

const DEFAULT_VISIBILITY: Audience[] = ['public', 'integrante', 'director', 'admin']
const EMPTY_LINK: LinkRow = { type: 'video', url: '', title: '' }

const AUDIENCE_OPTIONS: { value: Audience; label: string }[] = [
  { value: 'public',     label: '🌐 Público general' },
  { value: 'integrante', label: 'Integrantes' },
  { value: 'director',   label: 'Directores' },
  { value: 'junta',      label: 'Junta directiva' },
  { value: 'admin',      label: 'Administradores' },
]

const TYPE_TABS: { value: MediaType; label: string; icon: React.ElementType; hint: string }[] = [
  { value: 'photo',     label: 'Fotos',     icon: ImageIcon,  hint: 'Una o muchas fotos'        },
  { value: 'video',     label: 'Video',     icon: Video,      hint: 'YouTube u otro video URL'   },
  { value: 'instagram', label: 'Instagram', icon: Instagram,  hint: 'Publicación de Instagram'   },
  { value: 'facebook',  label: 'Facebook',  icon: Facebook,   hint: 'Publicación de Facebook'    },
]

export default function AdminGalleryPage() {
  const { profile } = useAuth()
  const router      = useRouter()
  const fileRef     = useRef<HTMLInputElement>(null)

  const [items,    setItems]    = useState<Record<string, unknown>[]>([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [activeType, setActiveType] = useState<MediaType>('photo')

  // Shared state across modes
  const [visibleTo, setVisibleTo] = useState<Audience[]>(DEFAULT_VISIBILITY)

  // Bulk photos
  const [eventTitle,   setEventTitle]   = useState('')
  const [eventDesc,    setEventDesc]    = useState('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [fileStatus,   setFileStatus]   = useState<Record<string, UploadStatus>>({})

  // Bulk links
  const [links, setLinks] = useState<LinkRow[]>([{ ...EMPTY_LINK }])

  useEffect(() => {
    if (profile && profile.role !== 'admin') router.replace('/dashboard')
  }, [profile, router])

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try { setItems(await getAllGalleryMedia()) }
    catch { toast.error('Error al cargar la galería') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  const resetForm = () => {
    setEventTitle('')
    setEventDesc('')
    setPendingFiles([])
    setFileStatus({})
    setLinks([{ ...EMPTY_LINK }])
    setVisibleTo(DEFAULT_VISIBILITY)
    setShowForm(false)
  }

  const toggleAudience = (v: Audience) =>
    setVisibleTo(prev => prev.includes(v) ? prev.filter(a => a !== v) : [...prev, v])

  // ── Fotos masivas ──────────────────────────────────────────────
  const onFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter(f => f.type.startsWith('image/'))
    if (!files.length) return
    setPendingFiles(files)
    setFileStatus(Object.fromEntries(files.map(f => [f.name, 'pending' as UploadStatus])))
  }

  const handleBulkPhotoSave = async () => {
    if (!eventTitle.trim()) { toast.error('Escribe el nombre del evento o álbum'); return }
    if (!pendingFiles.length) { toast.error('Selecciona al menos una foto'); return }
    if (!visibleTo.length) { toast.error('Selecciona al menos un nivel de visibilidad'); return }

    setSaving(true)
    let successCount = 0
    for (let i = 0; i < pendingFiles.length; i++) {
      const file = pendingFiles[i]
      setFileStatus(prev => ({ ...prev, [file.name]: 'uploading' }))
      try {
        const storageRef = ref(storage, `gallery/${Date.now()}_${file.name.replace(/\s/g, '_')}`)
        await uploadBytes(storageRef, file)
        const url = await getDownloadURL(storageRef)
        await createGalleryMedia({
          type:        'photo',
          title:       pendingFiles.length > 1 ? `${eventTitle.trim()} — ${i + 1}` : eventTitle.trim(),
          description: eventDesc.trim(),
          url,
          visibleTo,
          uploadedBy:  profile?.uid ?? '',
        })
        setFileStatus(prev => ({ ...prev, [file.name]: 'done' }))
        successCount++
      } catch {
        setFileStatus(prev => ({ ...prev, [file.name]: 'error' }))
      }
    }
    toast.success(`${successCount} foto(s) agregadas a la galería`)
    fetchItems()
    resetForm()
    setSaving(false)
  }

  // ── Links múltiples ───────────────────────────────────────────
  const addLinkRow    = () => setLinks(prev => [...prev, { ...EMPTY_LINK, type: links[0].type }])
  const removeLinkRow = (i: number) => setLinks(prev => prev.filter((_, idx) => idx !== i))
  const updateLink    = (i: number, patch: Partial<LinkRow>) =>
    setLinks(prev => prev.map((row, idx) => idx === i ? { ...row, ...patch } : row))

  const handleBulkLinkSave = async () => {
    const valid = links.filter(l => l.url.trim())
    if (!valid.length) { toast.error('Agrega al menos un enlace'); return }
    if (!visibleTo.length) { toast.error('Selecciona al menos un nivel de visibilidad'); return }

    setSaving(true)
    let count = 0
    for (const row of valid) {
      try {
        await createGalleryMedia({
          type:        row.type,
          title:       row.title.trim() || row.url.trim(),
          description: '',
          url:         row.url.trim(),
          visibleTo,
          uploadedBy:  profile?.uid ?? '',
        })
        count++
      } catch { /* continue */ }
    }
    toast.success(`${count} enlace(s) agregados a la galería`)
    fetchItems()
    resetForm()
    setSaving(false)
  }

  const handleDelete = async (item: Record<string, unknown>) => {
    if (!confirm(`¿Eliminar "${item.title}"?`)) return
    try { await deleteGalleryMedia(item.id as string); toast.success('Eliminado'); fetchItems() }
    catch { toast.error('Error al eliminar') }
  }

  const statusIcon = (s: UploadStatus) => {
    if (s === 'done')      return <CheckCircle2 size={14} className="text-green-500 shrink-0" />
    if (s === 'error')     return <AlertCircle  size={14} className="text-red-500 shrink-0" />
    if (s === 'uploading') return <div className="w-3.5 h-3.5 border-2 border-royal/30 border-t-royal rounded-full animate-spin shrink-0" />
    return <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-200 shrink-0" />
  }

  // Audience panel (shared between photo and link modes)
  const AudiencePanel = () => (
    <div className="border-t border-gray-100 pt-4">
      <p className="text-sm font-semibold text-dark mb-2">¿Quién puede ver esto?</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {AUDIENCE_OPTIONS.map(opt => {
          const checked = visibleTo.includes(opt.value)
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
  )

  const isLinkType = (t: MediaType): t is Exclude<MediaType, 'photo'> => t !== 'photo'

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <Link href="/dashboard/admin" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-navy mb-1">
            <ArrowLeft size={12} /> Volver
          </Link>
          <h1 className="font-display text-navy text-2xl font-bold uppercase tracking-wider">Galería</h1>
          <p className="text-gray-400 text-sm mt-1">Gestiona fotos, videos y publicaciones</p>
        </div>
        {!showForm && (
          <button onClick={() => { setShowForm(true); setActiveType('photo') }} className="btn btn-primary btn-md">
            <Plus size={16} /> Agregar contenido
          </button>
        )}
      </div>

      {/* ── Form ──────────────────────────────────────────────────── */}
      {showForm && (
        <div className="card p-6 mb-6 border-l-4 border-royal">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-bold text-navy text-lg">Nuevo contenido de galería</h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-navy transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Tipo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
            {TYPE_TABS.map(({ value, label, icon: Icon, hint }) => (
              <button key={value} type="button"
                onClick={() => { setActiveType(value); setPendingFiles([]); setLinks([{ ...EMPTY_LINK, type: isLinkType(value) ? value : 'video' }]) }}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-3 rounded-xl border-2 text-sm font-medium transition-colors',
                  activeType === value ? 'border-royal bg-royal text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}>
                <Icon size={18} />
                <span>{label}</span>
                <span className={cn('text-[10px] text-center leading-tight',
                  activeType === value ? 'text-white/70' : 'text-gray-400'
                )}>{hint}</span>
              </button>
            ))}
          </div>

          {/* ── Fotos masivas ────────────────────────────────────── */}
          {activeType === 'photo' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-dark mb-1.5">Nombre del evento / álbum *</label>
                <input value={eventTitle} onChange={e => setEventTitle(e.target.value)}
                  className="input" placeholder="Ej. Feria de las Flores 2026" />
                <p className="text-xs text-gray-400 mt-1">Si subes varias fotos, cada una se guardará como "Nombre — 1", "Nombre — 2", etc.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark mb-1.5">Descripción <span className="font-normal text-gray-400">(opcional)</span></label>
                <input value={eventDesc} onChange={e => setEventDesc(e.target.value)}
                  className="input" placeholder="Descripción compartida para todas las fotos" />
              </div>

              {/* Dropzone múltiple */}
              <div>
                <label className="block text-sm font-semibold text-dark mb-1.5">Fotos *</label>
                <div onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-royal hover:bg-royal/5 transition-colors">
                  <Upload size={28} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm font-medium text-gray-600">Haz clic para seleccionar fotos</p>
                  <p className="text-xs text-gray-400 mt-1">Puedes seleccionar <strong>varias a la vez</strong> · JPG, PNG, WebP</p>
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onFilesSelected} />
              </div>

              {pendingFiles.length > 0 && (
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-3 space-y-2 max-h-52 overflow-y-auto">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                    {pendingFiles.length} foto(s) seleccionada(s)
                  </p>
                  {pendingFiles.map(f => (
                    <div key={f.name} className="flex items-center gap-2 text-xs text-gray-600">
                      {statusIcon(fileStatus[f.name] ?? 'pending')}
                      <span className="truncate flex-1">{f.name}</span>
                      <span className="text-gray-400 shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                    </div>
                  ))}
                </div>
              )}

              <AudiencePanel />

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={handleBulkPhotoSave}
                  disabled={saving || !pendingFiles.length}
                  className="btn btn-primary btn-md disabled:opacity-60">
                  {saving ? 'Subiendo...' : `Subir ${pendingFiles.length || ''} foto(s)`}
                </button>
                <button type="button" onClick={resetForm} className="btn btn-ghost btn-md">Cancelar</button>
              </div>
            </div>
          )}

          {/* ── Links múltiples ──────────────────────────────────── */}
          {activeType !== 'photo' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Agrega uno o varios enlaces. Haz clic en <strong>"+ Agregar otro"</strong> para incluir más.
              </p>

              {links.map((row, i) => (
                <div key={i} className="bg-gray-50 rounded-xl border border-gray-100 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Enlace {i + 1}</span>
                    {links.length > 1 && (
                      <button type="button" onClick={() => removeLinkRow(i)}
                        className="text-red-400 hover:text-red-600 transition-colors">
                        <X size={15} />
                      </button>
                    )}
                  </div>

                  {/* Tipo del enlace */}
                  <div className="flex gap-2 flex-wrap">
                    {TYPE_TABS.filter(t => t.value !== 'photo').map(({ value, label, icon: Icon }) => (
                      <button key={value} type="button"
                        onClick={() => updateLink(i, { type: value as Exclude<MediaType,'photo'> })}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors',
                          row.type === value ? 'border-royal bg-royal text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        )}>
                        <Icon size={13} /> {label}
                      </button>
                    ))}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-dark mb-1">URL *</label>
                      <input value={row.url} onChange={e => updateLink(i, { url: e.target.value })}
                        className="input text-sm"
                        placeholder={
                          row.type === 'video'     ? 'https://www.youtube.com/watch?v=...' :
                          row.type === 'instagram' ? 'https://www.instagram.com/p/...' :
                          row.type === 'facebook'  ? 'https://www.facebook.com/...' :
                          'https://...'
                        } />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-dark mb-1">Título <span className="font-normal text-gray-400">(opcional)</span></label>
                      <input value={row.title} onChange={e => updateLink(i, { title: e.target.value })}
                        className="input text-sm" placeholder="Ej. Desfile de Silleteros 2026" />
                    </div>
                  </div>
                </div>
              ))}

              <button type="button" onClick={addLinkRow}
                className="flex items-center gap-2 text-sm text-royal hover:text-navy font-medium transition-colors">
                <Plus size={15} /> Agregar otro enlace
              </button>

              <AudiencePanel />

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={handleBulkLinkSave}
                  disabled={saving}
                  className="btn btn-primary btn-md disabled:opacity-60">
                  {saving ? 'Guardando...' : `Publicar ${links.filter(l => l.url.trim()).length || ''} enlace(s)`}
                </button>
                <button type="button" onClick={resetForm} className="btn btn-ghost btn-md">Cancelar</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Gallery grid ──────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-2 border-royal/30 border-t-royal rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <ImageIcon size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm mb-4">La galería está vacía</p>
          <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm">
            <Plus size={14} /> Agregar el primero
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map(item => (
            <div key={item.id as string}
              className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative aspect-square bg-gray-100">
                {item.type === 'photo' && item.url ? (
                  <Image src={item.url as string} alt={item.title as string} fill className="object-cover" />
                ) : item.type === 'video' && item.url ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gray-900">
                    <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
                      <Play size={20} className="text-white ml-1" fill="white" />
                    </div>
                    <span className="text-white/50 text-[10px]">Video</span>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    {item.type === 'instagram' ? '📸' : item.type === 'facebook' ? '📘' : '🔗'}
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  {(item.visibleTo as string[])?.includes('public')
                    ? <span className="text-[9px] bg-green-500 text-white rounded-full px-1.5 py-0.5 font-bold flex items-center gap-0.5"><Eye size={8} /> Público</span>
                    : <span className="text-[9px] bg-navy text-white rounded-full px-1.5 py-0.5 font-bold flex items-center gap-0.5"><EyeOff size={8} /> Privado</span>
                  }
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-center gap-1 text-xs text-gray-400 mb-1 capitalize">
                  {item.type === 'photo'     && <ImageIcon size={11} />}
                  {item.type === 'video'     && <Video size={11} />}
                  {item.type === 'instagram' && <Instagram size={11} />}
                  {item.type === 'facebook'  && <Facebook size={11} />}
                  <span>{item.type as string}</span>
                </div>
                <p className="text-sm font-semibold text-dark leading-tight line-clamp-1">{item.title as string}</p>
                {item.description ? (
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{String(item.description)}</p>
                ) : null}
              </div>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {item.type !== 'photo' && (
                  <a href={item.url as string} target="_blank" rel="noopener noreferrer"
                    className="w-7 h-7 bg-navy text-white rounded-full flex items-center justify-center hover:bg-royal">
                    <ExternalLink size={11} />
                  </a>
                )}
                <button onClick={() => handleDelete(item)}
                  className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
