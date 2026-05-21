import type { Metadata } from 'next'
import { Award, Music2, Users, MapPin } from 'lucide-react'
import PageBanner from '@/components/layout/PageBanner'

export const metadata: Metadata = {
  title: 'Quiénes somos',
  description: 'Conoce la historia, misión y visión de la Corporación Musical Guardia Real de Antioquia',
}

const TIMELINE = [
  { year: '1983', event: 'Fundación como Banda Juvenil Campo Valdés el 22 de agosto en Medellín.' },
  { year: '1990s', event: 'Primeros reconocimientos en concursos locales y regionales de Antioquia.' },
  { year: '2000s', event: 'Consolidación en categoría show. Participación en Feria de Manizales y Carnaval de Barranquilla.' },
  { year: '2015', event: 'Operación de Fusiones de Bandas para el Desfile de Silleteros de Medellín.' },
  { year: '2023', event: 'Participación en el Desfile Batalla de Flores, Carnaval de Barranquilla.' },
  { year: '2026', event: 'Más de 42 años de historia. Referente cultural en Colombia.' },
]

const ACHIEVEMENTS = [
  { icon: Award,  title: 'Desfile de Silleteros', desc: 'Apertura y cierre del desfile más icónico de Medellín en múltiples ediciones.' },
  { icon: Music2, title: 'Categoría Show',        desc: 'Máxima categoría en bandas de marcha. Reconocidos a nivel nacional.' },
  { icon: Users,  title: 'Comunidad',             desc: 'Más de 100 integrantes activos entre músicos, bailarines y artistas.' },
  { icon: MapPin, title: 'Campo Valdés',          desc: 'Raíces comunitarias en el barrio Campo Valdés, Medellín.' },
]

export default function NosotrosPage() {
  return (
    <div>
      <PageBanner
        image="/images/banners/banner-nosotros.jpg"
        eyebrow="Nuestra historia"
        title="Quiénes somos"
        subtitle='"Disciplina, progreso y honor"'
      />

      {/* Intro */}
      <section className="py-16 bg-white">
        <div className="section-container max-w-3xl">
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            La <strong className="text-navy">Corporación Musical Guardia Real de Antioquia</strong> es
            una entidad cultural sin ánimo de lucro fundada el <strong>22 de agosto de 1983</strong> en
            Medellín, originalmente como Banda Juvenil Campo Valdés.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            A lo largo de sus más de 42 años de trayectoria, la institución ha sido considerada
            una de las mejores bandas de Colombia, ocupando los primeros puestos en concursos
            locales y nacionales, y participando en los eventos más importantes del país.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Nuestra propuesta artística combina la interpretación de vientos maderas, bronces,
            percusión latina y tradicional, junto con un grupo de bailarines, creando espectáculos
            únicos que fusionan la disciplina musical con la expresión artística.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-[#F5F7FA]">
        <div className="section-container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-primary rounded-2xl p-8 text-white">
              <p className="section-label mb-2 text-gold/80">Misión</p>
              <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-white mb-4">
                Lo que hacemos
              </h2>
              <p className="text-blue-100 leading-relaxed text-sm">
                Generar un espacio de aprendizaje para niños, jóvenes y adultos de la ciudad,
                a través de las diferentes dimensiones artísticas de la música, la danza y la
                expresión corporal, fomentando la unidad, la disciplina y la creatividad;
                proporcionando una experiencia cultural de alta calidad que promueva el desarrollo
                personal y el fortalecimiento de la cultura como eje de transformación de la sociedad.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
              <p className="section-label mb-2">Visión</p>
              <h2 className="font-serif text-navy text-2xl font-bold mb-4">Hacia dónde vamos</h2>
              <p className="text-gray-600 leading-relaxed text-sm">
                Ser una banda de marcha líder en la formación artística y musical, reconocida
                por la excelencia en los procesos formativos y la contribución a la creación de
                una comunidad musical inclusiva, diversa y participativa. Inspirando a las futuras
                generaciones y fomentando la creatividad, la disciplina y el orgullo comunitario.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 bg-white">
        <div className="section-container">
          <div className="text-center mb-12">
            <p className="section-label mb-3">Nuestra trayectoria</p>
            <h2 className="font-display text-navy text-3xl font-bold uppercase tracking-wider">
              42 años de historia
            </h2>
          </div>
          <div className="relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 -translate-x-1/2 hidden md:block" />
            <div className="space-y-8">
              {TIMELINE.map(({ year, event }, i) => (
                <div key={year} className={`flex flex-col md:flex-row gap-4 md:gap-8 items-start ${i % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                  <div className="md:w-1/2 flex justify-center">
                    <div className="bg-navy text-white rounded-full px-4 py-2 font-display font-bold text-sm tracking-wider relative">
                      {year}
                      <div className={`hidden md:block absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gold ${i % 2 === 0 ? '-left-[calc(1.5rem+1px)]' : '-right-[calc(1.5rem+1px)]'}`} />
                    </div>
                  </div>
                  <div className="md:w-1/2 card p-4">
                    <p className="text-sm text-gray-600 leading-relaxed">{event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="py-16 bg-[#F5F7FA]">
        <div className="section-container">
          <div className="text-center mb-10">
            <p className="section-label mb-3">Logros destacados</p>
            <h2 className="font-display text-navy text-3xl font-bold uppercase tracking-wider">
              Lo que nos enorgullece
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ACHIEVEMENTS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-navy/10 flex items-center justify-center mx-auto mb-4">
                  <Icon size={22} className="text-navy" />
                </div>
                <h3 className="font-serif font-bold text-navy text-base mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
