import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  Download, CheckCircle, MapPin, Route, Star, Users, Calendar, Award,
  Phone, Mail, ArrowRight, Music2, Globe, Mic2,
} from 'lucide-react'
import PageBanner from '@/components/layout/PageBanner'

export const metadata: Metadata = {
  title: 'Contratar la Guardia Real de Antioquia',
  description: 'Información para contratantes y organizadores de eventos. Descarga nuestro brochure oficial con servicios, capacidad técnica y datos de contacto.',
}

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

export default function ContratarPage() {
  return (
    <div>
      <PageBanner
        image="/images/banners/banner-servicios.jpg"
        eyebrow="Para contratantes"
        title="Brochure oficial"
        subtitle="Toda la información que necesitas para contratar la Guardia Real de Antioquia"
      />

      {/* Download CTA */}
      <section className="py-10 bg-gold">
        <div className="section-container flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="font-display text-near-black text-xl font-bold uppercase tracking-wider">
              Descarga nuestro brochure completo
            </h2>
            <p className="text-near-black/70 text-sm mt-1">
              PDF con toda la información, fotos, servicios y datos de contacto
            </p>
          </div>
          <a
            href="/brochure.pdf"
            download="Brochure-Guardia-Real-Antioquia.pdf"
            className="btn btn-md bg-near-black text-white hover:bg-navy transition-colors flex items-center gap-2 shrink-0"
          >
            <Download size={18} />
            Descargar brochure PDF
          </a>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-white">
        <div className="section-container">
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
        </div>
      </section>

      {/* Quiénes somos */}
      <section className="py-16 bg-[#F5F7FA]">
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="section-label mb-3">Quiénes somos</p>
              <h2 className="font-display text-navy text-3xl font-bold uppercase tracking-wider mb-4">
                Corporación Musical<br />
                <span className="text-gold">Guardia Real de Antioquia</span>
              </h2>
              <div className="divider-gold max-w-[120px] mb-6" />
              <p className="text-gray-600 leading-relaxed mb-4">
                Somos una corporación cultural sin ánimo de lucro fundada en 1982, dedicada a la
                formación musical y a la difusión de la cultura a través de espectáculos de alta calidad.
              </p>
              <p className="text-gray-600 leading-relaxed mb-6">
                Contamos con más de 60 músicos, bailarines y artistas especializados en bandas show
                estilo campo y recorrido, con un repertorio que combina música tropical, latina y
                marchas de concierto.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Globe size={16} className="text-royal shrink-0" />
                  Medellín — Antioquia, Colombia
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Mic2 size={16} className="text-royal shrink-0" />
                  Géneros: Tropical, Latina, Marcial
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-64 h-64 rounded-full bg-gradient-primary flex items-center justify-center shadow-2xl">
                  <Image
                    src="/images/escudo-removebg.png"
                    alt="Escudo Guardia Real de Antioquia"
                    width={200}
                    height={200}
                    className="object-contain"
                  />
                </div>
                <div className="absolute -bottom-4 -right-4 bg-gold rounded-2xl px-4 py-2 shadow-lg">
                  <p className="font-display text-near-black text-xs font-bold uppercase tracking-wider">Desde 1982</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section className="py-16 bg-white">
        <div className="section-container">
          <div className="text-center mb-12">
            <p className="section-label mb-3">Lo que ofrecemos</p>
            <h2 className="font-display text-navy text-3xl font-bold uppercase tracking-wider mb-4">
              Nuestros <span className="text-gold">Servicios</span>
            </h2>
            <div className="divider-gold max-w-xs mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SERVICES.map(({ icon: Icon, title, subtitle, color, details }) => (
              <div key={title} className="card overflow-hidden">
                <div className={`bg-gradient-to-br ${color} p-6 text-white`}>
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                    <Icon size={20} />
                  </div>
                  <p className="text-white/70 text-xs font-bold tracking-wider uppercase mb-1">{subtitle}</p>
                  <h3 className="font-display text-xl font-bold uppercase tracking-wider">{title}</h3>
                </div>
                <div className="p-6">
                  <ul className="space-y-2">
                    {details.map(d => (
                      <li key={d} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle size={14} className="text-royal shrink-0 mt-0.5" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Por qué elegirnos */}
      <section className="py-16 bg-[#F5F7FA]">
        <div className="section-container">
          <div className="text-center mb-12">
            <p className="section-label mb-3">Nuestra propuesta de valor</p>
            <h2 className="font-display text-navy text-3xl font-bold uppercase tracking-wider mb-4">
              ¿Por qué elegirnos?
            </h2>
            <div className="divider-gold max-w-xs mx-auto" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {WHY_US.map(({ title, desc }) => (
              <div key={title} className="card p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle size={18} className="text-gold shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-serif font-bold text-navy text-base mb-1">{title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Eventos destacados */}
      <section className="py-16 bg-near-black text-white">
        <div className="section-container">
          <div className="text-center mb-10">
            <p className="section-label mb-3">Trayectoria</p>
            <h2 className="font-display text-3xl font-bold uppercase tracking-wider mb-4">
              Eventos <span className="text-gold">destacados</span>
            </h2>
            <div className="divider-gold max-w-xs mx-auto" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {NOTABLE.map(ev => (
              <div key={ev}
                className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <Star size={14} className="text-gold shrink-0" />
                <p className="text-sm text-gray-200">{ev}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Información técnica */}
      <section className="py-16 bg-white">
        <div className="section-container">
          <div className="text-center mb-12">
            <p className="section-label mb-3">Datos técnicos</p>
            <h2 className="font-display text-navy text-3xl font-bold uppercase tracking-wider mb-4">
              Información técnica
            </h2>
            <div className="divider-gold max-w-xs mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="card p-6">
              <h3 className="font-serif font-bold text-navy text-lg mb-4">Secciones de la banda</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                {[
                  '🎺 Sección de metales (brass)',
                  '🪗 Sección de vientos',
                  '🥁 Sección de percusión',
                  '🚩 Color guard (banderas y sables)',
                  '💃 Cuerpo de danza',
                ].map(s => <li key={s} className="flex items-center gap-2">{s}</li>)}
              </ul>
            </div>
            <div className="card p-6">
              <h3 className="font-serif font-bold text-navy text-lg mb-4">Requisitos del espacio</h3>
              <ul className="space-y-2 text-sm text-gray-700">
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
        </div>
      </section>

      {/* CTA final */}
      <section className="py-16 bg-gradient-primary text-white">
        <div className="section-container text-center">
          <h2 className="font-display text-3xl font-bold uppercase tracking-wider mb-4">
            ¿Listo para contratar?
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
            Contáctanos directamente o descarga el brochure completo con toda la información,
            tarifas y condiciones.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/brochure.pdf"
              download="Brochure-Guardia-Real-Antioquia.pdf"
              className="btn btn-gold btn-lg flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Descargar brochure PDF
            </a>
            <Link href="/contacto" className="btn btn-outline-white btn-lg flex items-center justify-center gap-2">
              Solicitar cotización
              <ArrowRight size={16} />
            </Link>
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
      </section>
    </div>
  )
}
