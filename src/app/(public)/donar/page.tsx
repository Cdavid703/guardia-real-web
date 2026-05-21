import type { Metadata } from 'next'
import { Heart, CreditCard, Building2, ArrowRight } from 'lucide-react'
import PageBanner from '@/components/layout/PageBanner'

export const metadata: Metadata = {
  title:       'Apóyanos',
  description: 'Apoya a la Corporación Musical Guardia Real de Antioquia. Tu donación nos ayuda a seguir formando músicos y llevando cultura a Colombia.',
}

export default function DonarPage() {
  return (
    <div>
      <PageBanner
        image="/images/banners/banner-nosotros.jpg"
        eyebrow="Tu aporte nos impulsa"
        title="Apóyanos"
        subtitle="Cada donación ayuda a formar músicos y mantener viva la tradición"
      />

      <div className="section-container py-16 max-w-4xl">
        {/* Intro */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/10 mb-4">
            <Heart size={28} className="text-gold" />
          </div>
          <h2 className="font-serif text-navy text-2xl font-bold mb-3">
            ¿Por qué donar?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Somos una corporación cultural <strong>sin ánimo de lucro</strong> que vive del aporte
            de nuestros integrantes, de las contrataciones y del apoyo de personas como tú. Cada
            donación se destina a instrumentos, uniformes, transporte y formación musical para
            niños y jóvenes de Medellín.
          </p>
        </div>

        {/* Métodos de donación */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Bancolombia */}
          <div className="card p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-navy/10 flex items-center justify-center shrink-0">
                <Building2 size={20} className="text-navy" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-navy text-lg">Transferencia bancaria</h3>
                <p className="text-xs text-gray-400">Bancolombia · Cuenta corriente</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="bg-gray-50 rounded p-3 border border-gray-200">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Titular</p>
                <p className="font-medium text-dark">Corporación Musical Guardia Real de Antioquia</p>
              </div>
              <div className="bg-gray-50 rounded p-3 border border-gray-200">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Número de cuenta</p>
                <p className="font-mono font-medium text-dark">Por definir</p>
              </div>
              <div className="bg-gray-50 rounded p-3 border border-gray-200">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">NIT</p>
                <p className="font-mono font-medium text-dark">Por definir</p>
              </div>
            </div>
          </div>

          {/* Nequi / Daviplata */}
          <div className="card p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-navy/10 flex items-center justify-center shrink-0">
                <CreditCard size={20} className="text-navy" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-navy text-lg">Nequi / Daviplata</h3>
                <p className="text-xs text-gray-400">Pago móvil rápido</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="bg-gray-50 rounded p-3 border border-gray-200">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Nequi</p>
                <p className="font-mono font-medium text-dark">Por definir</p>
              </div>
              <div className="bg-gray-50 rounded p-3 border border-gray-200">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Daviplata</p>
                <p className="font-mono font-medium text-dark">Por definir</p>
              </div>
              <p className="text-xs text-gray-500 mt-3 italic">
                Envíanos el comprobante por WhatsApp al 319 773 5052 para registrar tu aporte.
              </p>
            </div>
          </div>
        </div>

        {/* CTA WhatsApp */}
        <div className="bg-gradient-hero text-white rounded-2xl p-8 text-center">
          <Heart size={32} className="text-gold mx-auto mb-3" />
          <h3 className="font-serif text-xl font-bold mb-2">¿Quieres apoyar de otra forma?</h3>
          <p className="text-gray-300 mb-5 max-w-lg mx-auto">
            También recibimos donaciones de instrumentos, uniformes, materiales o tu tiempo como
            voluntario. Escríbenos y coordinamos.
          </p>
          <a
            href="https://wa.me/573197735052?text=Hola,%20quiero%20apoyar%20a%20la%20Guardia%20Real%20de%20Antioquia"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-gold btn-md"
          >
            Coordinar donación
            <ArrowRight size={16} />
          </a>
        </div>

        <p className="text-xs text-gray-400 text-center mt-8">
          La Corporación Musical Guardia Real de Antioquia es una entidad sin ánimo de lucro.
          Tu donación contribuye directamente a la formación musical y la cultura.
        </p>
      </div>
    </div>
  )
}
