'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import {
  Heart, Building2, CreditCard, Upload, CheckCircle2,
  Copy, ArrowRight, Loader2, FileText,
} from 'lucide-react'
import PageBanner from '@/components/layout/PageBanner'
import { createDonation, storage } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { toast } from 'sonner'

// ── Account info ───────────────────────────────────────────────────
const BANCOLOMBIA = {
  titular: 'CORPORACION BANDA GUARDIA REAL DE ANTIOQUIA',
  cuenta:  '102-025448-84',
  tipo:    'Cuenta de Ahorro',
  nit:     '811028220',
}

const NEQUI = { numero: '310 3996280' }

// ── Copy helper ────────────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handle = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={handle} title="Copiar" className="ml-2 text-gray-400 hover:text-navy transition-colors">
      {copied ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />}
    </button>
  )
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 flex items-start justify-between gap-2">
      <div>
        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">{label}</p>
        <p className="font-mono font-semibold text-dark text-sm">{value}</p>
      </div>
      <CopyBtn text={value} />
    </div>
  )
}

// ── Donation form ──────────────────────────────────────────────────
interface DonationForm {
  nombre:          string
  telefono:        string
  identificacion:  string
  email:           string
  monto:           string
  comentarios:     string
}

const EMPTY: DonationForm = {
  nombre: '', telefono: '', identificacion: '', email: '', monto: '', comentarios: '',
}

