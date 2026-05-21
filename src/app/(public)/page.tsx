import HeroSection from '@/components/sections/HeroSection'
import AboutSection from '@/components/sections/AboutSection'
import ServicesSection from '@/components/sections/ServicesSection'
import UpcomingEventsSection from '@/components/sections/UpcomingEventsSection'
import ContactCTASection from '@/components/sections/ContactCTASection'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <UpcomingEventsSection preview />
      <ServicesSection />
      <ContactCTASection />
    </>
  )
}
