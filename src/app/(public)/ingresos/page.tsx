'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Send, Music, User, Calendar, MapPin, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import { createIngresoRequest } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'

const INSTRUMENTOS = [
  'Clarinete',
  'Flauta traversa',
  'Saxofón alto',
  'Saxofón tenor',
  'Saxofón barítono',
  'Trompeta',
  'Corno',
  'Trombón',
  'Eufonio / Bombardino',
  'Tuba / Sousafón',
  'Lira / Metalófono',
  'Redoblante / Caja',
  'Bombo',
  'Platillos',
  'Percusión (múltiple)',
  'Color guard / Banderas',
  'Bastonera / Majorette',
  'Drum major / Bastonero',
  'Otro',
]

const DISPONIBILIDAD = [
  'Fines de semana',
  'Fines de semana y algunos entre semana',
  'Disponibilidad completa',
  'Solo eventos especiales',
]

const COMO_SE_ENTERO = [
  'Instagram (@bandashowguardiareal)',
  'Referido por un integrante',
  'Evento o presentación en vivo',
  'Facebook',
  'Búsqueda en internet',
  'Otro',
]

const schema = z.object({
  nombreCompleto:     z.string().min(2, 'Mínimo 2 caracteres'),
  identificacion:     z.string().min(5, 'Identificación inválida'),
  email:              z.string().email('Email inválido'),
  telefono:           z.string().min(7, 'Número inválido'),
  instrumentoInteres: z.string().min(1, 'Selecciona un instrumento'),
  experienciaPrevia:  z.boolean(),
  nivelExperiencia:   z.enum(['ninguna', 'basica', 'intermedia', 'avanzada']),
  fechaNacimiento:    z.string().min(1, 'Indica tu fecha de nacimiento'),
  barrio:             z.string().min(2, 'Indica tu barrio'),
  ciudad:             z.string().min(2, 'Indica tu ciudad'),
  disponibilidad:     z.string().min(1, 'Selecciona tu disponibilidad'),
  comoSeEntero:       z.string().min(1, 'Cuéntanos cómo nos conociste'),
  mensaje:            z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function IngresosPage() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { experienciaPrevia: false, nivelExperiencia: 'ninguna' },
  })

  const experienciaPrevia = watch('experienciaPrevia')

  // Pre-fill with auth data
  useEffect(() => {
    if (profile) {
      setValue('nombreCompleto', profile.displayName ?? '')
      setValue('email',          profile.email ?? '')
    }
  }, [profile, setValue])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await createIngresoRequest({ ...data, userId: user?.uid ?? null })
      fetch('/api/ingresos', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      }).catch(() => {})
      setSent(true)
      reset()
      toast.success('¡Solicitud enviada! Te contactaremos pronto.')
    } catch {
      toast.error('Error al enviar. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center px-4">
        <div className="card p-12 text-center max-w-md w-full">
          <div className="flex justify-center mb-4">
            <Image src="/images/escudo.png" alt="Guardia Real" width={72} height={72} className="object-contain drop-shadow-lg" />
          </div>
          <h3 className="font-display text-navy text-2xl font-bold uppercase tracking-wider mb-2">
            ¡Solicitud enviada!
          </h3>
          <p className="font-serif italic text-gold mb-4">
            &ldquo;Disciplina, progreso y honor&rdquo;
          </p>
          <p className="text-gray-600 text-sm mb-6">
            Hemos recibido tu solicitud de ingreso. Un director o miembro de la junta
            se comunicará contigo en los próximos días para coordinar una audición.
          </p>
          <button onClick={() => setSent(false)} className="btn btn-primary btn-md">
            Enviar otra solicitud
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Header */}
      <div className="relative bg-gradient-hero py-20 text-white text-center overflow-hidden">
        {/* Escudo */}
        <div className="flex justify-center mb-5">
          <div className="w-24 h-24 md:w-32 md:h-32 relative drop-shadow-2xl">
            <Image
              src="/images/escudo.png"
              alt="Escudo Guardia Real de Antioquia"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        <p className="section-label mb-3">Únete a la familia</p>
        <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-wider mb-4">
          Solicitud de ingreso
        </h1>
        <div className="divider-gold max-w-xs mx-auto mb-4" />
        <p className="font-serif italic text-gray-300 text-lg">
          Corporación Musical Guardia Real de Antioquia
        </p>

        {/* Mascota — decorativa lado derecho en desktop */}
        <div className="absolute right-0 bottom-0 hidden lg:block select-none">
          <Image
            src="/images/mascota.png"
            alt="Mascota Guardia Real de Antioquia"
            width={260}
            height={260}
            className="object-contain drop-shadow-2xl opacity-80 hover:opacity-100 transition-opacity duration-300"
          />
        </div>
      </div>

      <div className="section-container py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Info sidebar */}
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="font-serif font-bold text-navy text-lg mb-4">¿Cómo funciona?</h3>
              <div className="space-y-4">
                {[
                  { icon: '1', title: 'Completa el formulario',   desc: 'Llena todos los datos personales y musicales.' },
                  { icon: '2', title: 'Revisión por la directiva', desc: 'La junta y el director revisan tu solicitud.' },
                  { icon: '3', title: 'Te contactamos',            desc: 'Te llamamos para coordinar una audición o entrevista.' },
                  { icon: '4', title: '¡Bienvenido!',              desc: 'Si eres seleccionado, recibirás acceso al portal interno.' },
                ].map(({ icon, title, desc }) => (
                  <div key={icon} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-dark">{title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6 bg-gradient-hero text-white">
              <div className="flex gap-2 items-center mb-3">
                <Music size={16} className="text-gold" />
                <span className="text-sm font-semibold">Requisitos generales</span>
              </div>
              <ul className="text-gray-300 text-xs space-y-1.5 leading-relaxed">
                <li>• Edad mínima: 12 años</li>
                <li>• Compromiso con ensayos regulares</li>
                <li>• Disponibilidad para presentaciones</li>
                <li>• No se requiere experiencia previa</li>
              </ul>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="card p-8 space-y-6">
              <div>
                <h3 className="font-serif font-bold text-navy text-xl mb-1">
                  Datos personales
                </h3>
                <div className="h-0.5 w-12 bg-gold rounded" />
              </div>

              {/* Nombre + Identificación */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-dark mb-1.5">
                    <User size={13} className="inline mr-1 mb-0.5" />
                    Nombre completo *
                  </label>
                  <input {...register('nombreCompleto')} className="input" placeholder="Tu nombre completo" />
                  {errors.nombreCompleto && <p className="text-red-500 text-xs mt-1">{errors.nombreCompleto.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark mb-1.5">
                    Número de identificación *
                  </label>
                  <input {...register('identificacion')} className="input" placeholder="CC, TI, CE..." />
                  {errors.identificacion && <p className="text-red-500 text-xs mt-1">{errors.identificacion.message}</p>}
                </div>
              </div>

              {/* Email + Teléfono */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-dark mb-1.5">
                    Correo electrónico *
                  </label>
                  <input {...register('email')} type="email" className="input" placeholder="tu@correo.com" />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark mb-1.5">
                    Teléfono / WhatsApp *
                  </label>
                  <input {...register('telefono')} type="tel" className="input" placeholder="300 000 0000" />
                  {errors.telefono && <p className="text-red-500 text-xs mt-1">{errors.telefono.message}</p>}
                </div>
              </div>

              {/* Fecha + Barrio + Ciudad */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-dark mb-1.5">
                    <Calendar size={13} className="inline mr-1 mb-0.5" />
                    Fecha de nacimiento *
                  </label>
                  <input {...register('fechaNacimiento')} type="date" className="input" />
                  {errors.fechaNacimiento && <p className="text-red-500 text-xs mt-1">{errors.fechaNacimiento.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark mb-1.5">
                    <MapPin size={13} className="inline mr-1 mb-0.5" />
                    Barrio *
                  </label>
                  <input {...register('barrio')} className="input" placeholder="Tu barrio" />
                  {errors.barrio && <p className="text-red-500 text-xs mt-1">{errors.barrio.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark mb-1.5">Ciudad *</label>
                  <input {...register('ciudad')} className="input" placeholder="Tu ciudad" />
                  {errors.ciudad && <p className="text-red-500 text-xs mt-1">{errors.ciudad.message}</p>}
                </div>
              </div>

              {/* Divider */}
              <div className="pt-2 border-t border-gray-100">
                <h3 className="font-serif font-bold text-navy text-xl mb-1">
                  Datos musicales
                </h3>
                <div className="h-0.5 w-12 bg-gold rounded" />
              </div>

              {/* Instrumento + Disponibilidad */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-dark mb-1.5">
                    <Music size={13} className="inline mr-1 mb-0.5" />
                    Instrumento de interés *
                  </label>
                  <div className="relative">
                    <select {...register('instrumentoInteres')} className="input appearance-none pr-8">
                      <option value="">Selecciona un instrumento</option>
                      {INSTRUMENTOS.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  {errors.instrumentoInteres && <p className="text-red-500 text-xs mt-1">{errors.instrumentoInteres.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark mb-1.5">
                    Disponibilidad *
                  </label>
                  <div className="relative">
                    <select {...register('disponibilidad')} className="input appearance-none pr-8">
                      <option value="">Selecciona tu disponibilidad</option>
                      {DISPONIBILIDAD.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  {errors.disponibilidad && <p className="text-red-500 text-xs mt-1">{errors.disponibilidad.message}</p>}
                </div>
              </div>

              {/* Experiencia previa */}
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">
                  ¿Tienes experiencia previa en bandas o música? *
                </label>
                <div className="flex gap-4">
                  {[{ value: true, label: 'Sí' }, { value: false, label: 'No' }].map(({ value, label }) => (
                    <label
                      key={String(value)}
                      className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-royal transition-colors has-[:checked]:border-royal has-[:checked]:bg-royal/5"
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        checked={experienciaPrevia === value}
                        onChange={() => {
                          setValue('experienciaPrevia', value)
                          if (!value) setValue('nivelExperiencia', 'ninguna')
                        }}
                      />
                      <span className="text-sm font-medium">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Nivel de experiencia — condicional */}
              {experienciaPrevia && (
                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">
                    Nivel de experiencia *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { value: 'basica',     label: 'Básica',     desc: 'Menos de 1 año' },
                      { value: 'intermedia', label: 'Intermedia', desc: '1 a 3 años' },
                      { value: 'avanzada',   label: 'Avanzada',   desc: 'Más de 3 años' },
                    ].map(({ value, label, desc }) => (
                      <label
                        key={value}
                        className="flex flex-col items-center gap-1 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-royal transition-colors has-[:checked]:border-royal has-[:checked]:bg-royal/5"
                      >
                        <input {...register('nivelExperiencia')} type="radio" value={value} className="sr-only" />
                        <span className="text-sm font-semibold">{label}</span>
                        <span className="text-xs text-gray-400 text-center">{desc}</span>
                      </label>
                    ))}
                  </div>
                  {errors.nivelExperiencia && <p className="text-red-500 text-xs mt-1">{errors.nivelExperiencia.message}</p>}
                </div>
              )}

              {/* Cómo se enteró */}
              <div>
                <label className="block text-sm font-semibold text-dark mb-1.5">
                  ¿Cómo te enteraste de la Guardia Real? *
                </label>
                <div className="relative">
                  <select {...register('comoSeEntero')} className="input appearance-none pr-8">
                    <option value="">Selecciona una opción</option>
                    {COMO_SE_ENTERO.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                {errors.comoSeEntero && <p className="text-red-500 text-xs mt-1">{errors.comoSeEntero.message}</p>}
              </div>

              {/* Mensaje adicional */}
              <div>
                <label className="block text-sm font-semibold text-dark mb-1.5">
                  Mensaje adicional <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  {...register('mensaje')}
                  className="input resize-none"
                  rows={3}
                  placeholder="Cuéntanos algo más sobre ti, tus motivaciones o cualquier pregunta que tengas..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-gold btn-lg w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Send size={18} />
                {loading ? 'Enviando...' : 'Enviar solicitud de ingreso'}
              </button>

              <p className="text-xs text-gray-400 text-center">
                Tu información será usada únicamente para el proceso de selección de la banda.
                No compartimos tus datos con terceros.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
