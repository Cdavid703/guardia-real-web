import type { Metadata } from 'next'
import PageBanner from '@/components/layout/PageBanner'
import UpcomingEventsSection from '@/components/sections/UpcomingEventsSection'

export const metadata: Metadata = {
  title:       'Eventos',
  description: 'Agenda de próximas presentaciones, conciertos y eventos públicos de la Corporación Musical Guardia Real de Antioquia.',
}

export default function EventosPage() {
  return (
    <div>
      <PageBanner
        image="/images/banners/banner-galeria.jpg"
        eyebrow="Calendario público"
        title="Eventos"
        subtitle="Próximas presentaciones, conciertos y actividades"
      />

      <UpcomingEventsSection />
    </div>
  )
}
