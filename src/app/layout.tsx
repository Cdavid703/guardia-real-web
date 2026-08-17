import type { Metadata } from 'next'
// Fuentes auto-alojadas (@fontsource) — sin depender de Google Fonts en el build.
import '@fontsource/cinzel/400.css'
import '@fontsource/cinzel/600.css'
import '@fontsource/cinzel/700.css'
import '@fontsource/cinzel/900.css'
import '@fontsource/playfair-display/400.css'
import '@fontsource/playfair-display/600.css'
import '@fontsource/playfair-display/700.css'
import '@fontsource/playfair-display/400-italic.css'
import '@fontsource/playfair-display/600-italic.css'
import '@fontsource/playfair-display/700-italic.css'
import '@fontsource/inter/300.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from 'sonner'
import { Analytics } from '@vercel/analytics/next'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.guardiarealdeantioquia.com'),
  title: {
    template: '%s | Guardia Real de Antioquia',
    default:  'Corporación Musical Guardia Real de Antioquia',
  },
  icons: {
    icon:  '/images/escudo.png',
    apple: '/images/escudo.png',
  },
  description:
    'Banda Show con más de 42 años de trayectoria en Medellín. ' +
    'Disciplina, progreso y honor. Contrataciones y presentaciones.',
  keywords: [
    'Guardia Real de Antioquia', 'banda show', 'banda marcial', 'Medellín',
    'contratación banda', 'desfile', 'exhibición musical', 'Colombia',
    'banda de marcha', 'corporación musical', 'Campo Valdés', 'Antioquia',
  ],
  authors: [{ name: 'Corporación Musical Guardia Real de Antioquia' }],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type:        'website',
    locale:      'es_CO',
    siteName:    'Guardia Real de Antioquia',
    url:         'https://www.guardiarealdeantioquia.com',
    title:       'Corporación Musical Guardia Real de Antioquia',
    description: 'Banda Show con más de 42 años — Disciplina, progreso y honor',
    // La imagen OG se genera dinámicamente en src/app/opengraph-image.tsx
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Guardia Real de Antioquia',
    description: 'Banda Show con más de 42 años — Disciplina, progreso y honor',
  },
  robots: {
    index:  true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="min-h-screen">
        <AuthProvider>
          {children}
          <Analytics />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1B2E6E',
                color: '#fff',
                border: '1px solid #1B75BB',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
