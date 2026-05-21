import Link from 'next/link'
import { Award, Users, Music, Heart } from 'lucide-react'

const VALUES = [
  { icon: '🎯', title: 'Disciplina',    desc: 'Compromiso con la práctica y el perfeccionamiento constante.' },
  { icon: '🤝', title: 'Respeto',       desc: 'Valoración de la diversidad y la individualidad.' },
  { icon: '🎵', title: 'Pasión',        desc: 'Amor por la música, la danza y la cultura.' },
  { icon: '⭐', title: 'Perseverancia', desc: 'Entrega y superación para cumplir los objetivos.' },
]

export default function AboutSection() {
  return (
    <section id="about" className="py-24 bg-white">
      <div className="section-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left — Text */}
          <div>
            <p className="section-label mb-3">Quiénes somos</p>
            <h2 className="font-display text-navy text-3xl md:text-4xl font-bold uppercase tracking-wider mb-2">
              Una historia de
            </h2>
            <h2 className="font-display text-royal text-3xl md:text-4xl font-bold uppercase tracking-wider mb-6">
              42 años
            </h2>
            <div className="h-1 w-16 bg-gold rounded mb-8" />

            <p className="font-serif text-gray-600 text-lg italic mb-6">
              &ldquo;Nuestras raíces colombianas y latinas son la fuente de inspiración
              que nos permite llevar la música y la danza a todos los escenarios.&rdquo;
            </p>

            <p className="text-gray-600 leading-relaxed mb-4">
              La Banda Show Guardia Real de Antioquia es una corporación sin ánimo de lucro
              fundada el <strong>22 de agosto de 1983</strong> en Medellín. Nos hemos consolidado
              como una de las bandas de marcha más destacadas en la categoría show a nivel nacional.
            </p>

            <p className="text-gray-600 leading-relaxed mb-8">
              Nuestra propuesta artística combina la interpretación de vientos maderas, bronces,
              percusión latina y tradicional, junto con un grupo de bailarines, generando espacios
              de formación integral en música, danza y valores.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                { icon: Award,  label: 'Desfile de Silleteros', desc: 'Apertura y cierre' },
                { icon: Music,  label: 'Feria de las Flores',  desc: 'Primer puesto' },
                { icon: Users,  label: 'Campo Valdés',         desc: 'Nuestra comunidad' },
                { icon: Heart,  label: 'Carnaval Barranquilla',desc: 'Batalla de Flores' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="w-8 h-8 rounded bg-navy/10 flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-navy" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-dark">{label}</p>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/nosotros" className="btn btn-primary btn-lg">
              Conoce nuestra historia completa
            </Link>
          </div>

          {/* Right — Values */}
          <div>
            <div className="bg-gradient-hero rounded-2xl p-8 text-white">
              <p className="section-label mb-2">Nuestros valores</p>
              <h3 className="font-display text-2xl font-bold uppercase tracking-wider text-white mb-6">
                Lo que nos <span className="text-gold">define</span>
              </h3>

              <div className="space-y-4">
                {VALUES.map(({ icon, title, desc }) => (
                  <div
                    key={title}
                    className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <span className="text-2xl">{icon}</span>
                    <div>
                      <p className="font-semibold text-gold text-sm uppercase tracking-wider">{title}</p>
                      <p className="text-gray-300 text-sm mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="font-serif italic text-gold text-center text-lg">
                  &ldquo;Disciplina, progreso y honor&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
