'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import {
  User, Phone, MapPin, Droplet, Shield, Plane, HeartPulse,
  IdCard, Calendar, Mail, Pencil, X, Save, AlertCircle, PartyPopper,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getMiIntegrante, updateMiIntegrante, createMiFicha, storage } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { SECCIONES_LIST, getSeccion } from '@/lib/secciones'
import { camposFaltantes } from '@/lib/integrantes-utils'
import type { Integrante } from '@/types'
import { cn } from '@/lib/utils'
import CarneIntegrante from '@/components/dashboard/CarneIntegrante'

const TIPOS_DOC = ['CEDULA CIUDADANIA', 'TARJETA IDENTIDAD', 'PERMISO PERMANENCIA', 'CEDULA EXTRANJERIA', 'PASAPORTE']
const TIPOS_SANGRE = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']

/** Ficha del integrante: ver y actualizar sus propios datos. Autónomo. */
export default function MiFichaIntegrante() {
  const { profile } = useAuth()
  const [ficha,   setFicha]   = useState<Integrante | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [creating, setCreating] = useState(false)
  const [showCarne, setShowCarne] = useState(false)
  const [form,    setForm]    = useState<Partial<Integrante>>({})

  const load = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    try {
      const mi = await getMiIntegrante(profile.uid)
      setFicha(mi)
      if (mi) setForm(mi)
    } catch { toast.error('No se pudo cargar tu ficha') }
    finally { setLoading(false) }
  }, [profile])

  useEffect(() => { load() }, [load])

  const set = (k: keyof Integrante, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!ficha || !profile) return
    if (!form.nombre?.trim() || !form.apellidos?.trim()) { toast.error('Nombre y apellidos son obligatorios'); return }
    if (!form.consentimientoDatos) { toast.error('Debes aceptar la autorización de tratamiento de datos para guardar'); return }
    setSaving(true)
    try {
      const patch: Partial<Integrante> = { ...form }
      if (form.consentimientoDatos && !ficha.consentimientoFecha) patch.consentimientoFecha = new Date().toISOString().slice(0, 10)
      if (form.seccion) { const sec = getSeccion(form.seccion); patch.seccion = sec?.key ?? form.seccion; patch.familia = sec?.familia ?? form.familia; patch.secciones = sec ? [sec.key] : form.secciones }
      delete patch.id; delete patch.linkedUid; delete patch.createdAt; delete patch.updatedAt
      await updateMiIntegrante(ficha.id, profile.uid, patch)
      toast.success('Tu información fue actualizada')
      setEditing(false)
      load()
    } catch { toast.error('Error al guardar') }
    finally { setSaving(false) }
  }

  const handleCrearFicha = async () => {
    if (!profile) return
    setCreating(true)
    try {
      await createMiFicha(profile.uid, profile.displayName ?? profile.email, profile.email)
      toast.success('Tu ficha fue creada. Ahora completa tus datos.')
      load()
    } catch { toast.error('No se pudo crear tu ficha, intenta de nuevo') }
    finally { setCreating(false) }
  }

  if (loading) return <div className="flex items-center justify-center py-12"><div className="w-7 h-7 border-2 border-royal/30 border-t-royal rounded-full animate-spin" /></div>

  if (!ficha) {
    return (
      <div className="card border-l-4 border-royal p-5 flex items-start gap-3">
        <AlertCircle size={20} className="text-royal shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-navy text-sm">Aún no tienes una ficha de integrante</p>
          <p className="text-gray-500 text-sm mt-1">
            Crea tu ficha para que aparezcas en el roster de tu sección y puedas
            mantener tus datos al día.
          </p>
          <button onClick={handleCrearFicha} disabled={creating} className="btn btn-primary btn-sm mt-3 disabled:opacity-60">
            <PartyPopper size={14} /> {creating ? 'Creando...' : 'Crear mi ficha'}
          </button>
        </div>
      </div>
    )
  }

  const sec = getSeccion(ficha.seccion)
  const faltan = camposFaltantes(ficha)

  // ── Vista ──────────────────────────────────────────────────────
  if (!editing) {
    return (
      <div className="space-y-3">
        {faltan.length > 0 && (
          <div className="card border-l-4 border-gold p-5 flex items-start gap-3 bg-gold/5">
            <PartyPopper size={20} className="text-gold shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-navy text-sm">¡Bienvenido(a), {ficha.nombre}! 🎉</p>
              <p className="text-gray-600 text-sm mt-1">
                Para completar tu registro, actualiza la información que falta: <strong>{faltan.join(', ')}</strong>.
              </p>
              <button onClick={() => setEditing(true)} className="btn btn-primary btn-sm mt-3"><Pencil size={14} /> Completar mis datos ahora</button>
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
            <div className="flex gap-2">
              <button onClick={() => setShowCarne(true)} className="btn btn-ghost btn-sm"><IdCard size={14} /> Ver carné</button>
              <button onClick={() => setEditing(true)} className="btn btn-primary btn-sm"><Pencil size={14} /> Actualizar</button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-sm">
            <Dato icon={Mail}       label="Correo"      value={ficha.correo} />
            <Dato icon={Phone}      label="WhatsApp"    value={ficha.whatsapp} />
            <Dato icon={IdCard}     label="Documento"   value={ficha.numDoc ? `${ficha.tipoDoc} ${ficha.numDoc}` : ''} />
            <Dato icon={Calendar}   label="Nacimiento"  value={ficha.fechaNacimiento} />
            <Dato icon={MapPin}     label="Dirección"   value={ficha.direccion} />
            <Dato icon={Droplet}    label="Tipo sangre" value={ficha.tipoSangre} />
            <Dato icon={Shield}     label="EPS"         value={ficha.eps} />
            <Dato icon={Plane}      label="Pasaporte"   value={ficha.pasaporte ? 'Sí' : 'No'} />
            <Dato icon={HeartPulse} label="Emergencia"  value={ficha.contactoEmergencia} />
          </div>
          {ficha.diagnostico && ficha.diagnostico.toLowerCase() !== 'no' && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <Dato icon={HeartPulse} label="Diagnóstico / medicamentos" value={ficha.diagnostico} />
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-xs">
            <Shield size={13} className={ficha.consentimientoDatos ? 'text-green-500' : 'text-gray-300'} />
            <span className={ficha.consentimientoDatos ? 'text-green-600' : 'text-gray-400'}>
              {ficha.consentimientoDatos ? `Autorización de datos aceptada${ficha.consentimientoFecha ? ` (${ficha.consentimientoFecha})` : ''}` : 'Autorización de datos pendiente'}
            </span>
          </div>
        </div>

        {showCarne && <CarneIntegrante ficha={ficha} onClose={() => setShowCarne(false)} />}
      </div>
    )
  }

  // ── Edición ────────────────────────────────────────────────────
  return (
    <div className="card p-6 border-l-4 border-gold">
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
            <option value="">—</option>{TIPOS_DOC.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Campo>
        <Campo label="Número de documento"><input className="input" value={form.numDoc ?? ''} onChange={e => set('numDoc', e.target.value)} /></Campo>
        <Campo label="Fecha de nacimiento"><input className="input" type="date" value={toDateInput(form.fechaNacimiento)} onChange={e => set('fechaNacimiento', e.target.value)} /></Campo>
        <Campo label="Tipo de sangre">
          <select className="input" value={form.tipoSangre ?? ''} onChange={e => set('tipoSangre', e.target.value)}>
            <option value="">—</option>{TIPOS_SANGRE.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Campo>
        <Campo label="EPS"><input className="input" value={form.eps ?? ''} onChange={e => set('eps', e.target.value)} /></Campo>
        <Campo label="¿Tiene pasaporte?">
          <select className="input" value={form.pasaporte ? 'si' : 'no'} onChange={e => set('pasaporte', e.target.value === 'si')}>
            <option value="no">No</option><option value="si">Sí</option>
          </select>
        </Campo>
        <Campo label="Dirección de residencia" full><input className="input" value={form.direccion ?? ''} onChange={e => set('direccion', e.target.value)} /></Campo>
        <Campo label="Contacto de emergencia (nombre / parentesco / teléfono)" full><input className="input" value={form.contactoEmergencia ?? ''} onChange={e => set('contactoEmergencia', e.target.value)} /></Campo>
        <Campo label="Diagnóstico médico / medicamentos (si aplica)" full>
          <textarea className="input resize-none" rows={2} value={form.diagnostico ?? ''} onChange={e => set('diagnostico', e.target.value)} placeholder="Describe brevemente o escribe 'No'" />
        </Campo>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-dark mb-1">Foto de perfil <span className="font-normal text-gray-400">(opcional)</span></label>
          <FotoUpload integranteId={ficha.id} current={form.fotoURL} onUploaded={url => set('fotoURL', url)} />
        </div>

        <label className="sm:col-span-2 flex items-start gap-2.5 p-3 rounded-xl border border-gray-200 cursor-pointer hover:border-royal/40">
          <input type="checkbox" checked={!!form.consentimientoDatos} onChange={e => set('consentimientoDatos', e.target.checked)} className="w-4 h-4 accent-royal mt-0.5 shrink-0" />
          <span className="text-xs text-gray-600 leading-relaxed">
            Autorizo a la Corporación Musical Guardia Real de Antioquia el tratamiento de mis datos personales
            (incluidos datos sensibles de salud) para fines administrativos, logísticos y de la actividad de la banda,
            conforme a la Ley 1581 de 2012 (Habeas Data). <strong>Obligatorio</strong>.
          </span>
        </label>
      </div>
      <div className="flex gap-3 mt-5">
        <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-md disabled:opacity-60"><Save size={15} /> {saving ? 'Guardando...' : 'Guardar cambios'}</button>
        <button onClick={() => setEditing(false)} className="btn btn-ghost btn-md">Cancelar</button>
      </div>
      <p className="text-xs text-gray-400 mt-3 flex items-start gap-1.5">
        <Shield size={13} className="shrink-0 mt-0.5" />
        Tus datos sensibles (documento, dirección, salud) solo son visibles para ti y la administración.
      </p>
    </div>
  )
}

function FotoUpload({ integranteId, current, onUploaded }: { integranteId: string; current?: string; onUploaded: (url: string) => void }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Solo imágenes'); return }
    setUploading(true)
    try {
      const storageRef = ref(storage, `integrantes/${integranteId}/${Date.now()}_${file.name.replace(/\s/g, '_')}`)
      await uploadBytes(storageRef, file)
      onUploaded(await getDownloadURL(storageRef))
      toast.success('Foto subida')
    } catch { toast.error('No se pudo subir la foto') }
    finally { setUploading(false) }
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

function Dato({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2">
      <Icon size={14} className="text-gray-400 shrink-0 mt-0.5" />
      <div className="min-w-0"><p className="text-[11px] text-gray-400 uppercase tracking-wide">{label}</p><p className="text-dark break-words">{value}</p></div>
    </div>
  )
}

function Campo({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return <div className={cn(full && 'sm:col-span-2')}><label className="block text-xs font-semibold text-dark mb-1">{label}</label>{children}</div>
}

function toDateInput(v?: string): string {
  if (!v) return ''
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  const dmy = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
  return ''
}
