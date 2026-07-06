import type { Metadata } from 'next'
import { Cinzel, Playfair_Display, Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from 'sonner'
import { Analytics } from '@vercel/analytics/next'

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '600', '700', '900'],
  variable: '--font-cinzel',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

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
    <html
      lang="es"
      className={`${cinzel.variable} ${playfair.variable} ${inter.variable}`}
    >
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
