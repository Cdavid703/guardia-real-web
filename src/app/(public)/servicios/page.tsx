import type { Metadata } from 'next'
import ServicesSection from '@/components/sections/ServicesSection'
import ContactCTASection from '@/components/sections/ContactCTASection'

export const metadata: Metadata = {
  title: 'Servicios',
  description: 'Servicios de la Banda Show Guardia Real de Antioquia: exhibición de campo y show de recorrido.',
}

export default function ServiciosPage() {
  return (
    <div>
      <div className="bg-gradient-hero py-20 text-white text-center">
        <p className="section-label mb-3">Lo que ofrecemos</p>
        <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-wider mb-4">
          Nuestros servicios
        </h1>
        <div className="divider-gold max-w-xs mx-auto mb-4" />
        <p className="font-serif italic text-gray-300 text-lg max-w-xl mx-auto">
          Llevamos la música y la cultura a tu evento con 42 años de experiencia
        </p>
      </div>
      <ServicesSection />
      <ContactCTASection />
    </div>
  )
}
