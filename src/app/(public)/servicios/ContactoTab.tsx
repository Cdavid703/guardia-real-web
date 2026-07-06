'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Send, Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react'
import { createQuoteRequest } from '@/lib/firebase'

const schema = z.object({
  name:         z.string().min(2, 'Mínimo 2 caracteres'),
  email:        z.string().email('Email inválido'),
  phone:        z.string().min(7, 'Teléfono inválido'),
  organization: z.string().optional(),
  eventType:    z.string().min(2, 'Describe el tipo de evento'),
  eventDate:    z.string().min(1, 'Selecciona una fecha'),
  eventLocation:z.string().min(2, 'Indica la ubicación'),
  attendees:    z.string().optional(),
  serviceType:  z.enum(['campo', 'desfile', 'ambos']),
  message:      z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function ContactoTab() {
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await createQuoteRequest(data)
      // Email is best-effort — failure doesn't block the form submission
      fetch('/api/contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      }).catch(() => {})
      setSent(true)
      reset()
      toast.success('¡Solicitud enviada! Te contactaremos en menos de 24 horas.')
    } catch {
      toast.error('Error al enviar. Intenta de nuevo o escríbenos directamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="text-center mb-10">
        <p className="section-label mb-3">Estamos disponibles</p>
        <h2 className="font-display text-navy text-3xl md:text-4xl font-bold uppercase tracking-wider mb-4">
          Contáctanos
        </h2>
        <div className="divider-gold max-w-xs mx-auto mb-4" />
        <p className="text-gray-600 max-w-xl mx-auto text-base">
          Solicita tu cotización gratuita — respuesta en menos de 24 horas
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* Info sidebar */}
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-serif font-bold text-navy text-lg mb-4">Contacto directo</h3>

            {/* Personas con WhatsApp + Llamar */}
            <div className="space-y-4 mb-6">
              {[
                { name: 'Dairo Villada',     role: 'Coordinación general',  phone: '573197735052', display: '319 773 5052' },
                { name: 'Sebastián Álvarez', role: 'Logística y eventos',   phone: '573105094658', display: '310 509 4658' },
              ].map(c => (
                <div key={c.phone} className="border border-gray-100 rounded-lg p-3 bg-gray-50/50">
                  <p className="text-sm font-semibold text-dark">{c.name}</p>
                  <p className="text-xs text-gray-500 mb-2">{c.role} · {c.display}</p>
                  <div className="flex gap-2">
                    <a
                      href={`https://wa.me/${c.phone}?text=${encodeURIComponent('Hola, me interesa contratar a la Guardia Real de Antioquia.')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#25D366] hover:bg-[#1ebd5a] rounded-lg text-white text-xs font-semibold transition-colors"
                    >
                      <MessageCircle size={14} />
                      WhatsApp
                    </a>
                    <a
                      href={`tel:+${c.phone}`}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-navy hover:bg-navy/90 rounded-lg text-white text-xs font-semibold transition-colors"
                    >
                      <Phone size={14} />
                      Llamar
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Email + ubicación */}
            <div className="space-y-3 pt-4 border-t border-gray-100">
              {[
                { icon: Mail,  title: 'Email',     detail: 'bandashowguardiareal@outlook.com', href: 'mailto:bandashowguardiareal@outlook.com' },
                { icon: MapPin,title: 'Ubicación', detail: 'Cra. 48 A #73–36\nCampo Valdés, Medellín', href: '#' },
              ].map(({ icon: Icon, title, detail, href }) => (
                <a key={title} href={href} className="flex gap-3 group">
                  <div className="w-9 h-9 rounded-lg bg-navy/10 flex items-center justify-center shrink-0 group-hover:bg-navy transition-all">
                    <Icon size={16} className="text-navy group-hover:text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p>
                    <p className="text-sm text-dark whitespace-pre-line break-all">{detail}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div className="card p-6 bg-gradient-hero text-white">
            <div className="flex gap-2 items-center mb-3">
              <Clock size={16} className="text-gold" />
              <span className="text-sm font-semibold">Tiempo de respuesta</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Respondemos todas las solicitudes en <strong className="text-gold">menos de 24 horas</strong> en días hábiles.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-2">
          {sent ? (
            <div className="card p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-green/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎉</span>
              </div>
              <h3 className="font-display text-navy text-2xl font-bold uppercase tracking-wider mb-2">
                ¡Solicitud enviada!
              </h3>
              <p className="font-serif italic text-gold mb-4">
                &ldquo;Disciplina, progreso y honor&rdquo;
              </p>
              <p className="text-gray-600 mb-6">
                Hemos recibido tu solicitud. Te contactaremos en las próximas 24 horas
                para confirmar disponibilidad y detalles.
              </p>
              <button onClick={() => setSent(false)} className="btn btn-primary btn-md">
                Enviar otra solicitud
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="card p-8 space-y-6">
              <h3 className="font-serif font-bold text-navy text-xl mb-2">
                Solicitud de cotización
              </h3>
              <div className="h-0.5 w-12 bg-gold rounded" />

              {/* Row 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-dark mb-1.5">
                    Nombre completo *
                  </label>
                  <input {...register('name')} className="input" placeholder="Tu nombre" />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark mb-1.5">
                    Organización / empresa
                  </label>
                  <input {...register('organization')} className="input" placeholder="Opcional" />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-dark mb-1.5">Email *</label>
                  <input {...register('email')} type="email" className="input" placeholder="tu@correo.com" />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark mb-1.5">Teléfono *</label>
                  <input {...register('phone')} type="tel" className="input" placeholder="300 000 0000" />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-dark mb-1.5">Tipo de evento *</label>
                  <input {...register('eventType')} className="input" placeholder="Ej. Feria municipal, boda..." />
                  {errors.eventType && <p className="text-red-500 text-xs mt-1">{errors.eventType.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark mb-1.5">Fecha del evento *</label>
                  <input {...register('eventDate')} type="date" className="input" />
                  {errors.eventDate && <p className="text-red-500 text-xs mt-1">{errors.eventDate.message}</p>}
                </div>
              </div>

              {/* Row 4 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-dark mb-1.5">Ubicación del evento *</label>
                  <input {...register('eventLocation')} className="input" placeholder="Ciudad, municipio..." />
                  {errors.eventLocation && <p className="text-red-500 text-xs mt-1">{errors.eventLocation.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark mb-1.5">Asistentes aprox.</label>
                  <input {...register('attendees')} className="input" placeholder="Ej. 500 personas" />
                </div>
              </div>

              {/* Service type */}
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">Tipo de presentación *</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'campo',   label: 'Exhibición de Campo' },
                    { value: 'desfile', label: 'Show de Recorrido' },
                    { value: 'ambos',   label: 'Ambos' },
                  ].map(({ value, label }) => (
                    <label
                      key={value}
                      className="flex flex-col items-center gap-2 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-royal transition-colors has-[:checked]:border-royal has-[:checked]:bg-royal/5"
                    >
                      <input {...register('serviceType')} type="radio" value={value} className="sr-only" />
                      <span className="text-sm font-medium text-center">{label}</span>
                    </label>
                  ))}
                </div>
                {errors.serviceType && <p className="text-red-500 text-xs mt-1">{errors.serviceType.message}</p>}
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-semibold text-dark mb-1.5">Mensaje adicional</label>
                <textarea
                  {...register('message')}
                  className="input resize-none"
                  rows={4}
                  placeholder="Cuéntanos más sobre tu evento, requisitos especiales, dudas..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-gold btn-lg w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Send size={18} />
                {loading ? 'Enviando...' : 'Enviar solicitud de cotización'}
              </button>

              <p className="text-xs text-gray-400 text-center">
                Al enviar este formulario aceptas que usemos tu información para contactarte
                sobre esta solicitud. No compartimos tus datos con terceros.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
