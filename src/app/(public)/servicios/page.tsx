'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Music2, Briefcase, Mail } from 'lucide-react'
import PageBanner from '@/components/layout/PageBanner'
import Tabs from '@/components/ui/Tabs'
import ServiciosTab from './ServiciosTab'
import ContratantesTab from './ContratantesTab'
import ContactoTab from './ContactoTab'

const TABS = [
  { id: 'servicios',    label: 'Servicios',    icon: Music2 },
  { id: 'contratantes', label: 'Contratantes', icon: Briefcase },
  { id: 'contacto',     label: 'Contacto',     icon: Mail },
]

function ServiciosContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initial = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(
    TABS.some(t => t.id === initial) ? (initial as string) : 'servicios'
  )

  const handleChange = (id: string) => {
    setActiveTab(id)
    router.replace(`/servicios?tab=${id}`, { scroll: false })
  }

  return (
    <div>
      <PageBanner
        image="/images/banners/banner-servicios.jpg"
        eyebrow="Lo que ofrecemos"
        title="Servicios y Contratación"
        subtitle="Conoce nuestros servicios, cómo contratarnos y solicita tu cotización"
      />
      <section className="py-16 bg-[#F5F7FA]">
        <div className="section-container">
          <Tabs tabs={TABS} activeTab={activeTab} onChange={handleChange} className="mb-12" />
          {activeTab === 'servicios'    && <ServiciosTab onNavigate={handleChange} />}
          {activeTab === 'contratantes' && <ContratantesTab onNavigate={handleChange} />}
          {activeTab === 'contacto'     && <ContactoTab />}
        </div>
      </section>
    </div>
  )
}

export default function ServiciosPage() {
  return (
    <Suspense fallback={null}>
      <ServiciosContent />
    </Suspense>
  )
}
