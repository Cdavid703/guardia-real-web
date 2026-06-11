import Image from 'next/image'
import {
  Download, CheckCircle, MapPin, Route, Star, Users, Calendar, Award,
  Phone, Mail, Globe, Mic2, Music2,
} from 'lucide-react'
import Accordion from '@/components/ui/Accordion'

const STATS = [
  { value: '42+',  label: 'Años de experiencia',    icon: Award },
  { value: '60+',  label: 'Músicos y artistas',      icon: Users },
  { value: '200+', label: 'Eventos realizados',      icon: Calendar },
  { value: '100%', label: 'Compromiso profesional',  icon: Star },
]

const SERVICES = [
  {
    icon: MapPin,
    title: 'Exhibición de Campo',
    subtitle: 'Espectáculo estático en espacio delimitado',
    color: 'from-navy to-royal',
    details: [
      'Plazas, canchas y escenarios al aire libre',
      'Espacios deportivos y recintos cubiertos',
      'Coreografía temática personalizable',
      'Integración de músicos, danzantes y artistas visuales',
      'Duración flexible: 20–45 minutos',
    ],
  },
  {
    icon: Route,
    title: 'Show de Recorrido',
    subtitle: 'Desfile y presentación en movimiento',
    color: 'from-royal to-sky',
    details: [
      'Desfiles cívicos y culturales',
      'Actos deportivos y ceremonias',
      'Caminatas, festividades y marchas',
      'Celebraciones corporativas y municipales',
      'Formación militar con música tropical y latina',
    ],
  },
  {
    icon: Music2,
    title: 'Presentación Especial',
    subtitle: 'Montaje a medida para tu evento',
    color: 'from-gold/80 to-amber-600',
    details: [
      'Conciertos y temporadas musicales',
      'Lanzamientos de marca o producto',
      'Actos de gala e inauguraciones',
      'Fiestas patronales y celebraciones regionales',
      'Diseño de repertorio y puesta en escena',
    ],
  },
]

const WHY_US = [
  { title: '42 años de trayectoria', desc: 'Fundada en 1982, somos una de las bandas show con mayor historia en Antioquia.' },
  { title: 'Talento certificado', desc: 'Músicos, bailarines y artistas visuales con formación técnica y experiencia escénica.' },
  { title: 'Logística propia', desc: 'Transporte, uniformes, equipos y dirección musical garantizados por nosotros.' },
  { title: 'Flexibilidad total', desc: 'Adaptamos el montaje, duración y repertorio a tu evento y presupuesto.' },
  { title: 'Cobertura regional', desc: 'Atendemos eventos en todo Antioquia y el resto de Colombia.' },
  { title: 'Corporación sin ánimo de lucro', desc: 'Nuestros ingresos financian la formación musical de jóvenes de la región.' },
]

const NOTABLE = [
  'Feria de las Flores — Desfile de Silleteros (Medellín)',
  'Desfile de Mitos y Leyendas (Medellín)',
  'Fiestas de la Candelaria (Medellín)',
  'Feria de Manizales y eventos departamentales',
  'Eventos corporativos y municipales en Antioquia',
  'Ceremonias de grado y actos institucionales',
]

interface ContratantesTabProps {
  onNavigate: (tab: string) => void
}

