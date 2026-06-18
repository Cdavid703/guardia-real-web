'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'sonner'
import {
  Plus, Trash2, Image as ImageIcon, ArrowLeft, Youtube,
  Instagram, Upload, Link as LinkIcon, ExternalLink, Play, X, CheckCircle2, AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { createGalleryMedia, getAllGalleryMedia, deleteGalleryMedia, storage } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { cn, getYouTubeId, getYouTubeEmbedUrl, getYouTubeThumbnail } from '@/lib/utils'

type MediaType = 'photo' | 'youtube' | 'instagram' | 'link'
type UploadStatus = 'pending' | 'uploading' | 'done' | 'error'

interface LinkRow { type: Exclude<MediaType, 'photo'>; url: string; title: string }

const EMPTY_LINK: LinkRow = { type: 'youtube', url: '', title: '' }

const TYPE_TABS: { value: MediaType; label: string; icon: React.ElementType; hint: string }[] = [
  { value: 'photo',     label: 'Fotos',     icon: ImageIcon,  hint: 'Sube una o muchas fotos a la vez' },
  { value: 'youtube',   label: 'YouTube',   icon: Youtube,    hint: 'Agrega uno o varios videos' },
  { value: 'instagram', label: 'Instagram', icon: Instagram,  hint: 'Agrega una o varias publicaciones' },
  { value: 'link',      label: 'Enlace',    icon: LinkIcon,   hint: 'Cualquier otro enlace externo' },
]

export default function CMGaleriaPage() {
  const { profile } = useAuth()
  const router      = useRouter()
  const fileRef     = useRef<HTMLInputElement>(null)

  const [items,     setItems]     = useState<Record<string, unknown>[]>([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [activeType, setActiveType] = useState<MediaType>('photo')
  const [saving,    setSaving]    = useState(false)

  // ── Fotos masivas ──────────────────────────────────────────────
  const [eventTitle, setEventTitle]   = useState('')
  const [eventDesc,  setEventDesc]    = useState('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [fileStatus,  setFileStatus]  = useState<Record<string, UploadStatus>>({})

  // ── Links múltiples ───────────────────────────────────────────
  const [links, setLinks] = useState<LinkRow[]>([{ ...EMPTY_LINK }])

  useEffect(() => {
    if (profile && profile.role !== 'cm' && profile.role !== 'admin') {
      router.replace('/dashboard')
    }
  }, [profile, router])

  const fetchItems = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    try {
      const all = await getAllGalleryMedia(200)
      const filtered = profile.role === 'admin'
        ? all
        : (all as { uploadedBy?: string }[]).filter(m => m.uploadedBy === profile.uid)
      setItems(filtered as Record<string, unknown>[])
    } catch {
      toast.error('Error al cargar la galería')
    } finally {
      setLoading(false)
    }
  }, [profile])

  useEffect(() => { fetchItems() }, [fetchItems])

  const resetForm = () => {
    setEventTitle('')
    setEventDesc('')
    setPendingFiles([])
    setFileStatus({})
    setLinks([{ ...EMPTY_LINK }])
    setShowForm(false)
  }

  // ── Fotos: selección y upload masivo ──────────────────────────
  const onFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter(f => f.type.startsWith('image/'))
    if (!files.length) return
    setPendingFiles(files)
    setFileStatus(Object.fromEntries(files.map(f => [f.name, 'pending' as UploadStatus])))
  }

  const handleBulkPhotoSave = async () => {
    if (!eventTitle.trim()) { toast.error('Escribe el nombre del evento o álbum'); return }
    if (!pendingFiles.length) { toast.error('Selecciona al menos una foto'); return }

    setSaving(true)
    let successCount = 0

    for (let i = 0; i < pendingFiles.length; i++) {
      const file = pendingFiles[i]
      setFileStatus(prev => ({ ...prev, [file.name]: 'uploading' }))
      try {
        const path       = `gallery/${Date.now()}_${file.name.replace(/\s/g, '_')}`
        const storageRef = ref(storage, path)
        await uploadBytes(storageRef, file)
        const url = await getDownloadURL(storageRef)
        await createGalleryMedia({
          type:       'photo',
          title:      pendingFiles.length > 1 ? `${eventTitle.trim()} — ${i + 1}` : eventTitle.trim(),
          description: eventDesc.trim(),
          url,
          visibleTo:  ['public'],
          uploadedBy: profile?.uid ?? '',
        })
        setFileStatus(prev => ({ ...prev, [file.name]: 'done' }))
        successCount++
      } catch {
        setFileStatus(prev => ({ ...prev, [file.name]: 'error' }))
      }
    }

    toast.success(`${successCount} foto(s) agregadas a la galería pública`)
    fetchItems()
    resetForm()
    setSaving(false)
  }

  // ── Links: múltiples a la vez ─────────────────────────────────
  const addLinkRow    = () => setLinks(prev => [...prev, { ...EMPTY_LINK, type: links[0].type }])
  const removeLinkRow = (i: number) => setLinks(prev => prev.filter((_, idx) => idx !== i))
  const updateLink    = (i: number, patch: Partial<LinkRow>) =>
    setLinks(prev => prev.map((row, idx) => idx === i ? { ...row, ...patch } : row))

  const handleBulkLinkSave = async () => {
    const valid = links.filter(l => l.url.trim())
    if (!valid.length) { toast.error('Agrega al menos un enlace'); return }

    // Validate YouTube
    const badYT = valid.filter(l => l.type === 'youtube' && !getYouTubeId(l.url))
    if (badYT.length) { toast.error(`${badYT.length} enlace(s) de YouTube no son válidos`); return }

    setSaving(true)
    let count = 0
    for (const row of valid) {
      try {
        await createGalleryMedia({
          type:       row.type,
          title:      row.title.trim() || row.url.trim(),
          description: '',
          url:        row.url.trim(),
          visibleTo:  ['public'],
          uploadedBy: profile?.uid ?? '',
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
    try {
      await deleteGalleryMedia(item.id as string)
      toast.success('Eliminado')
      fetchItems()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const statusIcon = (s: UploadStatus) => {
    if (s === 'done')      return <CheckCircle2 size={14} className="text-green-500 shrink-0" />
    if (s === 'error')     return <AlertCircle  size={14} className="text-red-500 shrink-0" />
    if (s === 'uploading') return <div className="w-3.5 h-3.5 border-2 border-royal/30 border-t-royal rounded-full animate-spin shrink-0" />
    return <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-200 shrink-0" />
  }

  const isLinkType = (t: MediaType): t is Exclude<MediaType, 'photo'> => t !== 'photo'

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <Link href="/dashboard/cm" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-navy mb-1">
            <ArrowLeft size={12} /> Volver
          </Link>
          <h1 className="font-display text-navy text-2xl font-bold uppercase tracking-wider">Galería / Media</h1>
          <p className="text-gray-400 text-sm mt-1">Sube fotos y publica enlaces en la galería pública</p>
        </div>
        {!showForm && (
          <button onClick={() => { setShowForm(true); setActiveType('photo') }} className="btn btn-primary btn-md">
            <Plus size={16} /> Agregar contenido
          </button>
        )}
      </div>

      {/* ── Form ─────────────────────────────────────────────────── */}
      {showForm && (
        <div className="card p-6 mb-6 border-l-4 border-pink-400">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-bold text-navy text-lg">Nuevo contenido</h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-navy transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Tipo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
            {TYPE_TABS.map(({ value, label, icon: Icon, hint }) => (
              <button key={value} type="button"
                onClick={() => { setActiveType(value); setPendingFiles([]); setLinks([{ ...EMPTY_LINK, type: isLinkType(value) ? value : 'youtube' }]) }}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-3 rounded-xl border-2 text-sm font-medium transition-colors',
                  activeType === value
                    ? 'border-royal bg-royal text-white'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}>
                <Icon size={18} />
                <span>{label}</span>
                <span className={cn('text-[10px] text-center leading-tight',
                  activeType === value ? 'text-white/70' : 'text-gray-400'
                )}>{hint}</span>
              </button>
            ))}
          </div>

          {/* ── Fotos masivas ──────────────────────────────────── */}
          {activeType === 'photo' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-dark mb-1.5">Nombre del evento / álbum *</label>
                <input value={eventTitle} onChange={e => setEventTitle(e.target.value)}
                  className="input" placeholder="Ej. Concurso Calarcá 2026" />
                <p className="text-xs text-gray-400 mt-1">Si subes varias fotos, cada una se guardará como "Nombre — 1", "Nombre — 2", etc.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark mb-1.5">Descripción <span className="font-normal text-gray-400">(opcional)</span></label>
                <input value={eventDesc} onChange={e => setEventDesc(e.target.value)}
                  className="input" placeholder="Breve descripción compartida para todas las fotos" />
              </div>

              {/* Dropzone múltiple */}
              <div>
                <label className="block text-sm font-semibold text-dark mb-1.5">Fotos *</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-royal hover:bg-royal/5 transition-colors"
                >
                  <Upload size={28} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm font-medium text-gray-600">Haz clic para seleccionar fotos</p>
                  <p className="text-xs text-gray-400 mt-1">Puedes seleccionar <strong>varias a la vez</strong> · JPG, PNG, WebP · máx 10 MB c/u</p>
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={onFilesSelected} />
              </div>

              {/* Lista de archivos seleccionados */}
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

          {/* ── Links múltiples ───────────────────────────────── */}
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
                          row.type === 'youtube'   ? 'https://www.youtube.com/watch?v=...' :
                          row.type === 'instagram' ? 'https://www.instagram.com/p/...' :
                          'https://...'
                        } />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-dark mb-1">Título <span className="font-normal text-gray-400">(opcional)</span></label>
                      <input value={row.title} onChange={e => updateLink(i, { title: e.target.value })}
                        className="input text-sm" placeholder="Ej. Desfile de Silleteros 2026" />
                    </div>
                  </div>

                  {/* YouTube preview */}
                  {row.type === 'youtube' && row.url && getYouTubeId(row.url) && (
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-black max-w-sm">
                      <Image
                        src={getYouTubeThumbnail(row.url) ?? ''}
                        alt="preview"
                        fill
                        className="object-cover opacity-80"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
                          <Play size={16} className="text-white ml-0.5" fill="white" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <button type="button" onClick={addLinkRow}
                className="flex items-center gap-2 text-sm text-royal hover:text-navy font-medium transition-colors">
                <Plus size={15} /> Agregar otro enlace
              </button>

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

      {/* ── Gallery grid ─────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-2 border-royal/30 border-t-royal rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <ImageIcon size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm mb-4">Aún no has subido contenido</p>
          <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm">
            <Plus size={14} /> Agregar el primero
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => {
            const type    = item.type as string
            const url     = item.url  as string
            const ytThumb = type === 'youtube' ? getYouTubeThumbnail(url) : null

            return (
              <div key={item.id as string}
                className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative aspect-video bg-gray-100">
                  {type === 'photo' && url ? (
                    <Image src={url} alt={item.title as string} fill className="object-cover" />
                  ) : type === 'youtube' && ytThumb ? (
                    <div className="relative w-full h-full">
                      <Image src={ytThumb} alt={item.title as string} fill className="object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                          <Play size={20} className="text-white ml-1" fill="white" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">
                      {type === 'instagram' ? '📸' : type === 'link' ? '🔗' : '🎬'}
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <span className={cn(
                      'text-[9px] rounded-full px-1.5 py-0.5 font-bold',
                      type === 'youtube'   ? 'bg-red-600 text-white' :
                      type === 'photo'     ? 'bg-green-500 text-white' :
                      type === 'instagram' ? 'bg-purple-600 text-white' :
                      'bg-navy text-white'
                    )}>
                      {type === 'youtube' ? '▶ YouTube' : type === 'photo' ? '📷 Foto' :
                       type === 'instagram' ? '📸 IG' : '🔗 Link'}
                    </span>
                  </div>
                </div>

                <div className="p-3">
                  <p className="text-sm font-semibold text-dark leading-tight line-clamp-1">{item.title as string}</p>
                  {item.description ? (
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{String(item.description)}</p>
                  ) : null}
                </div>

                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {type !== 'photo' && (
                    <a href={url} target="_blank" rel="noopener noreferrer"
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
            )
          })}
        </div>
      )}
    </div>
  )
}
