import Link from 'next/link'
import { Phone, Mail, MapPin } from 'lucide-react'

export default function ContactCTASection() {
  return (
    <section className="py-24 bg-navy">
      <div className="section-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div>
            <p className="section-label mb-3">¿Listo para contratar?</p>
            <h2 className="font-display text-white text-3xl md:text-4xl font-bold uppercase tracking-wider mb-4">
              Contáctanos
            </h2>
            <div className="h-1 w-16 bg-gold rounded mb-6" />
            <p className="text-gray-300 leading-relaxed mb-8 text-base">
              Estamos disponibles para presentaciones en Medellín y toda Colombia.
              Escríbenos o llámanos para revisar disponibilidad y costos.
            </p>

            <div className="space-y-4">
              {[
                { icon: Phone, label: '319 773 5052', href: 'tel:+573197735052' },
                { icon: Phone, label: '310 509 4658', href: 'tel:+573105094658' },
                { icon: Mail,  label: 'bandashowguardiareal@outlook.com', href: 'mailto:bandashowguardiareal@outlook.com' },
                { icon: MapPin,label: 'Cra. 48 A #73–36, Campo Valdés, Medellín', href: '#' },
              ].map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="flex items-center gap-3 text-gray-300 hover:text-gold transition-colors text-sm"
                >
                  <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center shrink-0">
                    <Icon size={15} className="text-gold" />
                  </div>
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Right */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
            <p className="font-serif italic text-gold text-xl mb-4">
              &ldquo;Disciplina, progreso y honor&rdquo;
            </p>
            <p className="text-gray-300 text-sm leading-relaxed mb-8">
              Solicita tu cotización gratuita y recibe respuesta en menos de 24 horas.
              Adaptamos cada presentación a tu evento.
            </p>
            <Link href="/servicios?tab=contacto" className="btn btn-gold btn-xl w-full justify-center mb-4">
              Solicitar cotización
            </Link>
            <Link href="/servicios" className="btn btn-outline-white btn-md w-full justify-center">
              Ver servicios
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
