import type { Metadata } from 'next'
import { Award, Music2, Users, MapPin } from 'lucide-react'
import PageBanner from '@/components/layout/PageBanner'
import Accordion from '@/components/ui/Accordion'

export const metadata: Metadata = {
  title: 'Quiénes somos',
  description: 'Conoce la historia, misión y visión de la Corporación Musical Guardia Real de Antioquia',
}

const TIMELINE = [
  { year: '1983',  title: 'Fundación',                       event: 'Fundación como Banda Juvenil Campo Valdés el 22 de agosto en Medellín.' },
  { year: '1990s', title: 'Primeros reconocimientos',        event: 'Primeros reconocimientos en concursos locales y regionales de Antioquia.' },
  { year: '2000s', title: 'Consolidación categoría show',    event: 'Consolidación en categoría show. Participación en Feria de Manizales y Carnaval de Barranquilla.' },
  { year: '2015',  title: 'Desfile de Silleteros',           event: 'Operación de Fusiones de Bandas para el Desfile de Silleteros de Medellín.' },
  { year: '2023',  title: 'Carnaval de Barranquilla',        event: 'Participación en el Desfile Batalla de Flores, Carnaval de Barranquilla.' },
  { year: '2026',  title: '42 años de historia',             event: 'Más de 42 años de historia. Referente cultural en Colombia.' },
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

      {/* Acordeón principal: intro + misión + visión + historia */}
      <section className="py-16 bg-[#F5F7FA]">
        <div className="section-container max-w-4xl">
          <div className="text-center mb-10">
            <p className="section-label mb-3">Conócenos</p>
            <h2 className="font-display text-navy text-3xl font-bold uppercase tracking-wider mb-3">
              Toda nuestra historia
            </h2>
            <div className="divider-gold max-w-xs mx-auto" />
            <p className="text-gray-500 text-sm mt-4">
              Haz clic en cada sección para explorar
            </p>
          </div>

          <Accordion
            defaultOpenIds={['intro']}
            items={[
              {
                id:    'intro',
                title: '¿Quiénes somos?',
                content: (
                  <div className="space-y-3">
                    <p>
                      La <strong className="text-navy">Corporación Musical Guardia Real de Antioquia</strong> es
                      una entidad cultural sin ánimo de lucro fundada el <strong>22 de agosto de 1983</strong> en
                      Medellín, originalmente como Banda Juvenil Campo Valdés.
                    </p>
                    <p>
                      A lo largo de sus más de 42 años de trayectoria, la institución ha sido considerada
                      una de las mejores bandas de Colombia, ocupando los primeros puestos en concursos
                      locales y nacionales, y participando en los eventos más importantes del país.
                    </p>
                    <p>
                      Nuestra propuesta artística combina la interpretación de vientos maderas, bronces,
                      percusión latina y tradicional, junto con un grupo de bailarines, creando espectáculos
                      únicos que fusionan la disciplina musical con la expresión artística.
                    </p>
                  </div>
                ),
              },
              {
                id:    'mision',
                title: 'Misión — Lo que hacemos',
                content: (
                  <p>
                    Generar un espacio de aprendizaje para niños, jóvenes y adultos de la ciudad,
                    a través de las diferentes dimensiones artísticas de la música, la danza y la
                    expresión corporal, fomentando la unidad, la disciplina y la creatividad;
                    proporcionando una experiencia cultural de alta calidad que promueva el desarrollo
                    personal y el fortalecimiento de la cultura como eje de transformación de la sociedad.
                  </p>
                ),
              },
              {
                id:    'vision',
                title: 'Visión — Hacia dónde vamos',
                content: (
                  <p>
                    Ser una banda de marcha líder en la formación artística y musical, reconocida
                    por la excelencia en los procesos formativos y la contribución a la creación de
                    una comunidad musical inclusiva, diversa y participativa. Inspirando a las futuras
                    generaciones y fomentando la creatividad, la disciplina y el orgullo comunitario.
                  </p>
                ),
              },
              {
                id:    'trayectoria',
                title: '42 años de trayectoria',
                content: (
                  <div className="space-y-3">
                    {TIMELINE.map(({ year, title, event }) => (
                      <div key={year} className="flex gap-4 items-start">
                        <div className="bg-navy text-white rounded-full px-3 py-1 font-display font-bold text-xs tracking-wider shrink-0 min-w-[64px] text-center">
                          {year}
                        </div>
                        <div>
                          <p className="font-semibold text-navy text-sm">{title}</p>
                          <p className="text-gray-500 text-xs mt-0.5">{event}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ),
              },
            ]}
          />
        </div>
      </section>

      {/* Achievements — se mantienen como tarjetas visuales */}
      <section className="py-16 bg-white">
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
