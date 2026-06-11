'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Calendar, Music, Bell, User, MapPin, X, Save, Phone, Hash } from 'lucide-react'
import Image from 'next/image'
import { getEnsayosForRole, getNewsForRole, updateUserProfile, type NewsItem } from '@/lib/firebase'
import type { Ensayo } from '@/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const ENSAYO_TYPE_INFO: Record<string, { emoji: string; label: string }> = {
  general:    { emoji: '🎺', label: 'Ensayo General' },
  vientos:    { emoji: '🪗', label: 'Solo Vientos' },
  percusion:  { emoji: '🥁', label: 'Solo Percusión' },
  colorguard: { emoji: '🚩', label: 'Solo Color Guard' },
  brass:      { emoji: '📯', label: 'Solo Brass' },
  reunion:    { emoji: '📋', label: 'Reunión' },
}

const INSTRUMENTS = [
  'Trompeta', 'Trombón', 'Tuba/Bombardino', 'Corno Francés', 'Fliscorno',
  'Clarinete', 'Flauta', 'Saxofón Alto', 'Saxofón Tenor', 'Saxofón Barítono', 'Oboe',
  'Redoblante', 'Bombo', 'Platillos', 'Lira/Glockenspiel', 'Marimba', 'Timbal',
  'Color Guard / Bandera', 'Sable', 'Rifle',
  'Otro',
]

interface ProfileForm {
  displayName: string
  phone:       string
  instrument:  string
  joinedYear:  string
  bio:         string
}