export default function DonarPage() {
  const [form,      setForm]      = useState<DonationForm>(EMPTY)
  const [file,      setFile]      = useState<File | null>(null)
  const [sending,   setSending]   = useState(false)
  const [success,   setSuccess]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    if (f.size > 10 * 1024 * 1024) { toast.error('El archivo no puede superar 10 MB'); return }
    setFile(f)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre.trim() || !form.email.trim() || !form.telefono.trim()) {
      toast.error('Nombre, teléfono y correo son obligatorios')
      return
    }
    setSending(true)
    try {
      let evidenciaUrl: string | undefined
      if (file) {
        setUploading(true)
        try {
          const path     = `donations/${Date.now()}_${file.name.replace(/\s/g, '_')}`
          const fileRef2 = ref(storage, path)
          await uploadBytes(fileRef2, file)
          evidenciaUrl = await getDownloadURL(fileRef2)
        } catch { toast.error('Error al subir el comprobante') }
        finally { setUploading(false) }
      }

      // Save to Firestore
      await createDonation({
        nombre:         form.nombre.trim(),
        telefono:       form.telefono.trim(),
        identificacion: form.identificacion.trim() || null,
        email:          form.email.trim(),
        monto:          form.monto.trim() || null,
        comentarios:    form.comentarios.trim() || null,
        evidenciaUrl:   evidenciaUrl ?? null,
      })

      // Send receipt email
      await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, evidenciaUrl }),
      })

      setSuccess(true)
      setForm(EMPTY)
      setFile(null)
    } catch { toast.error('Error al procesar la donación. Intenta de nuevo.') }
    finally { setSending(false) }
  }

  if (success) {
    return (
      <div>
        <PageBanner
          image="/images/banners/banner-nosotros.jpg"
          eyebrow="Tu aporte nos impulsa"
          title="Apóyanos"
          subtitle="Cada donación ayuda a formar músicos y mantener viva la tradición"
        />
        <div className="section-container py-20 max-w-2xl text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
            <CheckCircle2 size={36} className="text-green-600" />
          </div>
          <h2 className="font-serif text-navy text-2xl font-bold mb-3">¡Gracias por tu donación!</h2>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Hemos registrado tu aporte y te hemos enviado un comprobante por correo electrónico.
            Tu generosidad nos permite seguir formando músicos y llevando cultura a Colombia.
          </p>
          <div className="bg-gold/10 rounded-xl p-6 border border-gold/30 mb-8 text-left">
            <p className="font-bold text-navy mb-2 flex items-center gap-2">
              <Image src="/images/escudo.png" alt="GRA" width={24} height={24} />
              Guardia Real de Antioquia
            </p>
            <p className="text-sm text-gray-600">
              En nombre de todos los integrantes de la Corporación Musical Guardia Real de Antioquia,
              te agradecemos profundamente. Tu donación es un acto de amor por la cultura y la música de Colombia.
            </p>
          </div>
          <button onClick={() => setSuccess(false)} className="btn btn-primary btn-md">
            Hacer otra donación
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageBanner
        image="/images/banners/banner-nosotros.jpg"
        eyebrow="Tu aporte nos impulsa"
        title="Apóyanos"
        subtitle="Cada donación ayuda a formar músicos y mantener viva la tradición"
      />

      <div className="section-container py-16 max-w-5xl">
        {/* Intro */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/10 mb-4">
            <Heart size={28} className="text-gold" />
          </div>
          <h2 className="font-serif text-navy text-2xl font-bold mb-3">¿Por qué donar?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Somos una corporación cultural <strong>sin ánimo de lucro</strong> que vive del aporte
            de nuestros integrantes, de las contrataciones y del apoyo de personas como tú. Cada
            donación se destina a instrumentos, uniformes, transporte y formación musical para
            niños y jóvenes de Medellín.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-10">
          {/* Donation form */}
          <div>
            <h3 className="font-serif text-navy text-xl font-bold mb-6">Registra tu donación</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-dark mb-1.5">Nombre completo *</label>
                  <input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}
                    className="input" placeholder="Tu nombre" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark mb-1.5">Teléfono *</label>
                  <input type="tel" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})}
                    className="input" placeholder="300 000 0000" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark mb-1.5">
                    Identificación <span className="text-gray-400 font-normal">(CC, NIT — opcional)</span>
                  </label>
                  <input value={form.identificacion} onChange={e => setForm({...form, identificacion: e.target.value})}
                    className="input" placeholder="Opcional — requerido para recibo tributario" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark mb-1.5">Correo electrónico *</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                    className="input" placeholder="tu@correo.com" required />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-dark mb-1.5">
                    Monto de la donación <span className="text-gray-400 font-normal">(opcional, en COP)</span>
                  </label>
                  <input value={form.monto} onChange={e => setForm({...form, monto: e.target.value})}
                    className="input" placeholder="Ej. 50000" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark mb-1.5">
                  Mensaje para la banda <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea value={form.comentarios} onChange={e => setForm({...form, comentarios: e.target.value})}
                  className="input resize-none" rows={3}
                  placeholder="¿Tienes algún mensaje o dedicatoria para los integrantes de la Guardia Real?" />
              </div>

              {/* File upload */}
              <div>
                <label className="block text-sm font-semibold text-dark mb-1.5">
                  Comprobante de transferencia <span className="text-gray-400 font-normal">(foto o PDF)</span>
                </label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${file ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-royal'}`}
                >
                  {file ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText size={20} className="text-green-600" />
                      <span className="text-sm font-medium text-green-700">{file.name}</span>
                      <button type="button" onClick={e => { e.stopPropagation(); setFile(null) }}
                        className="text-xs text-red-400 hover:text-red-600 ml-2">Quitar</button>
                    </div>
                  ) : (
                    <>
                      <Upload size={22} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm font-medium text-gray-600">Arrastra o haz clic para subir</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF — máx. 10 MB</p>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </div>

              <div className="bg-navy/5 rounded-xl p-4 border border-navy/10">
                <p className="text-xs text-gray-600 leading-relaxed">
                  Al registrar tu donación, recibirás un <strong>correo de confirmación</strong> con el
                  detalle de tu aporte y los datos de la corporación para efectos tributarios.
                  Si eres empresa y requieres una <strong>certificación de donación</strong> formal,
                  inclúyelo en el mensaje o escríbenos directamente.
                </p>
              </div>

              <button type="submit" disabled={sending || uploading} className="btn btn-gold btn-lg w-full disabled:opacity-60">
                {sending || uploading ? (
                  <><Loader2 size={18} className="animate-spin" /> {uploading ? 'Subiendo comprobante...' : 'Procesando...'}</>
                ) : (
                  <><Heart size={18} /> Registrar mi donación <ArrowRight size={16} /></>
                )}
              </button>
            </form>
          </div>

          {/* Account info sidebar */}
          <div className="space-y-5">
            {/* Bancolombia */}
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center shrink-0">
                  <Building2 size={20} className="text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-navy">Bancolombia</h3>
                  <p className="text-xs text-gray-400">Transferencia bancaria</p>
                </div>
              </div>
              <div className="space-y-2">
                <InfoField label="Tipo de cuenta"  value={BANCOLOMBIA.tipo}    />
                <InfoField label="Número de cuenta" value={BANCOLOMBIA.cuenta}  />
                <InfoField label="Titular"          value={BANCOLOMBIA.titular} />
                <InfoField label="NIT"              value={BANCOLOMBIA.nit}     />
              </div>
            </div>

            {/* Nequi */}
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                  <CreditCard size={20} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-navy">Nequi</h3>
                  <p className="text-xs text-gray-400">Pago móvil rápido</p>
                </div>
              </div>
              <InfoField label="Número Nequi" value={NEQUI.numero} />
            </div>

            {/* Coming soon */}
            <div className="card p-4 bg-gray-50 border-dashed">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Próximamente</p>
              <div className="space-y-1 text-xs text-gray-500">
                <p>🔜 PayPal</p>
                <p>🔜 Tarjeta de crédito / débito</p>
                <p>🔜 PSE — Pagos Seguros en Línea</p>
              </div>
            </div>

            {/* Escudo */}
            <div className="text-center py-4">
              <Image src="/images/escudo.png" alt="Guardia Real de Antioquia" width={80} height={80} className="mx-auto mb-3 opacity-80" />
              <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
                La Corporación Musical Guardia Real de Antioquia es una entidad sin ánimo de lucro.
                Tu donación contribuye directamente a la formación musical y la cultura de Colombia.
              </p>
              <p className="text-xs text-gray-400 mt-1 font-mono">NIT. {BANCOLOMBIA.nit}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
