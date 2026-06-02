'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'sonner'
import {
  Plus, Trash2, Image as ImageIcon, ArrowLeft, Youtube,
  Instagram, Upload, Link as LinkIcon, ExternalLink, Play,
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { createGalleryMedia, getAllGalleryMedia, deleteGalleryMedia, storage } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { cn, getYouTubeId, getYouTubeEmbedUrl, getYouTubeThumbnail } from '@/lib/utils'

type MediaType = 'photo' | 'youtube' | 'instagram' | 'link'

interface MediaForm {
  type:        MediaType
  title:       string
  description: string
  url:         string
}

const EMPTY: MediaForm = { type: 'photo', title: '', description: '', url: '' }

const TYPE_TABS: { value: MediaType; label: string; icon: React.ElementType; hint: string }[] = [
  { value: 'photo',     label: 'Foto',      icon: ImageIcon,  hint: 'Sube una imagen desde tu computador' },
  { value: 'youtube',   label: 'YouTube',   icon: Youtube,    hint: 'Pega el enlace normal del video' },
  { value: 'instagram', label: 'Instagram', icon: Instagram,  hint: 'Pega el enlace de la publicación' },
  { value: 'link',      label: 'Enlace',    icon: LinkIcon,   hint: 'Cualquier otro enlace externo' },
]

const URL_PLACEHOLDER: Record<MediaType, string> = {
  photo:     'https://...',
  youtube:   'https://www.youtube.com/watch?v=... o https://youtu.be/...',
  instagram: 'https://www.instagram.com/p/...',
  link:      'https://...',
}

export default function CMGaleriaPage() {
  const { profile } = useAuth()
  const router      = useRouter()
  const fileRef     = useRef<HTMLInputElement>(null)

  const [items,     setItems]     = useState<Record<string, unknown>[]>([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [form,      setForm]      = useState<MediaForm>(EMPTY)
  const [saving,    setSaving]    = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imgPreview,setImgPreview]= useState<string | null>(null)

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
      // CM ve solo los suyos (admin ve todos)
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

  const onUrlChange = (url: string) => {
    setForm(prev => ({ ...prev, url }))
  }

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Solo se permiten imágenes'); return }
    setUploading(true)
    try {
      const path      = `gallery/${Date.now()}_${file.name.replace(/\s/g, '_')}`
      const storageRef = ref(storage, path)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      setForm(prev => ({ ...prev, url }))
      setImgPreview(url)
      toast.success('Imagen subida correctamente')
    } catch {
      toast.error('Error al subir — verifica las reglas de Firebase Storage')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('El título es obligatorio'); return }
    if (!form.url.trim())   { toast.error('Debes proporcionar una URL o subir una imagen'); return }

    // Validar YouTube
    if (form.type === 'youtube' && !getYouTubeId(form.url)) {
      toast.error('La URL no parece ser un enlace de YouTube válido')
      return
    }

    setSaving(true)
    try {
      await createGalleryMedia({
        type:        form.type,
        title:       form.title.trim(),
        description: form.description.trim(),
        url:         form.url.trim(),
        visibleTo:   ['public'],
        uploadedBy:  profile?.uid ?? '',
      })
      toast.success('Contenido agregado a la galería pública')
      setShowForm(false)
      setForm(EMPTY)
      setImgPreview(null)
      fetchItems()
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
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

  const changeType = (t: MediaType) => {
    setForm({ type: t, title: '', description: '', url: '' })
    setImgPreview(null)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <Link href="/dashboard/cm" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-navy mb-1">
            <ArrowLeft size={12} /> Volver
          </Link>
          <h1 className="font-display text-navy text-2xl font-bold uppercase tracking-wider">Galería / Media</h1>
          <p className="text-gray-400 text-sm mt-1">Sube fotos y publica videos de YouTube en la galería pública</p>
        </div>
        {!showForm && (
          <button onClick={() => { setShowForm(true); setForm(EMPTY) }} className="btn btn-primary btn-md">
            <Plus size={16} /> Agregar contenido
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-6 mb-6 border-l-4 border-pink-400">
          <h3 className="font-serif font-bold text-navy text-lg mb-4">Nuevo contenido</h3>
          <form onSubmit={handleSave} className="space-y-4">

            {/* Type selector */}
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">Tipo de contenido</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TYPE_TABS.map(({ value, label, icon: Icon, hint }) => (
                  <button key={value} type="button"
                    onClick={() => changeType(value)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border-2 text-sm font-medium transition-colors',
                      form.type === value
                        ? 'border-royal bg-royal text-white'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    )}>
                    <Icon size={18} />
                    <span>{label}</span>
                    <span className={cn('text-[10px] text-center leading-tight',
                      form.type === value ? 'text-white/70' : 'text-gray-400'
                    )}>{hint}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark mb-1.5">Título *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                className="input" placeholder={
                  form.type === 'youtube'   ? 'Ej. Desfile de Silleteros 2026 — Guardia Real' :
                  form.type === 'photo'     ? 'Ej. Presentación en la Feria de Flores' :
                  form.type === 'instagram' ? 'Ej. Post de Instagram — Feria 2026' :
                  'Ej. Artículo sobre la Guardia Real'
                } required />
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark mb-1.5">
                Descripción <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="input resize-none" rows={2} placeholder="Breve descripción del contenido..." />
            </div>

            {/* Photo upload */}
            {form.type === 'photo' && (
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">Imagen *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-royal transition-colors"
                  >
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-royal/30 border-t-royal rounded-full animate-spin" />
                        <p className="text-xs text-gray-500">Subiendo...</p>
                      </div>
                    ) : imgPreview ? (
                      <div className="relative h-24 rounded overflow-hidden">
                        <Image src={imgPreview} alt="preview" fill className="object-cover" />
                      </div>
                    ) : (
                      <>
                        <Upload size={24} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-sm font-medium text-gray-600">Subir foto</p>
                        <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP — máx 10 MB</p>
                      </>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">O pega una URL de imagen:</p>
                    <input value={form.url}
                      onChange={e => { setForm({ ...form, url: e.target.value }); setImgPreview(null) }}
                      className="input" placeholder="https://..." />
                  </div>
                </div>
              </div>
            )}

            {/* YouTube URL */}
            {form.type === 'youtube' && (
              <div>
                <label className="block text-sm font-semibold text-dark mb-1.5">
                  Enlace de YouTube *
                </label>
                <input
                  value={form.url}
                  onChange={e => onUrlChange(e.target.value)}
                  className="input"
                  placeholder="https://www.youtube.com/watch?v=... o https://youtu.be/..."
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Pega el enlace normal del video. Se integrará automáticamente en la galería.
                </p>
                {/* YouTube preview */}
                {form.url && getYouTubeId(form.url) && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Vista previa del video:</p>
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-black max-w-lg">
                      <iframe
                        src={getYouTubeEmbedUrl(form.url) ?? ''}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="YouTube preview"
                      />
                    </div>
                  </div>
                )}
                {form.url && !getYouTubeId(form.url) && form.url.length > 10 && (
                  <p className="text-xs text-red-500 mt-1">
                    Este enlace no parece ser un video de YouTube válido
                  </p>
                )}
              </div>
            )}

            {/* Other URLs */}
            {(form.type === 'instagram' || form.type === 'link') && (
              <div>
                <label className="block text-sm font-semibold text-dark mb-1.5">URL *</label>
                <input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })}
                  className="input" placeholder={URL_PLACEHOLDER[form.type]} required />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving || uploading} className="btn btn-primary btn-md disabled:opacity-60">
                {saving ? 'Guardando...' : 'Agregar a galería'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setImgPreview(null) }}
                className="btn btn-ghost btn-md">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Gallery grid */}

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
            const type  = item.type as string
            const url   = item.url  as string
            const ytThumb = type === 'youtube' ? getYouTubeThumbnail(url) : null

            return (
              <div key={item.id as string}
                className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Thumbnail */}
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
                  {/* Type badge */}
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

                {/* Info */}
                <div className="p-3">
                  <p className="text-sm font-semibold text-dark leading-tight line-clamp-1">{item.title as string}</p>
                  {item.description ? (
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{String(item.description)}</p>
                  ) : null}
                </div>

                {/* Actions */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {type !== 'photo' && (
                    <a href={url} target="_blank" rel="noopener noreferrer"
                      className="w-7 h-7 bg-navy text-white rounded-full flex items-center justify-center hover:bg-royal">
                      <ExternalLink size={11} />
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(item)}
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
