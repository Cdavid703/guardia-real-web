import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Galería',
  description: 'Galería de fotos y videos de la Corporación Musical Guardia Real de Antioquia',
}

export default function GaleriaPage() {
  const placeholders = Array.from({ length: 12 }, (_, i) => i)

  return (
    <div>
      <div className="bg-gradient-hero py-20 text-white text-center">
        <p className="section-label mb-3">Nuestro trabajo</p>
        <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-wider mb-4">Galería</h1>
        <div className="divider-gold max-w-xs mx-auto" />
      </div>

      <div className="section-container py-16">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {['Todas', 'Desfiles', 'Concursos', 'Feria de las Flores', 'Carnaval'].map(f => (
            <button key={f} className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${f === 'Todas' ? 'bg-navy text-white border-navy' : 'bg-white text-gray-600 border-gray-200 hover:border-navy hover:text-navy'}`}>
              {f}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {placeholders.map(i => (
            <div
              key={i}
              className="aspect-square rounded-lg bg-gradient-to-br from-navy to-royal flex items-center justify-center group cursor-pointer hover:opacity-90 transition-opacity overflow-hidden"
            >
              <p className="font-display text-white/20 text-3xl font-bold group-hover:text-white/40 transition-colors">
                GRA
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <p className="text-gray-500 text-sm mb-4">
            Próximamente más fotos y videos de nuestras presentaciones.
          </p>
          <a href="https://www.instagram.com/bandashowguardiareal" target="_blank" rel="noopener noreferrer"
            className="btn btn-primary btn-md">
            Ver más en Instagram
          </a>
        </div>
      </div>
    </div>
  )
}
