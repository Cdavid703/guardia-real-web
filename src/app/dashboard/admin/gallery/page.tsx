'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'sonner'
import {
  Plus, Trash2, Image as ImageIcon, ArrowLeft, Video,
  Instagram, Facebook, Upload, Link as LinkIcon, Eye, EyeOff,
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { createGalleryMedia, getAllGalleryMedia, deleteGalleryMedia, storage } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { cn } from '@/lib/utils'

type MediaType = 'photo' | 'video' | 'instagram' | 'facebook'
type Audience  = 'public' | 'integrante' | 'director' | 'junta' | 'admin'

interface MediaForm {
  type:        MediaType
  title:       string
  description: string
  url:         string
  visibleTo:   Audience[]
}

const EMPTY: MediaForm = {
  type: 'photo', title: '', description: '', url: '',
  visibleTo: ['public', 'integrante', 'director', 'admin'],
}

const AUDIENCE_OPTIONS: { value: Audience; label: string }[] = [
  { value: 'public',     label: '🌐 Público general' },
  { value: 'integrante', label: 'Integrantes' },
  { value: 'director',   label: 'Directores' },
  { value: 'junta',      label: 'Junta directiva' },
  { value: 'admin',      label: 'Administradores' },
]

const TYPE_TABS: { value: MediaType; label: string; icon: React.ElementType }[] = [
  { value: 'photo',     label: 'Foto',      icon: ImageIcon  },
  { value: 'video',     label: 'Video',     icon: Video      },
  { value: 'instagram', label: 'Instagram', icon: Instagram  },
  { value: 'facebook',  label: 'Facebook',  icon: Facebook   },
]

export default function AdminGalleryPage() {
  const { profile } = useAuth()
  const router      = useRouter()
  const fileRef     = useRef<HTMLInputElement>(null)

  const [items,     setItems]     = useState<Record<string, unknown>[]>([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [form,      setForm]      = useState<MediaForm>(EMPTY)
  const [saving,    setSaving]    = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview,   setPreview]   = useState<string | null>(null)

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

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Solo se permiten imágenes'); return }
    setUploading(true)
    try {
      const path    = `gallery/${Date.now()}_${file.name.replace(/\s/g, '_')}`
      const fileRef2 = ref(storage, path)
      await uploadBytes(fileRef2, file)
      const url = await getDownloadURL(fileRef2)
      setForm(prev => ({ ...prev, url }))
      setPreview(url)
      toast.success('Imagen subida correctamente')
    } catch {
      toast.error('Error al subir la imagen — verifica las reglas de Firebase Storage')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('El título es obligatorio'); return }
    if (!form.url.trim())   { toast.error('Debes proporcionar una URL o subir una imagen'); return }
    setSaving(true)
    try {
      await createGalleryMedia({
        type:        form.type,
        title:       form.title.trim(),
        description: form.description.trim(),
        url:         form.url.trim(),
        visibleTo:   form.visibleTo,
        uploadedBy:  profile?.uid ?? '',
      })
      toast.success('Elemento agregado a la galería')
      setShowForm(false)
      setForm(EMPTY)
      setPreview(null)
      fetchItems()
    } catch { toast.error('Error al guardar') }
    finally { setSaving(false) }
  }

  const handleDelete = async (item: Record<string, unknown>) => {
    if (!confirm(`¿Eliminar "${item.title}"?`)) return
    try { await deleteGalleryMedia(item.id as string); toast.success('Eliminado'); fetchItems() }
    catch { toast.error('Error al eliminar') }
  }

  const toggleAudience = (v: Audience) => {
    setForm(prev => {
      const has  = prev.visibleTo.includes(v)
      const next = has ? prev.visibleTo.filter(a => a !== v) : [...prev.visibleTo, v]
      return { ...prev, visibleTo: next }
    })
  }

  const urlPlaceholder: Record<MediaType, string> = {
    photo:     'https://... o sube un archivo',
    video:     'https://www.youtube.com/watch?v=... o https://youtu.be/...',
    instagram: 'https://www.instagram.com/p/...',
    facebook:  'https://www.facebook.com/...',
  }

  const MediaIcon = ({ type }: { type: string }) => {
    const icons: Record<string, React.ElementType> = {
      photo: ImageIcon, video: Video, instagram: Instagram, facebook: Facebook
    }
    const Icon = icons[type] ?? LinkIcon
    return <Icon size={14} />
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <Link href="/dashboard/admin" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-navy mb-1">
            <ArrowLeft size={12} /> Volver
          </Link>
          <h1 className="font-display text-navy text-2xl font-bold uppercase tracking-wider">Galería</h1>
          <p className="text-gray-400 text-sm mt-1">Gestiona fotos, videos y publicaciones de redes sociales</p>
        </div>
        {!showForm && (
          <button onClick={() => { setShowForm(true); setForm(EMPTY); setPreview(null) }} className="btn btn-primary btn-md">
            <Plus size={16} /> Agregar contenido
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-6 mb-6 border-l-4 border-royal">
          <h3 className="font-serif font-bold text-navy text-lg mb-4">Nuevo elemento de galería</h3>
          <form onSubmit={handleSave} className="space-y-4">
            {/* Type tabs */}
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">Tipo de contenido</label>
              <div className="flex gap-2 flex-wrap">
                {TYPE_TABS.map(({ value, label, icon: Icon }) => (
                  <button key={value} type="button"
                    onClick={() => { setForm(prev => ({ ...prev, type: value, url: '' })); setPreview(null) }}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors',
                      form.type === value ? 'border-royal bg-royal text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    )}>
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark mb-1.5">Título *</label>
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                className="input" placeholder="Ej. Feria de las Flores 2026" required />
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark mb-1.5">Descripción <span className="font-normal text-gray-400">(opcional)</span></label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                className="input resize-none" rows={2} placeholder="Breve descripción del contenido..." />
            </div>

            {/* Photo upload or URL */}
            {form.type === 'photo' ? (
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">Imagen *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Upload */}
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-royal transition-colors"
                  >
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-royal/30 border-t-royal rounded-full animate-spin" />
                        <p className="text-xs text-gray-500">Subiendo...</p>
                      </div>
                    ) : preview ? (
                      <div className="relative h-24 rounded overflow-hidden">
                        <Image src={preview} alt="preview" fill className="object-cover" />
                      </div>
                    ) : (
                      <>
                        <Upload size={24} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-sm font-medium text-gray-600">Subir foto</p>
                        <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP</p>
                      </>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                  {/* URL */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">O pega una URL:</p>
                    <input value={form.url} onChange={e => { setForm({...form, url: e.target.value}); setPreview(null) }}
                      className="input" placeholder="https://..." />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-dark mb-1.5">URL del contenido *</label>
                <input value={form.url} onChange={e => setForm({...form, url: e.target.value})}
                  className="input" placeholder={urlPlaceholder[form.type]} required />
              </div>
            )}

            {/* Visibility */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm font-semibold text-dark mb-2">¿Quién puede ver esto?</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
              <button type="submit" disabled={saving || uploading} className="btn btn-primary btn-md disabled:opacity-60">
                {saving ? 'Guardando...' : 'Agregar a galería'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setPreview(null) }} className="btn btn-ghost btn-md">Cancelar</button>
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
          <p className="text-sm mb-4">La galería está vacía</p>
          <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm">
            <Plus size={14} /> Agregar el primero
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map(item => (
            <div key={item.id as string} className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Thumbnail */}
              <div className="relative aspect-square bg-gray-100">
                {item.type === 'photo' && item.url ? (
                  <Image src={item.url as string} alt={item.title as string} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    {item.type === 'video'     && '🎬'}
                    {item.type === 'instagram' && '📸'}
                    {item.type === 'facebook'  && '📘'}
                  </div>
                )}
                {/* Visibility badge */}
                <div className="absolute top-2 left-2">
                  {(item.visibleTo as string[])?.includes('public')
                    ? <span className="text-[9px] bg-green-500 text-white rounded-full px-1.5 py-0.5 font-bold flex items-center gap-0.5"><Eye size={8} /> Público</span>
                    : <span className="text-[9px] bg-navy text-white rounded-full px-1.5 py-0.5 font-bold flex items-center gap-0.5"><EyeOff size={8} /> Privado</span>
                  }
                </div>
              </div>
              {/* Info */}
              <div className="p-3">
                <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                  <MediaIcon type={item.type as string} />
                  <span className="capitalize">{item.type as string}</span>
                </div>
                <p className="text-sm font-semibold text-dark leading-tight line-clamp-1">{item.title as string}</p>
                {item.description && (
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description as string}</p>
                )}
              </div>
              {/* Delete button */}
              <button
                onClick={() => handleDelete(item)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
              >
                <Trash2 size={12} />
              </button>
              {/* External link */}
              {(item.type !== 'photo') && (
                <a href={item.url as string} target="_blank" rel="noopener noreferrer"
                  className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 bg-navy text-white rounded-full flex items-center justify-center hover:bg-royal">
                  <LinkIcon size={11} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
