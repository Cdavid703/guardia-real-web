'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Edit2, Trash2, Eye, EyeOff, Newspaper, ArrowLeft, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { getAllNews, createNews, updateNews, deleteNews, type NewsItem } from '@/lib/firebase'
import { slugify, formatDate, cn } from '@/lib/utils'

type Audience = 'public' | 'integrante' | 'director' | 'junta' | 'admin'

const AUDIENCE_OPTIONS: { value: Audience; label: string; desc: string }[] = [
  { value: 'public',     label: 'Público general',  desc: 'Visible para cualquier visitante del sitio web' },
  { value: 'integrante', label: 'Integrantes',      desc: 'Solo músicos activos de la banda' },
  { value: 'director',   label: 'Directores',       desc: 'Solo el equipo de dirección musical' },
  { value: 'junta',      label: 'Junta directiva',  desc: 'Solo miembros de la junta' },
  { value: 'admin',      label: 'Administradores',  desc: 'Solo administradores del sitio' },
]

interface FormState {
  id:        string | null
  title:     string
  excerpt:   string
  content:   string
  tags:      string
  image:     string
  published: boolean
  visibleTo: Audience[]
}

const EMPTY_FORM: FormState = {
  id:        null,
  title:     '',
  excerpt:   '',
  content:   '',
  tags:      '',
  image:     '',
  published: false,
  visibleTo: ['public'],
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
      visibleTo: (n.visibleTo && n.visibleTo.length > 0 ? n.visibleTo : ['public']) as Audience[],
    })
    setShowForm(true)
  }

  const toggleAudience = (value: Audience) => {
    setForm(prev => {
      const has = prev.visibleTo.includes(value)
      const next = has ? prev.visibleTo.filter(a => a !== value) : [...prev.visibleTo, value]
      return { ...prev, visibleTo: next.length === 0 ? ['public'] : next }
    })
  }

  const cancelForm = () => {
    setShowForm(false)
    setForm(EMPTY_FORM)
  }

  const notifyNews = async (newsData: {
    id: string; title: string; excerpt: string; slug: string; image?: string | null; visibleTo: string[]
  }) => {
    try {
      await fetch('/api/news/notify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ news: newsData }),
      })
    } catch { /* notificación no crítica */ }
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
        visibleTo: form.visibleTo,
        author:    profile?.uid ?? null,
      }
      if (form.id) {
        await updateNews(form.id, payload)
        toast.success('Noticia actualizada')
        // Notificar si se está publicando con audiencia interna
        if (form.published && form.visibleTo.some(r => r !== 'public')) {
          await notifyNews({ id: form.id, ...payload, image: payload.image ?? undefined })
        }
      } else {
        const ref = await createNews(payload)
        if (form.published) {
          toast.success('Noticia publicada — notificando a miembros...')
          await notifyNews({
            id: (ref as { id: string }).id ?? '',
            title:     payload.title,
            excerpt:   payload.excerpt,
            slug:      payload.slug,
            image:     payload.image ?? undefined,
            visibleTo: payload.visibleTo,
          })
          toast.success('¡Miembros notificados por correo!')
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
      if (!n.published) {
        // Se está publicando — notificar si tiene audiencia interna
        toast.success('Publicada — notificando a miembros...')
        await notifyNews({
          id:       n.id,
          title:    n.title,
          excerpt:  n.excerpt,
          slug:     n.slug,
          image:    n.image,
          visibleTo: n.visibleTo,
        })
        toast.success('¡Miembros notificados!')
      } else {
        toast.success('Despublicada')
      }
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
              <p className="text-sm font-semibold text-dark mb-1">¿Quién puede ver esta noticia?</p>
              <p className="text-xs text-gray-500 mb-3">
                Selecciona uno o varios. Si marcas <strong>&ldquo;Público general&rdquo;</strong> aparece
                en el sitio público. Si solo marcas roles internos, solo los integrantes con ese rol
                la verán al iniciar sesión.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AUDIENCE_OPTIONS.map(opt => {
                  const checked = form.visibleTo.includes(opt.value)
                  return (
                    <label
                      key={opt.value}
                      className={cn(
                        'flex items-start gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors',
                        checked
                          ? 'border-royal bg-royal/5'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAudience(opt.value)}
                        className="w-4 h-4 mt-0.5 accent-royal cursor-pointer shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-dark">{opt.label}</p>
                        <p className="text-[11px] text-gray-500 leading-snug">{opt.desc}</p>
                      </div>
                    </label>
                  )
                })}
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
                    Si lo desmarcas, la noticia queda como borrador y no se muestra a nadie.
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
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={cn(
                      'badge text-[10px]',
                      n.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    )}>
                      {n.published ? 'Publicada' : 'Borrador'}
                    </span>
                    {(n.visibleTo ?? ['public']).includes('public') ? (
                      <span className="badge bg-gold/15 text-gold text-[10px]">🌐 Pública</span>
                    ) : (
                      <span className="badge bg-purple-100 text-purple-700 text-[10px]">
                        🔒 Solo: {(n.visibleTo ?? []).join(', ')}
                      </span>
                    )}
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
                  {n.published && (
                    <a
                      href={`/noticias/${n.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-green-50 text-gray-500 hover:text-green-600 transition-colors"
                      title="Ver en el sitio"
                    >
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
