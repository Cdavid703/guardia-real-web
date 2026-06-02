'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Edit2, Trash2, Eye, EyeOff, Newspaper, ArrowLeft, Globe, ExternalLink, Upload, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { getAllNews, createNews, updateNews, deleteNews, storage, type NewsItem } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { slugify, formatDate, cn } from '@/lib/utils'

interface FormState {
  id:        string | null
  title:     string
  excerpt:   string
  content:   string
  tags:      string
  image:     string
  published: boolean
}

const EMPTY_FORM: FormState = {
  id: null, title: '', excerpt: '', content: '', tags: '', image: '', published: false,
}

export default function CMNoticiasPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [news,      setNews]      = useState<NewsItem[]>([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [form,      setForm]      = useState<FormState>(EMPTY_FORM)
  const [saving,    setSaving]    = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (profile && profile.role !== 'cm' && profile.role !== 'admin') {
      router.replace('/dashboard')
    }
  }, [profile, router])

  const fetchNews = async () => {
    setLoading(true)
    try {
      const all = await getAllNews()
      // CM solo ve sus propias noticias (admin ve todas)
      const filtered = profile?.role === 'admin'
        ? all
        : all.filter(n => n.author === profile?.uid)
      setNews(filtered)
    } catch {
      toast.error('Error al cargar las noticias')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (profile) fetchNews()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  const startCreate = () => { setForm(EMPTY_FORM); setShowForm(true) }
  const startEdit   = (n: NewsItem) => {
    setForm({
      id:        n.id,
      title:     n.title,
      excerpt:   n.excerpt,
      content:   n.content,
      tags:      n.tags.join(', '),
      image:     n.image ?? '',
      published: n.published,
    })
    setShowForm(true)
  }

  const cancelForm = () => { setShowForm(false); setForm(EMPTY_FORM) }

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Solo se permiten imágenes'); return }
    setUploading(true)
    try {
      const path      = `news/${Date.now()}_${file.name.replace(/\s/g, '_')}`
      const storageRef = ref(storage, path)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      setForm(prev => ({ ...prev, image: url }))
      toast.success('Imagen subida correctamente')
    } catch {
      toast.error('Error al subir la imagen')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.excerpt.trim()) {
      toast.error('Título y resumen son obligatorios')
      return
    }
    setSaving(true)
    try {
      const slug    = slugify(form.title)
      const payload = {
        title:     form.title.trim(),
        slug,
        excerpt:   form.excerpt.trim(),
        content:   form.content.trim(),
        tags:      form.tags.split(',').map(t => t.trim()).filter(Boolean),
        image:     form.image.trim() || null,
        published: form.published,
        visibleTo: ['public'],
        author:    profile?.uid ?? null,
      }
      if (form.id) {
        await updateNews(form.id, payload)
        toast.success('Noticia actualizada')
      } else {
        const ref = await createNews(payload)
        if (form.published) {
          toast.success('Noticia publicada y visible en el sitio ✓')
          // Las noticias del CM son públicas, no se notifica internamente
          void ref
        } else {
          toast.success('Noticia guardada como borrador')
        }
      }
      cancelForm()
      fetchNews()
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const togglePublished = async (n: NewsItem) => {
    try {
      await updateNews(n.id, { published: !n.published })
      toast.success(n.published ? 'Despublicada' : 'Publicada y visible en el sitio ✓')
      fetchNews()
    } catch {
      toast.error('Error al cambiar el estado')
    }
  }

  const handleDelete = async (n: NewsItem) => {
    if (!confirm(`¿Eliminar la noticia "${n.title}"? Esta acción no se puede deshacer.`)) return
    try {
      await deleteNews(n.id)
      toast.success('Noticia eliminada')
      fetchNews()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between flex-wrap gap-3">
        <div>
          <Link href="/dashboard/cm" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-navy mb-2">
            <ArrowLeft size={12} /> Volver al panel
          </Link>
          <h1 className="font-display text-navy text-2xl font-bold uppercase tracking-wider">
            Publicar noticias
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Globe size={13} className="text-pink-500" />
            <p className="text-gray-400 text-sm">
              Noticias de alcance nacional e internacional — visibles al público general
            </p>
          </div>
        </div>
        {!showForm && (
          <button onClick={startCreate} className="btn btn-primary btn-md">
            <Plus size={16} /> Nueva noticia
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-6 mb-8 border-l-4 border-pink-400">
          <h3 className="font-serif font-bold text-navy text-lg mb-1">
            {form.id ? 'Editar noticia' : 'Nueva noticia'}
          </h3>
          <p className="text-xs text-gray-400 mb-4 flex items-center gap-1">
            <Globe size={11} className="text-pink-400" />
            Esta noticia será visible públicamente en el sitio web
          </p>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-dark mb-1.5">Título *</label>
              <input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="input"
                placeholder="Ej. La Guardia Real representará a Colombia en festival internacional"
                required
              />
              {form.title && (
                <p className="text-xs text-gray-400 mt-1">
                  URL: <code>/noticias/{slugify(form.title)}</code>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark mb-1.5">Resumen corto *</label>
              <textarea
                value={form.excerpt}
                onChange={e => setForm({ ...form, excerpt: e.target.value })}
                className="input resize-none"
                rows={2}
                placeholder="1-2 líneas que aparecerán en la tarjeta de noticias"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark mb-1.5">Contenido completo</label>
              <textarea
                value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
                className="input resize-none"
                rows={10}
                placeholder="Desarrollo completo de la noticia..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark mb-1.5">
                Tags <span className="text-gray-400 font-normal">(separados por coma)</span>
              </label>
              <input
                value={form.tags}
                onChange={e => setForm({ ...form, tags: e.target.value })}
                className="input"
                placeholder="Colombia, Internacional, Festival, 2026"
              />
            </div>

            {/* Imagen — upload o URL */}
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">
                Imagen de portada <span className="text-gray-400 font-normal">(opcional)</span>
              </label>

              {form.image ? (
                <div className="relative rounded-xl overflow-hidden bg-gray-100 mb-2">
                  <Image
                    src={form.image}
                    alt="preview"
                    width={800}
                    height={300}
                    className="w-full h-48 object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, image: '' })}
                    className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Upload desde computador */}
                  <div
                    onClick={() => !uploading && fileRef.current?.click()}
                    className={cn(
                      'border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer transition-colors',
                      uploading ? 'opacity-60 cursor-not-allowed' : 'hover:border-pink-300'
                    )}
                  >
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-5 h-5 border-2 border-pink-400/30 border-t-pink-400 rounded-full animate-spin" />
                        <p className="text-xs text-gray-500">Subiendo imagen...</p>
                      </div>
                    ) : (
                      <>
                        <Upload size={22} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-sm font-medium text-gray-600">Subir desde tu computador</p>
                        <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WebP</p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                  />

                  {/* URL directa */}
                  <div className="flex flex-col justify-center gap-1.5">
                    <p className="text-xs text-gray-500 font-medium">O pega un enlace de imagen:</p>
                    <input
                      value={form.image}
                      onChange={e => setForm({ ...form, image: e.target.value })}
                      className="input text-sm"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={e => setForm({ ...form, published: e.target.checked })}
                  className="w-5 h-5 mt-0.5 accent-royal cursor-pointer"
                />
                <div>
                  <p className="text-sm font-semibold text-dark">Publicar inmediatamente</p>
                  <p className="text-xs text-gray-500">Si lo desmarcas, queda como borrador.</p>
                </div>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn btn-primary btn-md disabled:opacity-60">
                {saving ? 'Guardando...' : form.id ? 'Guardar cambios' : 'Crear noticia'}
              </button>
              <button type="button" onClick={cancelForm} className="btn btn-ghost btn-md">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-royal/30 border-t-royal rounded-full animate-spin" />
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Newspaper size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm mb-4">Aún no has publicado noticias</p>
            <button onClick={startCreate} className="btn btn-primary btn-sm">
              <Plus size={14} /> Crear la primera
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {news.map(n => (
              <div key={n.id} className="p-5 flex items-start gap-4 hover:bg-gray-50/50 transition-colors">
                {n.image && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0 hidden sm:block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={n.image} alt={n.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={cn(
                      'badge text-[10px]',
                      n.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    )}>
                      {n.published ? 'Publicada' : 'Borrador'}
                    </span>
                    <span className="badge bg-pink-100 text-pink-700 text-[10px]">🌐 Pública</span>
                    {n.tags.slice(0, 3).map(t => (
                      <span key={t} className="badge bg-navy/10 text-navy text-[10px]">{t}</span>
                    ))}
                  </div>
                  <h3 className="font-serif font-bold text-navy text-base mb-1 truncate">{n.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-1">{n.excerpt}</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {formatDate(n.updatedAt, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  {n.published && (
                    <a href={`/noticias/${n.slug}`} target="_blank" rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-green-50 text-gray-500 hover:text-green-600 transition-colors"
                      title="Ver en el sitio">
                      <ExternalLink size={16} />
                    </a>
                  )}
                  <button
                    onClick={() => togglePublished(n)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-navy transition-colors"
                    title={n.published ? 'Despublicar' : 'Publicar'}
                  >
                    {n.published ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    onClick={() => startEdit(n)}
                    className="p-2 rounded-lg hover:bg-royal/10 text-gray-500 hover:text-royal transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(n)}
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
