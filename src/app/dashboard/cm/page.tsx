'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Newspaper, Image as ImageIcon, Globe, TrendingUp, ArrowRight, Plus } from 'lucide-react'
import { getAllNews, getAllGalleryMedia } from '@/lib/firebase'

export default function CMDashboardPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({ noticias: 0, galeria: 0 })

  useEffect(() => {
    if (profile && profile.role !== 'cm' && profile.role !== 'admin') {
      router.replace('/dashboard')
    }
  }, [profile, router])

  useEffect(() => {
    if (!profile) return
    Promise.all([
      getAllNews(),
      getAllGalleryMedia(200),
    ]).then(([news, media]) => {
      const myNews  = news.filter(n => n.author === profile.uid)
      const myMedia = (media as { uploadedBy?: string }[]).filter(m => m.uploadedBy === profile.uid)
      setStats({ noticias: myNews.length, galeria: myMedia.length })
    }).catch(() => {})
  }, [profile])

  const QUICK_LINKS = [
    {
      href:    '/dashboard/cm/noticias',
      icon:    Newspaper,
      title:   'Publicar noticia',
      desc:    'Crea noticias nacionales e internacionales visibles al público',
      color:   'from-navy to-royal',
      action:  'Nueva noticia',
    },
    {
      href:    '/dashboard/cm/galeria',
      icon:    ImageIcon,
      title:   'Galería / Media',
      desc:    'Sube fotos y publica videos de YouTube para la galería pública',
      color:   'from-royal to-sky',
      action:  'Agregar contenido',
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
            <Globe size={20} className="text-pink-600" />
          </div>
          <div>
            <h1 className="font-display text-navy text-2xl font-bold uppercase tracking-wider">
              Panel Community Manager
            </h1>
            <p className="text-gray-400 text-sm">
              Bienvenido, {profile?.displayName?.split(' ')[0]}
            </p>
          </div>
        </div>
        <p className="text-gray-500 text-sm mt-3 max-w-xl">
          Desde aquí puedes publicar noticias de alcance nacional e internacional, y gestionar el
          contenido multimedia de la galería pública del sitio.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-navy/8 flex items-center justify-center">
              <Newspaper size={18} className="text-royal" />
            </div>
            <div>
              <p className="font-display text-navy text-2xl font-bold">{stats.noticias}</p>
              <p className="text-xs text-gray-400">Noticias publicadas</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-navy/8 flex items-center justify-center">
              <ImageIcon size={18} className="text-royal" />
            </div>
            <div>
              <p className="font-display text-navy text-2xl font-bold">{stats.galeria}</p>
              <p className="text-xs text-gray-400">Elementos en galería</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick access cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {QUICK_LINKS.map(({ href, icon: Icon, title, desc, color, action }) => (
          <div key={href} className="card overflow-hidden">
            <div className={`bg-gradient-to-br ${color} p-6 text-white`}>
              <Icon size={28} className="mb-3 opacity-90" />
              <h3 className="font-display text-xl font-bold uppercase tracking-wider">{title}</h3>
              <p className="text-white/70 text-sm mt-1">{desc}</p>
            </div>
            <div className="p-4 flex gap-3">
              <Link href={href} className="btn btn-primary btn-sm flex-1 justify-center">
                <Plus size={14} /> {action}
              </Link>
              <Link href={href} className="btn btn-outline btn-sm flex items-center gap-1">
                Ver todo <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="card p-5 bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-100">
        <div className="flex items-start gap-3">
          <TrendingUp size={20} className="text-pink-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-serif font-bold text-navy text-base mb-2">Consejos para el CM</p>
            <ul className="space-y-1.5 text-sm text-gray-600">
              <li>• Las <strong>noticias</strong> que publiques aparecerán en la sección pública de noticias del sitio.</li>
              <li>• Para videos de YouTube, pega el enlace normal (ej. <code className="text-xs bg-gray-100 px-1 rounded">https://youtube.com/watch?v=…</code>) — se integra automáticamente.</li>
              <li>• Las fotos se suben directamente desde tu computador.</li>
              <li>• Todo el contenido que publiques es inmediatamente visible al público.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
