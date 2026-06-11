import Image from 'next/image'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <Image
            src="/images/mascota.png"
            alt="Mascota Guardia Real"
            width={200}
            height={200}
            className="object-contain drop-shadow-2xl opacity-80 hover:opacity-100 transition-opacity duration-300"
            priority
          />
        </div>

        <p className="section-label mb-3">Error 404</p>
        <h1 className="font-display text-white text-4xl md:text-6xl font-bold uppercase tracking-widest mb-4">
          ¡Alto ahí!
        </h1>
        <div className="h-[3px] w-32 bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mb-6" />
        <p className="font-serif italic text-gray-300 text-lg mb-8">
          Esta página no existe o fue movida a otro lugar.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" className="btn btn-gold btn-lg">
            Volver al inicio
          </Link>
          <Link href="/servicios?tab=contacto" className="btn btn-outline-white btn-lg">
            Contactarnos
          </Link>
        </div>
      </div>
    </div>
  )
}
