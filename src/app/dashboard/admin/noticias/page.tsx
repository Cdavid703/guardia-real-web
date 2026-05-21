'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Edit2, Trash2, Eye, EyeOff, Newspaper, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { getAllNews, createNews, updateNews, deleteNews, type NewsItem } from '@/lib/firebase'
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
  id:        null,
  title:     '',
  excerpt:   '',
  content:   '',
  tags:      '',
  image:     '',
  published: false,
}

export default function AdminNoticiasPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [news,      setNews]      = useState<NewsItem[]>([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [form,      setForm]      = useState<FormState>(EMPTY_FORM)
  const [saving,    setSaving]    = useState(false)

  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      router.replace('/dashboard')
    }
  }, [profile, router])

  const fetchNews = async () => {
    setLoading(true)
    try {
      const data = await getAllNews()
      setNews(data)
    } catch {
      toast.error('Error al cargar las noticias')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchNews() }, [])

  const startCreate = () => {
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const startEdit = (n: NewsItem) => {
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

  const cancelForm = () => {
    setShowForm(false)
    setForm(EMPTY_FORM)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.excerpt.trim()) {
      toast.error('Título y resumen son obligatorios')
      return
    }
    setSaving(true)
    try {
      const payload = {
        title:     form.title.trim(),
        slug:      slugify(form.title),
        excerpt:   form.excerpt.trim(),
        content:   form.content.trim(),
        tags:      form.tags.split(',').map(t => t.trim()).filter(Boolean),
        image:     form.image.trim() || null,
        published: form.published,
        author:    profile?.uid ?? null,
      }
      if (form.id) {
        await updateNews(form.id, payload)
        toast.success('Noticia actualizada')
      } else {
        await createNews(payload)
        toast.success(form.published ? 'Noticia publicada' : 'Noticia guardada como borrador')
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
      toast.success(n.published ? 'Despublicada' : 'Publicada')
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
      <div className="mb-8 flex items-start justify-between">
        <div>
          <Link href="/dashboard/admin" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-navy mb-2">
            <ArrowLeft size={12} /> Volver al panel
          </Link>
          <h1 className="font-display text-navy text-2xl font-bold uppercase tracking-wider">
            Gestión de noticias
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Crea, edita, publica o elimina noticias del sitio público
          </p>
        </div>
        {!showForm && (
          <button onClick={startCreate} className="btn btn-primary btn-md">
            <Plus size={16} /> Nueva noticia
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-6 mb-8 border-l-4 border-royal">
          <h3 className="font-serif font-bold text-navy text-lg mb-4">
            {form.id ? 'Editar noticia' : 'Nueva noticia'}
          </h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-dark mb-1.5">Título *</label>
              <input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="input"
                placeholder="Ej. Participamos en el Desfile de Silleteros 2026"
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
                placeholder="1-2 líneas que aparecerán en la tarjeta de la lista de noticias"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark mb-1.5">Contenido completo</label>
              <textarea
                value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
                className="input resize-none"
                rows={8}
                placeholder="Cuerpo de la noticia. Texto plano por ahora."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-dark mb-1.5">
                  Tags <span className="text-gray-400 font-normal">(separados por coma)</span>
                </label>
                <input
                  value={form.tags}
                  onChange={e => setForm({ ...form, tags: e.target.value })}
                  className="input"
                  placeholder="Desfile, Feria de las Flores, Medellín"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark mb-1.5">
                  Imagen <span className="text-gray-400 font-normal">(URL, opcional)</span>
                </label>
                <input
                  value={form.image}
                  onChange={e => setForm({ ...form, image: e.target.value })}
                  className="input"
                  placeholder="https://..."
                />
              </div>
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
                  <p className="text-xs text-gray-500">
                    Si lo desmarcas, la noticia queda como borrador y no aparece en el sitio público.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn btn-primary btn-md disabled:opacity-60">
                {saving ? 'Guardando...' : form.id ? 'Guardar cambios' : 'Crear noticia'}
              </button>
              <button type="button" onClick={cancelForm} className="btn btn-ghost btn-md">
                Cancelar
              </button>
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
            <p className="text-sm mb-4">No hay noticias todavía</p>
            <button onClick={startCreate} className="btn btn-primary btn-sm">
              <Plus size={14} /> Crear la primera
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {news.map(n => (
              <div key={n.id} className="p-5 flex items-start gap-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      'badge text-[10px]',
                      n.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    )}>
                      {n.published ? 'Publicada' : 'Borrador'}
                    </span>
                    {n.tags.slice(0, 3).map(t => (
                      <span key={t} className="badge bg-navy/10 text-navy text-[10px]">{t}</span>
                    ))}
                  </div>
                  <h3 className="font-serif font-bold text-navy text-base mb-1 truncate">{n.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-1">{n.excerpt}</p>
                  <p className="text-[11px] text-gray-400">
                    Actualizada el {formatDate(n.updatedAt, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
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
