import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Servicios y Contratación',
  description: 'Servicios de la Banda Show Guardia Real de Antioquia: exhibición de campo, show de recorrido, información para contratantes y formulario de contacto.',
}

export default function ServiciosLayout({ children }: { children: React.ReactNode }) {
  return children
}
