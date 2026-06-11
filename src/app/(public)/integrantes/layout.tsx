import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Integrantes',
  description: 'Espacio exclusivo para los integrantes de la Banda Show Guardia Real de Antioquia: uniformes, noticias internas, ensayos y viajes.',
}

export default function IntegrantesLayout({ children }: { children: React.ReactNode }) {
  return children
}