export default function IntegrantePage() {
  const { profile, refreshProfile } = useAuth()
  const router = useRouter()

  const [ensayos,    setEnsayos]    = useState<Ensayo[]>([])
  const [news,       setNews]       = useState<NewsItem[]>([])
  const [loading,    setLoading]    = useState(true)
  const [showEdit,   setShowEdit]   = useState(false)
  const [editForm,   setEditForm]   = useState<ProfileForm>({
    displayName: '', phone: '', instrument: '', joinedYear: '', bio: '',
  })
  const [saving,     setSaving]     = useState(false)

  useEffect(() => {
    if (profile && profile.role !== 'integrante' && profile.role !== 'admin') {
      router.replace('/dashboard')
    }
  }, [profile, router])

  useEffect(() => {
    if (!profile) return
    const today = new Date().toISOString().split('T')[0]
    Promise.all([
      getEnsayosForRole('integrante'),
      getNewsForRole('integrante', 5),
    ]).then(([ens, nws]) => {
      setEnsayos((ens as unknown as Ensayo[]).filter(e => e.date >= today))
      setNews(nws.filter(n => n.visibleTo.includes('integrante')).slice(0, 4))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [profile])

  const openEdit = () => {
    setEditForm({
      displayName: profile?.displayName ?? '',
      phone:       profile?.phone       ?? '',
      instrument:  profile?.instrument  ?? '',
      joinedYear:  String(profile?.joinedYear ?? ''),
      bio:         profile?.bio         ?? '',
    })
    setShowEdit(true)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    try {
      await updateUserProfile(profile.uid, {
        displayName: editForm.displayName.trim() || undefined,
        phone:       editForm.phone.trim()       || undefined,
        instrument:  editForm.instrument         || undefined,
        joinedYear:  editForm.joinedYear ? Number(editForm.joinedYear) : undefined,
        bio:         editForm.bio.trim()         || undefined,
      })
      await refreshProfile?.()
      toast.success('Perfil actualizado correctamente')
      setShowEdit(false)
    } catch {
      toast.error('Error al guardar el perfil')
    } finally {
      setSaving(false)
    }
  }

  const phone      = profile?.phone
  const joinedYear = profile?.joinedYear
  const bio        = profile?.bio

  return (
    <div>
      {profile?.role === 'admin' && (
        <div className="mb-4 flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          <span className="text-base">👁️</span>
          <span>Estás viendo la vista tal como la ve un <strong>integrante</strong>. Los datos son reales.</span>
        </div>
      )}
      <div className="mb-8">
        <h1 className="font-display text-navy text-2xl font-bold uppercase tracking-wider">Mi portal</h1>
        <p className="text-gray-400 text-sm mt-1">Tu espacio personal como integrante de la Guardia Real</p>
      </div>

      {/* Edit Profile Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-serif font-bold text-navy text-xl">Editar mi perfil</h2>
              <button onClick={() => setShowEdit(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-dark mb-1.5">Nombre completo</label>
                <input value={editForm.displayName}
                  onChange={e => setEditForm(p => ({ ...p, displayName: e.target.value }))}
                  className="input" placeholder="Tu nombre completo" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-dark mb-1.5">
                    <Phone size={12} className="inline mr-1" />Teléfono / WhatsApp
                  </label>
                  <input value={editForm.phone}
                    onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                    className="input" placeholder="310 000 0000" type="tel" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark mb-1.5">
                    <Hash size={12} className="inline mr-1" />Año de ingreso
                  </label>
                  <input value={editForm.joinedYear}
                    onChange={e => setEditForm(p => ({ ...p, joinedYear: e.target.value }))}
                    className="input" placeholder="2020" type="number" min="1982" max={new Date().getFullYear()} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark mb-1.5">
                  <Music size={12} className="inline mr-1" />Instrumento / Sección
                </label>
                <select value={editForm.instrument}
                  onChange={e => setEditForm(p => ({ ...p, instrument: e.target.value }))}
                  className="input">
                  <option value="">Seleccionar instrumento...</option>
                  {INSTRUMENTS.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark mb-1.5">
                  Sobre mí <span className="font-normal text-gray-400">(opcional)</span>
                </label>
                <textarea value={editForm.bio}
                  onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))}
                  className="input resize-none" rows={3}
                  placeholder="Una breve descripción tuya, tu experiencia musical, etc." />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="btn btn-primary btn-md flex-1 justify-center disabled:opacity-60">
                  {saving ? 'Guardando...' : <><Save size={15} /> Guardar cambios</>}
                </button>
                <button type="button" onClick={() => setShowEdit(false)}
                  className="btn btn-ghost btn-md">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="card p-6 text-center">
          {profile?.photoURL ? (
            <Image src={profile.photoURL} alt={profile.displayName} width={64} height={64}
              className="rounded-full mx-auto mb-3 border-2 border-gold" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-navy mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold border-2 border-gold">
              {profile?.displayName[0]?.toUpperCase()}
            </div>
          )}
          <h3 className="font-serif font-bold text-navy text-lg">{profile?.displayName}</h3>
          <p className="text-sm text-gray-400 mb-1">{profile?.email}</p>
          <span className="badge bg-blue-100 text-blue-700">Integrante</span>

          {profile?.instrument && (
            <p className="text-sm text-gray-600 mt-3 flex items-center justify-center gap-1">
              <Music size={13} /> {profile.instrument}
            </p>
          )}
          {phone && (
            <p className="text-sm text-gray-500 mt-1 flex items-center justify-center gap-1">
              <Phone size={12} /> {phone}
            </p>
          )}
          {joinedYear && (
            <p className="text-xs text-gray-400 mt-1">Desde {joinedYear}</p>
          )}
          {bio && (
            <p className="text-xs text-gray-500 mt-3 leading-relaxed italic">{bio}</p>
          )}

          <button onClick={openEdit} className="btn btn-outline btn-sm mt-4 w-full">
            <User size={14} /> Editar mi perfil
          </button>
        </div>

        {/* Ensayos */}
        <div className="card p-6 md:col-span-2">
          <h3 className="font-serif font-bold text-navy text-lg flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-royal" /> Próximos ensayos
          </h3>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-7 h-7 border-2 border-royal/30 border-t-royal rounded-full animate-spin" />
            </div>
          ) : ensayos.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Calendar size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No hay ensayos programados próximamente</p>
              <p className="text-xs mt-1">El director publicará el cronograma aquí</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ensayos.slice(0, 5).map(en => {
                const info = ENSAYO_TYPE_INFO[en.type] ?? { emoji: '📋', label: en.type }
                return (
                  <div key={en.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-9 h-9 rounded-xl bg-navy/8 flex items-center justify-center text-lg shrink-0">
                      {info.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold bg-navy/10 text-navy rounded-full px-2 py-0.5">
                        {info.label}
                      </span>
                      <p className="font-serif font-bold text-navy text-sm mt-0.5">{en.title}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar size={10} /> {en.date}{en.startTime ? ` · ${en.startTime}` : ''}
                        </span>
                        {en.location && (
                          <span className="flex items-center gap-1"><MapPin size={10} /> {en.location}</span>
                        )}
                      </div>
                      {en.objective && <p className="text-xs text-gray-600 mt-1 italic">{en.objective}</p>}
                      {en.notes && <p className="text-xs text-amber-700 mt-1 bg-amber-50 rounded px-2 py-1">{en.notes}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Noticias internas */}
        <div className="card p-6 md:col-span-2">
          <h3 className="font-serif font-bold text-navy text-lg flex items-center gap-2 mb-4">
            <Bell size={18} className="text-royal" /> Noticias internas
          </h3>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-7 h-7 border-2 border-royal/30 border-t-royal rounded-full animate-spin" />
            </div>
          ) : news.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Bell size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No hay noticias internas nuevas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {news.map(n => (
                <div key={n.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="font-serif font-bold text-navy text-sm mb-0.5">{n.title}</p>
                  <p className="text-xs text-gray-500 line-clamp-2">{n.excerpt}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Repertoire */}
        <div className="card p-6">
          <h3 className="font-serif font-bold text-navy text-lg flex items-center gap-2 mb-4">
            <Music size={18} className="text-royal" /> Repertorio
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            Las partituras aparecerán aquí una vez que el Director Musical las publique.
          </p>
          <div className="mt-4 p-3 bg-gradient-primary rounded-lg text-white text-sm">
            <p className="font-semibold mb-0.5">¿Necesitas algo?</p>
            <p className="text-blue-100 text-xs">Contacta al director en los ensayos o por los canales de la corporación.</p>
          </div>
        </div>

        {/* Info */}
        <div className="card p-6">
          <h3 className="font-serif font-bold text-navy text-lg mb-4">Información rápida</h3>
          <div className="space-y-3 text-sm">
            {[
              { label: 'Sede de ensayos', value: 'Cra. 48 #73–36, Campo Valdés' },
              { label: 'Contacto director', value: '319 773 5052' },
              { label: 'Email corporación', value: 'bandashowguardiareal\n@outlook.com' },
            ].map(({ label, value }) => (
              <div key={label} className="border-b border-gray-100 pb-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                <p className="text-dark whitespace-pre-line">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