export default function ContratantesTab({ onNavigate }: ContratantesTabProps) {
  const accordionItems = [
    {
      id: 'quienes',
      title: 'Quiénes somos',
      badge: '01',
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <p className="leading-relaxed mb-4">
              Somos una corporación cultural sin ánimo de lucro fundada en 1982, dedicada a la
              formación musical y a la difusión de la cultura a través de espectáculos de alta calidad.
            </p>
            <p className="leading-relaxed mb-6">
              Contamos con más de 60 músicos, bailarines y artistas especializados en bandas show
              estilo campo y recorrido, con un repertorio que combina música tropical, latina y
              marchas de concierto.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Globe size={16} className="text-royal shrink-0" />
                Medellín — Antioquia, Colombia
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mic2 size={16} className="text-royal shrink-0" />
                Géneros: Tropical, Latina, Marcial
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-48 h-48 rounded-full bg-gradient-primary flex items-center justify-center shadow-xl">
                <Image
                  src="/images/escudo-removebg.png"
                  alt="Escudo Guardia Real de Antioquia"
                  width={150}
                  height={150}
                  className="object-contain"
                />
              </div>
              <div className="absolute -bottom-3 -right-3 bg-gold rounded-2xl px-3 py-1.5 shadow-lg">
                <p className="font-display text-near-black text-xs font-bold uppercase tracking-wider">Desde 1982</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'servicios-detalle',
      title: 'Nuestros servicios',
      badge: '02',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {SERVICES.map(({ icon: Icon, title, subtitle, color, details }) => (
            <div key={title} className="card overflow-hidden">
              <div className={`bg-gradient-to-br ${color} p-5 text-white`}>
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                  <Icon size={18} />
                </div>
                <p className="text-white/70 text-xs font-bold tracking-wider uppercase mb-1">{subtitle}</p>
                <h3 className="font-display text-lg font-bold uppercase tracking-wider">{title}</h3>
              </div>
              <div className="p-5">
                <ul className="space-y-2">
                  {details.map(d => (
                    <li key={d} className="flex items-start gap-2 text-sm">
                      <CheckCircle size={14} className="text-royal shrink-0 mt-0.5" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'porque',
      title: '¿Por qué elegirnos?',
      badge: '03',
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {WHY_US.map(({ title, desc }) => (
            <div key={title} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <CheckCircle size={18} className="text-gold shrink-0 mt-0.5" />
              <div>
                <h4 className="font-serif font-bold text-navy text-base mb-1">{title}</h4>
                <p className="text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'eventos',
      title: 'Eventos destacados',
      badge: '04',
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {NOTABLE.map(ev => (
            <div key={ev} className="flex items-center gap-3 bg-navy/5 border border-navy/10 rounded-xl px-4 py-3">
              <Star size={14} className="text-gold shrink-0" />
              <p className="text-sm text-gray-700">{ev}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'tecnica',
      title: 'Información técnica',
      badge: '05',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <h3 className="font-serif font-bold text-navy text-base mb-3">Secciones de la banda</h3>
            <ul className="space-y-2 text-sm">
              {[
                '🎺 Sección de metales (brass)',
                '🪗 Sección de vientos',
                '🥁 Sección de percusión',
                '🚩 Color guard (banderas y sables)',
                '💃 Cuerpo de danza',
              ].map(s => <li key={s} className="flex items-center gap-2">{s}</li>)}
            </ul>
          </div>
          <div>
            <h3 className="font-serif font-bold text-navy text-base mb-3">Requisitos del espacio</h3>
            <ul className="space-y-2 text-sm">
              {[
                '📐 Campo: mínimo 50×40 m para exhibición completa',
                '🚌 Acceso vehicular para transporte del grupo',
                '⚡ Conexión eléctrica (opcional para amplificación)',
                '🏢 Camerinos o área de preparación',
                '📍 Cobertura: Medellín y área metropolitana (otros previa consulta)',
              ].map(s => <li key={s} className="flex items-center gap-2">{s}</li>)}
            </ul>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="text-center">
        <p className="section-label mb-3">Para contratantes</p>
        <h2 className="font-display text-navy text-3xl md:text-4xl font-bold uppercase tracking-wider mb-4">
          Contrata a la <span className="text-gold">Guardia Real</span>
        </h2>
        <div className="divider-gold max-w-xs mx-auto mb-4" />
        <p className="text-gray-600 max-w-2xl mx-auto text-base">
          Toda la información que necesitas para llevar la Guardia Real de Antioquia a tu evento:
          servicios, trayectoria, requisitos técnicos y datos de contacto directo.
        </p>
      </div>

      {/* Download brochure CTA */}
      <div className="bg-gold rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="font-display text-near-black text-xl font-bold uppercase tracking-wider">
            Descarga nuestro brochure completo
          </h3>
          <p className="text-near-black/70 text-sm mt-1">
            PDF con toda la información, fotos, servicios y datos de contacto
          </p>
        </div>
        <a
          href="/api/brochure"
          download="Brochure-Guardia-Real-Antioquia.pdf"
          className="btn btn-md bg-near-black text-white hover:bg-navy transition-colors flex items-center gap-2 shrink-0"
        >
          <Download size={18} />
          Descargar brochure PDF
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {STATS.map(({ value, label, icon: Icon }) => (
          <div key={label} className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-navy/8 flex items-center justify-center mx-auto mb-3">
              <Icon size={22} className="text-royal" />
            </div>
            <p className="font-display text-navy text-3xl font-bold">{value}</p>
            <p className="text-gray-500 text-sm mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Detalles en pestañas desplegables */}
      <Accordion items={accordionItems} singleOpen={false} defaultOpenIds={['quienes']} />

      {/* CTA final */}
      <div className="bg-gradient-primary rounded-2xl p-10 text-white text-center">
        <h2 className="font-display text-3xl font-bold uppercase tracking-wider mb-4">
          ¿Listo para contratar?
        </h2>
        <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
          Contáctanos directamente o descarga el brochure completo con toda la información,
          tarifas y condiciones.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/api/brochure"
            download="Brochure-Guardia-Real-Antioquia.pdf"
            className="btn btn-gold btn-lg flex items-center justify-center gap-2"
          >
            <Download size={18} />
            Descargar brochure PDF
          </a>
          <button onClick={() => onNavigate('contacto')} className="btn btn-outline-white btn-lg flex items-center justify-center gap-2">
            Solicitar cotización
          </button>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row gap-6 justify-center text-sm">
          <a href="tel:+573197735052"
            className="flex items-center gap-2 text-blue-100 hover:text-gold transition-colors">
            <Phone size={15} />
            319 773 5052
          </a>
          <a href="mailto:bandashowguardiareal@outlook.com"
            className="flex items-center gap-2 text-blue-100 hover:text-gold transition-colors">
            <Mail size={15} />
            bandashowguardiareal@outlook.com
          </a>
        </div>
      </div>
    </div>
  )
}
