import Image from 'next/image'

interface PageBannerProps {
  image:    string
  eyebrow?: string
  title:    string
  subtitle?: string
  alt?:     string
}

/**
 * Hero banner para páginas internas.
 * Imagen de fondo con overlay oscuro y texto centrado al estilo del sitio.
 */
export default function PageBanner({ image, eyebrow, title, subtitle, alt }: PageBannerProps) {
  return (
    <section className="relative h-[340px] md:h-[420px] w-full overflow-hidden">
      {/* Background image */}
      <Image
        src={image}
        alt={alt ?? title}
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Dark gradient overlay para legibilidad */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy/85 via-navy/70 to-navy/90" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(11,18,40,0.55)_100%)]" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
        {eyebrow && (
          <p className="text-sky text-xs md:text-sm uppercase tracking-[0.25em] font-semibold mb-3">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-white text-3xl md:text-5xl font-bold uppercase tracking-wider mb-4 drop-shadow-lg">
          {title}
        </h1>
        <div className="h-1 w-20 bg-gold rounded mb-4" />
        {subtitle && (
          <p className="font-serif italic text-gray-200 text-base md:text-lg max-w-2xl drop-shadow">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  )
}
