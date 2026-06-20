'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import {
  Music2, User, Phone, MapPin, Droplet, Shield, Plane, HeartPulse,
  IdCard, Calendar, Mail, Pencil, X, Save, Users2, ChevronRight, AlertCircle, PartyPopper,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getMiIntegrante, updateMiIntegrante, getRosterSeccion, storage,
  type IntegranteBase,
} from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import {
  SECCIONES_POR_FAMILIA, SECCIONES_LIST, getSeccion, seccionImage,
} from '@/lib/secciones'
import { camposFaltantes } from '@/lib/integrantes-utils'
import type { Integrante } from '@/types'
import { cn } from '@/lib/utils'

const TIPOS_DOC = ['CEDULA CIUDADANIA', 'TARJETA IDENTIDAD', 'PERMISO PERMANENCIA', 'CEDULA EXTRANJERIA', 'PASAPORTE']
const TIPOS_SANGRE = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']

export default function SeccionesPage() {
  const { profile } = useAuth()

  const [ficha,   setFicha]   = useState<Integrante | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [form,    setForm]    = useState<Partial<Integrante>>({})

  const [openSeccion, setOpenSeccion] = useState<string | null>(null)
  const [roster,      setRoster]      = useState<IntegranteBase[]>([])
  const [rosterLoad,  setRosterLoad]  = useState(false)

  const load = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    try {
      const mi = await getMiIntegrante(profile.uid)
      setFicha(mi)
      if (mi) setForm(mi)
    } catch {
      toast.error('No se pudo cargar tu ficha')
    } finally {
      setLoading(false)
    }
  }, [profile])

  useEffect(() => { load() }, [load])

  const openRoster = async (seccionKey: string) => {
    setOpenSeccion(seccionKey)
    setRosterLoad(true)
    try {
      setRoster(await getRosterSeccion(seccionKey))
    } catch {
      toast.error('No se pudo cargar el roster')
      setRoster([])
    } finally {
      setRosterLoad(false)
    }
  }

  const handleSave = async () => {
    if (!ficha) return
    if (!form.nombre?.trim() || !form.apellidos?.trim()) {
      toast.error('Nombre y apellidos son obligatorios'); return
    }
    if (!form.consentimientoDatos) {
      toast.error('Debes aceptar la autorización de tratamiento de datos para guardar'); return
    }
    setSaving(true)
    try {
      const patch: Partial<Integrante> = { ...form }
      // Sellar la fecha de consentimiento la primera vez que se acepta
      if (form.consentimientoDatos && !ficha.consentimientoFecha) {
        patch.consentimientoFecha = new Date().toISOString().slice(0, 10)
      }
      // mantener secciones en sincronía con la sección principal
      if (form.seccion) {
        const sec = getSeccion(form.seccion)
        patch.seccion = sec?.key ?? form.seccion
        patch.familia = sec?.familia ?? form.familia
        patch.secciones = sec ? [sec.key] : form.secciones
      }
      delete patch.id; delete patch.linkedUid; delete patch.createdAt; delete patch.updatedAt
      await updateMiIntegrante(ficha.id, profile!.uid, patch)
      toast.success('Tu información fue actualizada')
      setEditing(false)
      load()
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-navy text-2xl font-bold uppercase tracking-wider flex items-center gap-2">
          <Music2 size={22} className="text-royal" /> Secciones
        </h1>
        <p className="text-gray-400 text-sm mt-1">Explora las secciones de la banda y mantén tu información al día</p>
      </div>

      {/* ── Mi ficha ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-7 h-7 border-2 border-royal/30 border-t-royal rounded-full animate-spin" />
        </div>
      ) : !ficha ? (
        <div className="card border-l-4 border-gold p-5 mb-8 flex items-start gap-3">
          <AlertCircle size={20} className="text-gold shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-navy text-sm">Tu cuenta aún no está enlazada a una ficha de integrante</p>
            <p className="text-gray-500 text-sm mt-1">
              Si tu correo <strong>{profile?.email}</strong> está en el listado oficial de la banda,
              pídele al administrador que enlace tu ficha. Luego podrás ver y actualizar tus datos aquí.
            </p>
          </div>
        </div>
      ) : (
        <MiFicha
          ficha={ficha} editing={editing} saving={saving} form={form}
          setForm={setForm} setEditing={setEditing} onSave={handleSave}
        />
      )}

      {/* ── Cuadrícula de secciones por familia ──────────────────── */}
      <div className="space-y-8">
        {SECCIONES_POR_FAMILIA.map(({ familia, secciones }) => (
          <div key={familia.key}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{familia.emoji}</span>
              <h2 className="font-serif font-bold text-navy text-lg">{familia.label}</h2>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {secciones.map(sec => (
                <button
                  key={sec.key}
                  onClick={() => openRoster(sec.key)}
                  className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-navy text-left focus:outline-none focus:ring-2 focus:ring-gold"
                >
                  <SeccionCover slug={sec.slug} emoji={familia.emoji} />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="font-display text-white text-sm font-bold uppercase tracking-wide leading-tight">{sec.label}</p>
                    <p className="text-gold text-[11px] flex items-center gap-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      Ver integrantes <ChevronRight size={11} />
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Modal roster de sección ──────────────────────────────── */}
      {openSeccion && (
        <RosterModal
          seccionKey={openSeccion}
          roster={roster}
          loading={rosterLoad}
          onClose={() => setOpenSeccion(null)}
        />
      )}
    </div>
  )
}

// ── Sub-componente: Mi ficha ────────────────────────────────────────
function MiFicha({
  ficha, editing, saving, form, setForm, setEditing, onSave,
}: {
  ficha: Integrante
  editing: boolean
  saving: boolean
  form: Partial<Integrante>
  setForm: (f: Partial<Integrante>) => void
  setEditing: (b: boolean) => void
  onSave: () => void
}) {
  const sec = getSeccion(ficha.seccion)
  const set = (k: keyof Integrante, v: unknown) => setForm({ ...form, [k]: v })

  const faltan = camposFaltantes(ficha)

  if (!editing) {
    return (
      <div className="mb-8 space-y-3">
        {faltan.length > 0 && (
          <div className="card border-l-4 border-gold p-5 flex items-start gap-3 bg-gold/5">
            <PartyPopper size={20} className="text-gold shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-navy text-sm">¡Bienvenido(a), {ficha.nombre}! 🎉</p>
              <p className="text-gray-600 text-sm mt-1">
                Tu ficha ya está creada con los datos que diste al ingresar. Para completar tu registro,
                actualiza la información que falta: <strong>{faltan.join(', ')}</strong>.
              </p>
              <button onClick={() => setEditing(true)} className="btn btn-primary btn-sm mt-3">
                <Pencil size={14} /> Completar mis datos ahora
              </button>
            </div>
          </div>
        )}

      <div className="card p-6 border-l-4 border-royal">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-royal/10 overflow-hidden flex items-center justify-center shrink-0">
              {ficha.fotoURL ? <Image src={ficha.fotoURL} alt="" width={48} height={48} className="w-12 h-12 object-cover" /> : <User size={22} className="text-royal" />}
            </div>
            <div>
              <h2 className="font-serif font-bold text-navy text-lg leading-tight">{ficha.nombre} {ficha.apellidos}</h2>
              <p className="text-gray-400 text-sm">{sec?.label ?? ficha.seccion}</p>
            </div>
          </div>
          <button onClick={() => setEditing(true)} className="btn btn-primary btn-sm">
            <Pencil size={14} /> Actualizar
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-sm">
          <Dato icon={Mail}      label="Correo"      value={ficha.correo} />
          <Dato icon={Phone}     label="WhatsApp"    value={ficha.whatsapp} />
          <Dato icon={IdCard}    label="Documento"   value={ficha.numDoc ? `${ficha.tipoDoc} ${ficha.numDoc}` : ''} />
          <Dato icon={Calendar}  label="Nacimiento"  value={ficha.fechaNacimiento} />
          <Dato icon={MapPin}    label="Dirección"   value={ficha.direccion} />
          <Dato icon={Droplet}   label="Tipo sangre" value={ficha.tipoSangre} />
          <Dato icon={Shield}    label="EPS"         value={ficha.eps} />
          <Dato icon={Plane}     label="Pasaporte"   value={ficha.pasaporte ? 'Sí' : 'No'} />
          <Dato icon={HeartPulse} label="Emergencia" value={ficha.contactoEmergencia} />
        </div>
        {ficha.diagnostico && ficha.diagnostico.toLowerCase() !== 'no' && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <Dato icon={HeartPulse} label="Diagnóstico / medicamentos" value={ficha.diagnostico} />
          </div>
        )}
      </div>
      </div>
    )
  }

  return (
    <div className="card p-6 mb-8 border-l-4 border-gold">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif font-bold text-navy text-lg">Actualizar mi información</h2>
        <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-navy"><X size={18} /></button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Campo label="Nombre *"><input className="input" value={form.nombre ?? ''} onChange={e => set('nombre', e.target.value)} /></Campo>
        <Campo label="Apellidos *"><input className="input" value={form.apellidos ?? ''} onChange={e => set('apellidos', e.target.value)} /></Campo>
        <Campo label="Sección / instrumento">
          <select className="input" value={getSeccion(form.seccion)?.key ?? ''} onChange={e => set('seccion', e.target.value)}>
            {SECCIONES_LIST.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </Campo>
        <Campo label="WhatsApp"><input className="input" value={form.whatsapp ?? ''} onChange={e => set('whatsapp', e.target.value)} placeholder="3001234567" /></Campo>
        <Campo label="Tipo de documento">
          <select className="input" value={form.tipoDoc ?? ''} onChange={e => set('tipoDoc', e.target.value)}>
            <option value="">—</option>
            {TIPOS_DOC.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Campo>
        <Campo label="Número de documento"><input className="input" value={form.numDoc ?? ''} onChange={e => set('numDoc', e.target.value)} /></Campo>
        <Campo label="Fecha de nacimiento"><input className="input" type="date" value={toDateInput(form.fechaNacimiento)} onChange={e => set('fechaNacimiento', e.target.value)} /></Campo>
        <Campo label="Tipo de sangre">
          <select className="input" value={form.tipoSangre ?? ''} onChange={e => set('tipoSangre', e.target.value)}>
            <option value="">—</option>
            {TIPOS_SANGRE.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Campo>
        <Campo label="EPS"><input className="input" value={form.eps ?? ''} onChange={e => set('eps', e.target.value)} /></Campo>
        <Campo label="¿Tiene pasaporte?">
          <select className="input" value={form.pasaporte ? 'si' : 'no'} onChange={e => set('pasaporte', e.target.value === 'si')}>
            <option value="no">No</option>
            <option value="si">Sí</option>
          </select>
        </Campo>
        <Campo label="Dirección de residencia" full><input className="input" value={form.direccion ?? ''} onChange={e => set('direccion', e.target.value)} /></Campo>
        <Campo label="Contacto de emergencia (nombre / parentesco / teléfono)" full>
          <input className="input" value={form.contactoEmergencia ?? ''} onChange={e => set('contactoEmergencia', e.target.value)} />
        </Campo>
        <Campo label="Diagnóstico médico / medicamentos (si aplica)" full>
          <textarea className="input resize-none" rows={2} value={form.diagnostico ?? ''} onChange={e => set('diagnostico', e.target.value)} placeholder="Describe brevemente o escribe 'No'" />
        </Campo>

        {/* Foto de perfil */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-dark mb-1">Foto de perfil <span className="font-normal text-gray-400">(opcional)</span></label>
          <FotoUpload integranteId={ficha.id} current={form.fotoURL} onUploaded={url => set('fotoURL', url)} />
        </div>

        {/* Consentimiento de datos */}
        <label className="sm:col-span-2 flex items-start gap-2.5 p-3 rounded-xl border border-gray-200 cursor-pointer hover:border-royal/40">
          <input type="checkbox" checked={!!form.consentimientoDatos}
            onChange={e => set('consentimientoDatos', e.target.checked)}
            className="w-4 h-4 accent-royal mt-0.5 shrink-0" />
          <span className="text-xs text-gray-600 leading-relaxed">
            Autorizo a la Corporación Musical Guardia Real de Antioquia el tratamiento de mis datos personales
            (incluidos datos sensibles de salud) para fines administrativos, logísticos y de la actividad de la banda,
            conforme a la Ley 1581 de 2012 (Habeas Data). <strong>Obligatorio</strong>.
          </span>
        </label>
      </div>
      <div className="flex gap-3 mt-5">
        <button onClick={onSave} disabled={saving} className="btn btn-primary btn-md disabled:opacity-60">
          <Save size={15} /> {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        <button onClick={() => setEditing(false)} className="btn btn-ghost btn-md">Cancelar</button>
      </div>
      <p className="text-xs text-gray-400 mt-3 flex items-start gap-1.5">
        <Shield size={13} className="shrink-0 mt-0.5" />
        Tus datos sensibles (documento, dirección, salud) solo son visibles para ti y la administración.
      </p>
    </div>
  )
}

function RosterModal({ seccionKey, roster, loading, onClose }: {
  seccionKey: string; roster: IntegranteBase[]; loading: boolean; onClose: () => void
}) {
  const sec = getSeccion(seccionKey)
  return (
    <div className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="relative h-32 bg-navy shrink-0">
          <Image src={seccionImage(sec?.slug ?? '')} alt={sec?.label ?? ''} fill className="object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy to-transparent" />
          <button onClick={onClose} className="absolute top-3 right-3 text-white/80 hover:text-white bg-white/10 rounded-full p-1.5"><X size={18} /></button>
          <div className="absolute bottom-3 left-4">
            <p className="font-display text-white text-xl font-bold uppercase tracking-wide">{sec?.label ?? seccionKey}</p>
            <p className="text-gold text-xs flex items-center gap-1"><Users2 size={12} /> {roster.length} integrante(s)</p>
          </div>
        </div>
        <div className="p-4 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-royal/30 border-t-royal rounded-full animate-spin" /></div>
          ) : roster.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">Aún no hay integrantes registrados en esta sección.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {roster.map(m => (
                <li key={m.id} className="flex items-center gap-3 py-2.5">
                  <div className="w-9 h-9 rounded-full bg-royal/10 flex items-center justify-center text-royal text-sm font-bold shrink-0">
                    {(m.nombre[0] ?? '?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark truncate">{m.nombre} {m.apellidos}</p>
                    {m.whatsapp && (
                      <a href={`https://wa.me/57${m.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-royal hover:underline flex items-center gap-1">
                        <Phone size={10} /> {m.whatsapp}
                      </a>
                    )}
                  </div>
                  {m.linkedUid && <span className="text-[10px] bg-green-100 text-green-700 rounded-full px-2 py-0.5 font-medium">con cuenta</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

/** Subida de foto de perfil del integrante a Firebase Storage. */
function FotoUpload({ integranteId, current, onUploaded }: { integranteId: string; current?: string; onUploaded: (url: string) => void }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Solo imágenes'); return }
    setUploading(true)
    try {
      const storageRef = ref(storage, `integrantes/${integranteId}/${Date.now()}_${file.name.replace(/\s/g, '_')}`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      onUploaded(url)
      toast.success('Foto subida')
    } catch {
      toast.error('No se pudo subir la foto')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div className="w-14 h-14 rounded-full bg-royal/10 overflow-hidden flex items-center justify-center shrink-0">
        {current ? <Image src={current} alt="" width={56} height={56} className="w-14 h-14 object-cover" /> : <User size={22} className="text-royal" />}
      </div>
      <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="btn btn-ghost btn-sm disabled:opacity-60">
        {uploading ? 'Subiendo...' : current ? 'Cambiar foto' : 'Subir foto'}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handle} />
    </div>
  )
}

/** Portada de sección: muestra la foto si existe, si no un degradado + emoji. */
function SeccionCover({ slug, emoji }: { slug: string; emoji: string }) {
  const [ok, setOk] = useState(true)
  return (
    <>
      {/* Base siempre visible */}
      <div className="absolute inset-0 bg-gradient-to-br from-royal/60 to-navy flex items-center justify-center">
        <span className="text-4xl opacity-40 group-hover:scale-110 transition-transform">{emoji}</span>
      </div>
      {ok && (
        <Image
          src={seccionImage(slug)}
          alt=""
          fill
          onError={() => setOk(false)}
          className="object-cover opacity-70 group-hover:opacity-85 group-hover:scale-105 transition-all duration-500"
          sizes="(max-width: 640px) 50vw, 25vw"
        />
      )}
    </>
  )
}

function Dato({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2">
      <Icon size={14} className="text-gray-400 shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-[11px] text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-dark break-words">{value}</p>
      </div>
    </div>
  )
}

function Campo({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={cn(full && 'sm:col-span-2')}>
      <label className="block text-xs font-semibold text-dark mb-1">{label}</label>
      {children}
    </div>
  )
}

/** Convierte texto de fecha a valor válido para <input type=date> (YYYY-MM-DD). */
function toDateInput(v?: string): string {
  if (!v) return ''
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  const dmy = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
  return ''
}
