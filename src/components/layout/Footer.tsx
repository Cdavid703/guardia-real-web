import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Phone, Mail, Instagram, Facebook, Youtube, Heart } from 'lucide-react'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-near-black text-gray-300">
      {/* Gold divider */}
      <div className="h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />

      <div className="section-container py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

        {/* ── Brand ── */}
        <div className="lg:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <Image src="/images/escudo.png" alt="Escudo" width={44} height={44} className="object-contain" />
            <div>
              <p className="font-display text-white text-sm font-bold tracking-[0.06em] uppercase">
                Guardia Real
              </p>
              <p className="text-sky text-xs tracking-wider uppercase">de Antioquia</p>
            </div>
          </div>
          <p className="font-serif italic text-gold text-sm mb-4">
            &ldquo;Disciplina, progreso y honor&rdquo;
          </p>
          <p className="text-xs text-gray-500 leading-relaxed mb-4">
            Corporación Musical Guardia Real de Antioquia.<br/>
            Más de 42 años formando músicos y transformando vidas.
          </p>
          <Image
            src="/images/mascota.png"
            alt="Mascota Guardia Real"
            width={90}
            height={90}
            className="object-contain opacity-80 hover:opacity-100 transition-opacity"
          />
        </div>

        {/* ── Links ── */}
        <div>
          <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Navegación</h4>
          <ul className="space-y-2">
            {[
              { href: '/',          label: 'Inicio' },
              { href: '/nosotros',  label: 'Quiénes somos' },
              { href: '/servicios', label: 'Servicios' },
              { href: '/eventos',    label: 'Eventos' },
              { href: '/galeria',    label: 'Galería' },
              { href: '/noticias',   label: 'Noticias' },
              { href: '/servicios?tab=contratantes', label: 'Contratantes' },
              { href: '/servicios?tab=contacto',     label: 'Contacto' },
            ].map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="text-sm hover:text-gold transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Contact ── */}
        <div>
          <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Contacto</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <MapPin size={15} className="text-gold shrink-0 mt-0.5" />
              <span>Cra. 48 A # 73–36, Campo Valdés,<br/>Medellín, Antioquia</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone size={15} className="text-gold shrink-0" />
              <a href="tel:+573197735052" className="hover:text-gold transition-colors">
                319 773 5052
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Phone size={15} className="text-gold shrink-0" />
              <a href="tel:+573105094658" className="hover:text-gold transition-colors">
                310 509 4658
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail size={15} className="text-gold shrink-0" />
              <a
                href="mailto:bandashowguardiareal@outlook.com"
                className="hover:text-gold transition-colors text-xs break-all"
              >
                bandashowguardiareal@outlook.com
              </a>
            </li>
          </ul>
        </div>

        {/* ── Social ── */}
        <div>
          <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Redes sociales</h4>
          <div className="flex gap-3 mb-6">
            <a
              href="https://www.instagram.com/bandashowguardiareal"
              target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 rounded-md bg-white/10 flex items-center justify-center hover:bg-gold hover:text-near-black transition-all"
            >
              <Instagram size={16} />
            </a>
            <a
              href="https://m.facebook.com/bandashowguardiarealdeantioquia/"
              target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 rounded-md bg-white/10 flex items-center justify-center hover:bg-gold hover:text-near-black transition-all"
            >
              <Facebook size={16} />
            </a>
            <a
              href="https://youtube.com"
              target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 rounded-md bg-white/10 flex items-center justify-center hover:bg-gold hover:text-near-black transition-all"
            >
              <Youtube size={16} />
            </a>
          </div>
          <Link
            href="/servicios?tab=contacto"
            className="btn btn-gold btn-sm w-full justify-center mb-2"
          >
            Solicitar cotización
          </Link>
          <Link
            href="/donar"
            className="btn btn-outline-white btn-sm w-full justify-center"
          >
            <Heart size={14} />
            Apóyanos
          </Link>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-white/10">
        <div className="section-container py-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-600">
          <span>© {year} Corporación Musical Guardia Real de Antioquia. Todos los derechos reservados.</span>
          <div className="flex items-center gap-4">
            <Link href="/privacidad" className="hover:text-gold transition-colors">Privacidad</Link>
            <Link href="/terminos" className="hover:text-gold transition-colors">Términos</Link>
            <Link href="/login" className="hover:text-gold transition-colors">Acceso integrantes</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
