'use client'

import { useState, useEffect } from 'react'
import { Music, Plus, Calendar, BookOpen, Upload } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { createEvent } from '@/lib/firebase'
import { toast } from 'sonner'

const MOCK_REPERTOIRE = [
  { id: '1', title: 'Colombia Tierra Querida', genre: 'Porro', level: 'avanzado', composer: 'Lucho Bermúdez' },
  { id: '2', title: 'La Pollera Colorá',       genre: 'Cumbia',level: 'intermedio', composer: 'Traditional' },
  { id: '3', title: 'Cumbia Sampuesana',       genre: 'Cumbia',level: 'básico',  composer: 'Pacho Galán' },
]

export default function DirectorPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [showEventForm, setShowEventForm] = useState(false)

  useEffect(() => {
    if (profile && profile.role !== 'director' && profile.role !== 'admin') {
      router.replace('/dashboard')
    }
  }, [profile, router])
  const [eventData, setEventData] = useState({ title: '', date: '', startTime: '', location: '', type: 'ensayo' })

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createEvent({ ...eventData, visibleTo: ['admin', 'director', 'integrante'], createdBy: profile?.uid })
      toast.success('Evento creado correctamente')
      setShowEventForm(false)
      setEventData({ title: '', date: '', startTime: '', location: '', type: 'ensayo' })
    } catch {
      toast.error('Error al crear el evento')
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-navy text-2xl font-bold uppercase tracking-wider">
            Director Musical
          </h1>
          <p className="text-gray-400 text-sm mt-1">Gestiona el repertorio y los ensayos</p>
        </div>
        <button onClick={() => setShowEventForm(!showEventForm)} className="btn btn-primary btn-md">
          <Plus size={16} /> Nuevo ensayo
        </button>
      </div>

      {/* New event form */}
      {showEventForm && (
        <div className="card p-6 mb-6 border-l-4 border-royal">
          <h3 className="font-serif font-bold text-navy text-lg mb-4">Programar ensayo / evento</h3>
          <form onSubmit={handleCreateEvent} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-dark mb-1.5">Título del evento *</label>
              <input value={eventData.title} onChange={e => setEventData({...eventData, title: e.target.value})}
                className="input" placeholder="Ej. Ensayo general — Desfile Silleteros" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark mb-1.5">Tipo</label>
              <select value={eventData.type} onChange={e => setEventData({...eventData, type: e.target.value})} className="input">
                <option value="ensayo">Ensayo</option>
                <option value="presentacion">Presentación</option>
                <option value="concurso">Concurso</option>
                <option value="reunion">Reunión</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark mb-1.5">Hora de inicio</label>
              <input type="time" value={eventData.startTime} onChange={e => setEventData({...eventData, startTime: e.target.value})} className="input" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark mb-1.5">Fecha *</label>
              <input type="date" value={eventData.date} onChange={e => setEventData({...eventData, date: e.target.value})} className="input" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark mb-1.5">Lugar *</label>
              <input value={eventData.location} onChange={e => setEventData({...eventData, location: e.target.value})} className="input" placeholder="Sede, dirección..." required />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" className="btn btn-primary btn-md">Programar evento</button>
              <button type="button" onClick={() => setShowEventForm(false)} className="btn btn-ghost btn-md">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Repertoire */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-bold text-navy text-lg flex items-center gap-2">
              <Music size={18} className="text-royal" /> Repertorio activo
            </h3>
            <button className="btn btn-outline btn-sm">
              <Plus size={14} /> Agregar
            </button>
          </div>
          <div className="space-y-3">
            {MOCK_REPERTOIRE.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-navy/10 flex items-center justify-center">
                    <BookOpen size={14} className="text-navy" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-dark">{r.title}</p>
                    <p className="text-xs text-gray-400">{r.genre} · {r.composer}</p>
                  </div>
                </div>
                <span className={`badge text-xs ${r.level === 'avanzado' ? 'bg-red-100 text-red-700' : r.level === 'intermedio' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                  {r.level}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Upload scores */}
        <div className="card p-6">
          <h3 className="font-serif font-bold text-navy text-lg flex items-center gap-2 mb-4">
            <Upload size={18} className="text-royal" /> Subir partituras
          </h3>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-royal transition-colors cursor-pointer">
            <Upload size={28} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-600 mb-1">Arrastra archivos o haz clic</p>
            <p className="text-xs text-gray-400">PDF, MusicXML hasta 20MB</p>
          </div>
          <div className="mt-4 p-3 bg-navy/5 rounded-lg">
            <p className="text-xs font-bold text-navy uppercase tracking-wider mb-1">Consejo</p>
            <p className="text-xs text-gray-500">Las partituras subidas estarán disponibles para todos los integrantes en su portal personal.</p>
          </div>
        </div>

        {/* Upcoming events */}
        <div className="card p-6 lg:col-span-2">
          <h3 className="font-serif font-bold text-navy text-lg flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-royal" /> Próximos ensayos y eventos
          </h3>
          <p className="text-sm text-gray-400 text-center py-8">
            Los eventos programados aparecerán aquí. Usa el botón "Nuevo ensayo" para crear el primero.
          </p>
        </div>
      </div>
    </div>
  )
}
