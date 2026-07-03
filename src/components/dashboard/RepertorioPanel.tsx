'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import {
  Music, FileText, Download, Eye, X, Plus, Upload, Trash2, Pencil,
  Music2, Gauge, Clock, KeyRound, Hash, User, ListMusic, Play, Search,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getRepertorio, createTema, updateTema, deleteTema, subirPartitura, quitarPartitura,
  getMiIntegrante,
} from '@/lib/firebase'
import {
  REPERTORIO_SEED, REPERTORIO_SEMANA_SANTA, INSTRUMENTOS_PARTITURA, FAMILIAS_PARTITURA, getInstrumentoPartitura,
} from '@/lib/repertorio'
import { getSeccion } from '@/lib/secciones'
import type { Tema, Partitura, UserRole } from '@/types'
import { cn } from '@/lib/utils'

const puedeGestionar = (role: UserRole) => role === 'admin' || role === 'director'

const DIFICULTAD_COLOR: Record<string, string> = {
  'Básico':     'bg-green-100 text-green-700',
  'Intermedio': 'bg-amber-100 text-amber-700',
  'Avanzado':   'bg-red-100 text-red-700',
}

export default function RepertorioPanel({ role }: { role: UserRole }) {
  const { profile } = useAuth()
  const [dynTemas, setDynTemas] = useState<Tema[]>([])
  const [loading, setLoading] = useState(true)
  const [importando, setImportando] = useState(false)
  const [abierto, setAbierto] = useState<Tema | null>(null)
  const [creando, setCreando] = useState(false)
  const [search,  setSearch]  = useState('')
  const [miSeccion, setMiSeccion] = useState<string>('')
  const [categoria, setCategoria] = useState<'temporada' | 'semana-santa'>('temporada')

  const load = useCallback(async () => {
    setLoading(true)
    try { setDynTemas(await getRepertorio()) }
    catch { toast.error('No se pudo cargar el repertorio'); setDynTemas([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const dynCat = useMemo(() => dynTemas.filter(t => (t.categoria ?? 'temporada') === categoria), [dynTemas, categoria])
  const seedFaltantes = useMemo(() => {
    const seed = categoria === 'temporada' ? REPERTORIO_SEED : REPERTORIO_SEMANA_SANTA
    return seed.filter(s => !dynCat.some(d => d.titulo.trim().toLowerCase() === s.titulo.trim().toLowerCase()))
  }, [categoria, dynCat])
  const temas = useMemo(
    () => [...dynCat, ...seedFaltantes].sort((a, b) => (a.numeroMarcacion ?? 999) - (b.numeroMarcacion ?? 999)),
    [dynCat, seedFaltantes],
  )

  useEffect(() => {
    if (!profile) return
    getMiIntegrante(profile.uid).then(f => { if (f?.seccion) setMiSeccion(f.seccion) }).catch(() => {})
  }, [profile])

  const gestiona = puedeGestionar(role)

  const importarSeed = async () => {
    if (!profile) return
    setImportando(true)
    try {
      for (const s of seedFaltantes) {
        const { id, esSeed, createdAt, updatedAt, ...datos } = s
        void id; void esSeed; void createdAt; void updatedAt
        await createTema(datos, profile.uid)
      }
      toast.success(`${seedFaltantes.length} tema(s) del repertorio cargados a la base`)
      load()
    } catch { toast.error('No se pudo importar el repertorio') }
    finally { setImportando(false) }
  }

  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    if (!q) return temas
    return temas.filter(t => `${t.numeroMarcacion ?? ''} ${t.titulo} ${t.compositor} ${t.genero}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(q))
  }, [temas, search])

  return (
    <div>
      {/* Encabezado */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy to-[#0a2350] p-6 sm:p-8 mb-6">
        <div className="absolute -right-6 -bottom-6 opacity-10">
          <Image src="/images/escudo.png" alt="" width={160} height={160} className="object-contain" />
        </div>
        <div className="absolute right-4 top-4 opacity-90 hidden sm:block">
          <Image src="/images/mascota.png" alt="Mascota Guardia Real" width={72} height={72} className="object-contain drop-shadow-lg" />
        </div>
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-gold/15 border border-gold/30 text-gold text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
            <ListMusic size={12} /> Repertorio de la banda
          </div>
          <h2 className="font-display text-white text-2xl sm:text-3xl font-bold uppercase tracking-wider">Partituras</h2>
          <p className="text-gray-300 text-sm mt-1 max-w-lg">
            Consulta las canciones de la Guardia Real, sus datos y descarga la partitura de tu instrumento.
          </p>
        </div>
      </div>

      {/* Categorías */}
      <div className="flex gap-2 mb-5">
        <button onClick={() => setCategoria('temporada')}
          className={cn('px-4 py-2 rounded-full text-sm font-semibold transition-all',
            categoria === 'temporada' ? 'bg-navy text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:border-navy')}>
          🎺 Repertorio 2026
        </button>
        <button onClick={() => setCategoria('semana-santa')}
          className={cn('px-4 py-2 rounded-full text-sm font-semibold transition-all',
            categoria === 'semana-santa' ? 'bg-[#5b2a86] text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:border-[#5b2a86]')}>
          ✝️ Semana Santa
        </button>
      </div>

      {/* Barra */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" placeholder="Buscar por número, título o compositor..." />
        </div>
        {gestiona && seedFaltantes.length > 0 && (
          <button onClick={importarSeed} disabled={importando} className="btn btn-ghost btn-md disabled:opacity-60">
            <Download size={16} /> {importando ? 'Cargando...' : `Cargar ${categoria === 'temporada' ? 'repertorio 2026' : 'Semana Santa'} (${seedFaltantes.length})`}
          </button>
        )}
        {gestiona && (
          <button onClick={() => setCreando(true)} className="btn btn-primary btn-md">
            <Plus size={16} /> Agregar tema
          </button>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="w-7 h-7 border-2 border-royal/30 border-t-royal rounded-full animate-spin" /></div>
      ) : filtrados.length === 0 ? (
        <div className="card text-center py-16">
          <Image src="/images/mascota.png" alt="" width={80} height={80} className="mx-auto mb-3 opacity-70" />
          <p className="text-gray-500 text-sm">{temas.length === 0 ? 'Aún no hay temas en el repertorio.' : 'Sin resultados para tu búsqueda.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.map(t => <TemaCard key={t.id} tema={t} onClick={() => setAbierto(t)} />)}
        </div>
      )}

      {abierto && (
        <TemaDetalle
          tema={abierto} role={role} miSeccion={miSeccion} uid={profile?.uid ?? ''}
          onClose={() => setAbierto(null)}
          onChanged={() => { load(); setAbierto(null) }}
        />
      )}
      {creando && (
        <TemaFormModal uid={profile?.uid ?? ''} onClose={() => setCreando(false)} onSaved={() => { setCreando(false); load() }} />
      )}
    </div>
  )
}

// ── Tarjeta de tema ─────────────────────────────────────────────────
function TemaCard({ tema, onClick }: { tema: Tema; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="group text-left card p-0 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all border-t-4 border-gold">
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-navy flex flex-col items-center justify-center shrink-0 shadow-inner">
            <span className="text-gold text-[8px] font-bold uppercase leading-none">N.º</span>
            <span className="text-white font-display text-lg font-bold leading-none">{tema.numeroMarcacion ?? '—'}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-serif font-bold text-navy text-lg leading-tight group-hover:text-royal transition-colors">{tema.titulo}</h3>
            <p className="text-gray-400 text-xs flex items-center gap-1"><User size={11} /> {tema.compositor}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tema.genero && <Chip>{tema.genero}</Chip>}
          {tema.tonalidad && <Chip>{tema.tonalidad}</Chip>}
          {tema.dificultad && <span className={cn('text-[10px] rounded-full px-2 py-0.5 font-medium', DIFICULTAD_COLOR[tema.dificultad] ?? 'bg-gray-100 text-gray-500')}>{tema.dificultad}</span>}
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
          <span className="flex items-center gap-1"><FileText size={12} className="text-royal" /> {tema.partituras.length} partituras</span>
          <span className="text-royal font-medium group-hover:underline">Ver detalle →</span>
        </div>
      </div>
    </button>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="text-[10px] bg-navy/8 text-navy rounded-full px-2 py-0.5 font-medium">{children}</span>
}

// ── Detalle del tema ────────────────────────────────────────────────
function TemaDetalle({ tema, role, miSeccion, uid, onClose, onChanged }: {
  tema: Tema; role: UserRole; miSeccion: string; uid: string; onClose: () => void; onChanged: () => void
}) {
  const gestiona = puedeGestionar(role) && !tema.esSeed
  const [subiendo, setSubiendo] = useState(false)
  const [editando, setEditando] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [instrSel, setInstrSel] = useState('flauta')

  const miFamilia = getSeccion(miSeccion)?.familia
  const partiturasPorFamilia = useMemo(() => {
    const grupos: Record<string, Partitura[]> = {}
    for (const p of tema.partituras) {
      const fam = getInstrumentoPartitura(p.instrumento)?.familia ?? 'otro'
      ;(grupos[fam] ??= []).push(p)
    }
    return grupos
  }, [tema.partituras])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    if (file.type !== 'application/pdf') { toast.error('La partitura debe ser un PDF'); return }
    setSubiendo(true)
    try {
      await subirPartitura(tema.id, instrSel, file)
      toast.success('Partitura subida')
      onChanged()
    } catch { toast.error('No se pudo subir la partitura') }
    finally { setSubiendo(false); if (fileRef.current) fileRef.current.value = '' }
  }

  const handleQuitar = async (p: Partitura) => {
    if (!confirm(`¿Quitar la partitura de ${getInstrumentoPartitura(p.instrumento)?.label ?? p.instrumento}?`)) return
    try { await quitarPartitura(tema.id, tema.partituras, p.url); toast.success('Partitura quitada'); onChanged() }
    catch { toast.error('Error al quitar') }
  }

  const handleBorrarTema = async () => {
    if (!confirm(`¿Eliminar el tema "${tema.titulo}" y sus partituras del listado?`)) return
    try { await deleteTema(tema.id); toast.success('Tema eliminado'); onChanged() }
    catch { toast.error('Error al eliminar') }
  }

  if (editando) {
    return <TemaFormModal tema={tema} uid={uid} onClose={() => setEditando(false)} onSaved={onChanged} />
  }

  return (
    <div className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Hero */}
        <div className="relative bg-gradient-to-br from-navy via-navy to-[#0a2350] p-6 sm:p-7">
          <div className="absolute -right-4 -bottom-6 opacity-10"><Image src="/images/escudo.png" alt="" width={150} height={150} /></div>
          <button onClick={onClose} className="absolute top-3 right-3 text-white/70 hover:text-white bg-white/10 rounded-full p-1.5 z-10"><X size={18} /></button>
          <div className="relative flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gold flex flex-col items-center justify-center shrink-0">
              <span className="text-navy text-[9px] font-bold uppercase leading-none">Marcación</span>
              <span className="text-navy font-display text-2xl font-bold leading-none">{tema.numeroMarcacion ?? '—'}</span>
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-white text-2xl font-bold uppercase tracking-wide leading-tight">{tema.titulo}</h2>
              <p className="text-gold text-sm mt-0.5">{tema.compositor}{tema.arreglista ? ` · arr. ${tema.arreglista}` : ''}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Datos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
            <Dato icon={Music2}  label="Género"     value={tema.genero} />
            <Dato icon={KeyRound} label="Tonalidad" value={tema.tonalidad} />
            <Dato icon={Hash}    label="Compás"     value={tema.compas} />
            <Dato icon={Gauge}   label="Tempo"      value={tema.tempo} />
            <Dato icon={Clock}   label="Duración"   value={tema.duracion} />
            <Dato icon={Music}   label="Dificultad" value={tema.dificultad} />
          </div>
          {tema.notas && <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 mb-5 italic">{tema.notas}</p>}
          {tema.audioUrl && (
            <a href={tema.audioUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm mb-5"><Play size={14} /> Escuchar referencia</a>
          )}

          {/* Partituras */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif font-bold text-navy text-lg flex items-center gap-2"><FileText size={18} className="text-royal" /> Partituras</h3>
            <span className="text-xs text-gray-400">{tema.partituras.length} archivos</span>
          </div>

          {tema.partituras.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Este tema aún no tiene partituras cargadas.</p>
          ) : (
            <div className="space-y-4">
              {Object.keys(FAMILIAS_PARTITURA).filter(f => partiturasPorFamilia[f]?.length).map(fam => (
                <div key={fam}>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">{FAMILIAS_PARTITURA[fam].emoji} {FAMILIAS_PARTITURA[fam].label}</p>
                  <div className="space-y-1.5">
                    {partiturasPorFamilia[fam].map(p => {
                      const info = getInstrumentoPartitura(p.instrumento)
                      const esMio = miFamilia && info?.familia === miFamilia
                      return (
                        <div key={p.url} className={cn('flex items-center gap-2 p-2.5 rounded-xl border transition-colors',
                          esMio ? 'border-gold/50 bg-gold/5' : 'border-gray-100 hover:border-gray-200')}>
                          <FileText size={16} className="text-royal shrink-0" />
                          <span className="text-sm font-medium text-dark flex-1 truncate">
                            {p.label ?? info?.label ?? p.instrumento}
                            {esMio && <span className="ml-2 text-[9px] bg-gold text-navy rounded-full px-1.5 py-0.5 font-bold uppercase">Tu sección</span>}
                          </span>
                          <a href={p.url} target="_blank" rel="noopener noreferrer" title="Ver" className="w-8 h-8 rounded-lg bg-navy/8 text-navy hover:bg-navy hover:text-white flex items-center justify-center transition-colors"><Eye size={14} /></a>
                          <a href={p.url} download title="Descargar" className="w-8 h-8 rounded-lg bg-gold/15 text-amber-700 hover:bg-gold hover:text-navy flex items-center justify-center transition-colors"><Download size={14} /></a>
                          {gestiona && <button onClick={() => handleQuitar(p)} title="Quitar" className="w-8 h-8 rounded-lg text-red-400 hover:bg-red-50 flex items-center justify-center"><Trash2 size={13} /></button>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Controles de gestión */}
          {gestiona && (
            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Subir partitura (PDF)</p>
              <div className="flex flex-wrap items-center gap-2">
                <select value={instrSel} onChange={e => setInstrSel(e.target.value)} className="input max-w-[200px]">
                  {INSTRUMENTOS_PARTITURA.map(i => <option key={i.key} value={i.key}>{i.label}</option>)}
                </select>
                <button onClick={() => fileRef.current?.click()} disabled={subiendo} className="btn btn-primary btn-sm disabled:opacity-60">
                  <Upload size={14} /> {subiendo ? 'Subiendo...' : 'Subir PDF'}
                </button>
                <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={handleUpload} />
                <div className="ml-auto flex gap-2">
                  <button onClick={() => setEditando(true)} className="btn btn-ghost btn-sm"><Pencil size={13} /> Editar datos</button>
                  <button onClick={handleBorrarTema} className="btn btn-ghost btn-sm text-red-500 hover:bg-red-50"><Trash2 size={13} /> Eliminar</button>
                </div>
              </div>
            </div>
          )}
          {tema.esSeed && puedeGestionar(role) && (
            <p className="mt-4 text-[11px] text-gray-400 text-center">Este es un tema base del sistema; para cambiarlo, crea una versión nueva y edítala.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function Dato({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  if (!value) return null
  return (
    <div className="bg-gray-50 rounded-xl p-2.5">
      <p className="text-[10px] text-gray-400 uppercase tracking-wide flex items-center gap-1"><Icon size={11} /> {label}</p>
      <p className="text-dark text-sm font-semibold mt-0.5">{value}</p>
    </div>
  )
}

// ── Formulario de tema (crear/editar) ──────────────────────────────
function TemaFormModal({ tema, uid, onClose, onSaved }: {
  tema?: Tema; uid: string; onClose: () => void; onSaved: () => void
}) {
  const [f, setF] = useState<Partial<Tema>>(tema ?? {
    titulo: '', compositor: '', arreglista: '', genero: '', tonalidad: '', compas: '',
    tempo: '', duracion: '', ano: '', dificultad: 'Intermedio', notas: '', audioUrl: '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k: keyof Tema, v: unknown) => setF(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!f.titulo?.trim()) { toast.error('El título es obligatorio'); return }
    setSaving(true)
    try {
      const data: Partial<Tema> = {
        ...f,
        numeroMarcacion: f.numeroMarcacion ? Number(f.numeroMarcacion) : undefined,
      }
      if (tema) await updateTema(tema.id, data, uid)
      else await createTema(data, uid)
      toast.success(tema ? 'Tema actualizado' : 'Tema creado. Ahora súbele las partituras.')
      onSaved()
    } catch { toast.error('Error al guardar') } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif font-bold text-navy text-lg">{tema ? 'Editar tema' : 'Nuevo tema'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-navy"><X size={18} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <F label="N.º de marcación"><input className="input" type="number" value={f.numeroMarcacion ?? ''} onChange={e => set('numeroMarcacion', e.target.value)} /></F>
          <F label="Título *"><input className="input" value={f.titulo ?? ''} onChange={e => set('titulo', e.target.value)} /></F>
          <F label="Compositor"><input className="input" value={f.compositor ?? ''} onChange={e => set('compositor', e.target.value)} /></F>
          <F label="Arreglista"><input className="input" value={f.arreglista ?? ''} onChange={e => set('arreglista', e.target.value)} /></F>
          <F label="Género"><input className="input" value={f.genero ?? ''} onChange={e => set('genero', e.target.value)} placeholder="Mambo, salsa, himno..." /></F>
          <F label="Tonalidad"><input className="input" value={f.tonalidad ?? ''} onChange={e => set('tonalidad', e.target.value)} placeholder="Mi♭ mayor" /></F>
          <F label="Compás"><input className="input" value={f.compas ?? ''} onChange={e => set('compas', e.target.value)} placeholder="2/2, 4/4..." /></F>
          <F label="Tempo"><input className="input" value={f.tempo ?? ''} onChange={e => set('tempo', e.target.value)} placeholder="≈ 190 BPM" /></F>
          <F label="Duración"><input className="input" value={f.duracion ?? ''} onChange={e => set('duracion', e.target.value)} placeholder="≈ 2:30 min" /></F>
          <F label="Dificultad">
            <select className="input" value={f.dificultad ?? ''} onChange={e => set('dificultad', e.target.value)}>
              <option value="">—</option><option>Básico</option><option>Intermedio</option><option>Avanzado</option>
            </select>
          </F>
          <F label="Audio de referencia (enlace)" full><input className="input" value={f.audioUrl ?? ''} onChange={e => set('audioUrl', e.target.value)} placeholder="https://youtube.com/..." /></F>
          <F label="Notas" full><textarea className="input resize-none" rows={2} value={f.notas ?? ''} onChange={e => set('notas', e.target.value)} /></F>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={save} disabled={saving} className="btn btn-primary btn-md disabled:opacity-60">{saving ? 'Guardando...' : (tema ? 'Guardar' : 'Crear tema')}</button>
          <button onClick={onClose} className="btn btn-ghost btn-md">Cancelar</button>
        </div>
      </div>
    </div>
  )
}

function F({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return <div className={cn(full && 'col-span-2')}><label className="block text-xs font-semibold text-dark mb-1">{label}</label>{children}</div>
}
