import type { Metadata } from 'next'
import { Cinzel, Playfair_Display, Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from 'sonner'

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
  ],
  authors: [{ name: 'Corporación Musical Guardia Real de Antioquia' }],
  openGraph: {
    type:        'website',
    locale:      'es_CO',
    siteName:    'Guardia Real de Antioquia',
    title:       'Corporación Musical Guardia Real de Antioquia',
    description: 'Banda Show con más de 42 años — Disciplina, progreso y honor',
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
