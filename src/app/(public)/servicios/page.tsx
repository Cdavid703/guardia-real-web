import type { Metadata } from 'next'
import ServicesSection from '@/components/sections/ServicesSection'
import ContactCTASection from '@/components/sections/ContactCTASection'
import PageBanner from '@/components/layout/PageBanner'

export const metadata: Metadata = {
  title: 'Servicios',
  description: 'Servicios de la Banda Show Guardia Real de Antioquia: exhibición de campo y show de recorrido.',
}

export default function ServiciosPage() {
  return (
    <div>
      <PageBanner
        image="/images/banners/banner-servicios.jpg"
        eyebrow="Lo que ofrecemos"
        title="Nuestros servicios"
        subtitle="Llevamos la música y la cultura a tu evento con 42 años de experiencia"
      />
      <ServicesSection />
      <ContactCTASection />
    </div>
  )
}
