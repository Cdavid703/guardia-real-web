import Image from 'next/image'
import { MapPin, Route, CheckCircle, Briefcase, ArrowRight } from 'lucide-react'

const SERVICES = [
  {
    icon: MapPin,
    title: 'Exhibición de Campo',
    subtitle: 'Espectáculo en espacio abierto o cerrado',
    description:
      'Presentación coreográfica en espacio delimitado (plazas, canchas, placas deportivas y escenarios). Espectáculo temático con intervención de músicos, bailarines y artistas.',
    features: [
      'Plazas y escenarios al aire libre',
      'Espacios deportivos cubiertos',
      'Coreografía temática personalizable',
      'Músicos, bailarines y artistas',
    ],
    color: 'from-navy to-royal',
    cta: 'Cotizar exhibición',
  },
  {
    icon: Route,
    title: 'Show de Recorrido',
    subtitle: 'Desfile y presentación en movimiento',
    description:
      'Presentación en formación militar con interpretación de música tropical y latina, intervención de bailarines, desplazamiento y desfile. Ideal para actos deportivos, desfiles culturales y celebraciones.',
    features: [
      'Desfiles y procesiones',
      'Actos deportivos y cívicos',
      'Caminatas y festividades',
      'Celebraciones corporativas',
    ],
    color: 'from-royal to-sky',
    cta: 'Cotizar desfile',
  },
]

interface ServiciosTabProps {
  onNavigate: (tab: string) => void
}

export default function ServiciosTab({ onNavigate }: ServiciosTabProps) {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="text-center">
        <p className="section-label mb-3">Lo que hacemos</p>
        <h2 className="font-display text-navy text-3xl md:text-4xl font-bold uppercase tracking-wider mb-4">
          Nuestros <span className="text-gold">Servicios</span>
        </h2>
        <div className="divider-gold max-w-xs mx-auto mb-4" />
        <p className="text-gray-600 max-w-xl mx-auto text-base">
          Llevamos la música y la cultura a tu evento con la energía, disciplina y
          profesionalismo que nos distinguen hace más de 42 años.
        </p>
      </div>

      {/* Big CTA → Contratantes */}
      <button
        onClick={() => onNavigate('contratantes')}
        className="w-full bg-gradient-primary rounded-2xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-4 text-left transition-transform hover:scale-[1.01]"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Briefcase size={24} />
          </div>
          <div>
            <p className="text-gold text-xs font-bold tracking-widest uppercase mb-1">¿Vas a organizar un evento?</p>
            <h3 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-wider">
              Toda la información para contratantes
            </h3>
          </div>
        </div>
        <span className="btn btn-gold btn-md shrink-0 flex items-center gap-2">
          Ver más
          <ArrowRight size={16} />
        </span>
      </button>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {SERVICES.map(({ icon: Icon, title, subtitle, description, features, color, cta }) => (
          <div key={title} className="card overflow-hidden">
            {/* Card header */}
            <div className={`bg-gradient-to-br ${color} p-8 text-white`}>
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                <Icon size={24} />
              </div>
              <p className="text-gold text-xs font-bold tracking-widest uppercase mb-1">{subtitle}</p>
              <h3 className="font-display text-2xl font-bold uppercase tracking-wider">{title}</h3>
            </div>

            {/* Card body */}
            <div className="p-8">
              <p className="text-gray-600 leading-relaxed mb-6">{description}</p>
              <ul className="space-y-2 mb-8">
                {features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle size={15} className="text-royal shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => onNavigate('contacto')} className="btn btn-primary btn-md w-full justify-center">
                {cta}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="relative bg-gradient-hero rounded-2xl p-10 text-white overflow-hidden text-center">
        <div className="absolute right-0 bottom-0 hidden md:block select-none">
          <Image
            src="/images/mascota.png"
            alt="Mascota Guardia Real"
            width={180}
            height={180}
            className="object-contain opacity-80 hover:opacity-100 transition-opacity duration-300"
          />
        </div>
        <div className="relative z-10">
          <h3 className="font-display text-2xl font-bold uppercase tracking-wider mb-2">
            ¿Tienes un evento especial?
          </h3>
          <p className="font-serif italic text-gold text-lg mb-6">
            Cuéntanos y diseñamos la presentación perfecta para ti
          </p>
          <button onClick={() => onNavigate('contacto')} className="btn btn-gold btn-xl">
            Solicitar cotización gratuita
          </button>
        </div>
      </div>
    </div>
  )
}
