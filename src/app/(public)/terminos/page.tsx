import type { Metadata } from 'next'
import PageBanner from '@/components/layout/PageBanner'

export const metadata: Metadata = {
  title:       'Términos y condiciones',
  description: 'Términos y condiciones de uso del sitio web de la Corporación Musical Guardia Real de Antioquia.',
}

export default function TerminosPage() {
  return (
    <div>
      <PageBanner
        image="/images/banners/banner-servicios.jpg"
        eyebrow="Condiciones de uso"
        title="Términos y condiciones"
        subtitle="Reglas de uso del sitio y los servicios"
      />

      <div className="section-container py-16 max-w-3xl">
        <article className="prose-custom text-gray-600 space-y-6">
          <p className="text-sm text-gray-400">Última actualización: {new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

          <section>
            <h2 className="font-serif text-navy text-xl font-bold mb-2">1. Aceptación de los términos</h2>
            <p>
              Al acceder y utilizar el sitio web de la Corporación Musical Guardia Real de Antioquia
              aceptas estos términos y condiciones en su totalidad. Si no estás de acuerdo, te
              pedimos abstenerte de usar el sitio.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-navy text-xl font-bold mb-2">2. Uso del sitio</h2>
            <p>El sitio se ofrece para que puedas:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Conocer la historia, servicios y trayectoria de la banda.</li>
              <li>Solicitar cotizaciones para presentaciones.</li>
              <li>Postularte como integrante.</li>
              <li>Acceder al portal interno (solo integrantes autorizados).</li>
            </ul>
            <p className="mt-2">
              Te comprometes a usar el sitio de forma respetuosa, sin intentar acceder a áreas
              restringidas, sin realizar ingeniería inversa, sin enviar contenido ofensivo y sin
              afectar la disponibilidad del servicio.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-navy text-xl font-bold mb-2">3. Propiedad intelectual</h2>
            <p>
              El nombre, escudo, mascota, fotografías, videos, textos y demás contenido publicado
              en este sitio son propiedad de la Corporación Musical Guardia Real de Antioquia o se
              usan con autorización. No está permitida su reproducción, distribución o uso comercial
              sin nuestra autorización escrita.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-navy text-xl font-bold mb-2">4. Solicitudes y cotizaciones</h2>
            <p>
              Las cotizaciones enviadas a través del formulario son preliminares. La contratación
              definitiva se formaliza mediante contrato firmado entre las partes. La Corporación se
              reserva el derecho de aceptar o rechazar cualquier solicitud.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-navy text-xl font-bold mb-2">5. Solicitudes de ingreso</h2>
            <p>
              Llenar el formulario de ingreso no garantiza la admisión a la banda. El proceso
              incluye revisión por parte de la directiva, audición y, en algunos casos, periodo
              de prueba. Las decisiones son discrecionales y comunicadas directamente al postulante.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-navy text-xl font-bold mb-2">6. Limitación de responsabilidad</h2>
            <p>
              El sitio se ofrece &ldquo;tal cual&rdquo;. No garantizamos disponibilidad ininterrumpida ni
              ausencia total de errores. No nos hacemos responsables por daños indirectos derivados
              del uso o imposibilidad de uso del sitio.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-navy text-xl font-bold mb-2">7. Modificaciones</h2>
            <p>
              Podemos modificar estos términos en cualquier momento. La versión vigente será la
              publicada en esta página. Te recomendamos revisarla periódicamente.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-navy text-xl font-bold mb-2">8. Ley aplicable</h2>
            <p>
              Estos términos se rigen por las leyes de la República de Colombia. Cualquier
              controversia se resolverá ante los jueces competentes de Medellín, Colombia.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-navy text-xl font-bold mb-2">9. Contacto</h2>
            <p>
              Para dudas sobre estos términos, escríbenos a{' '}
              <a href="mailto:bandashowguardiareal@outlook.com" className="text-royal hover:underline">bandashowguardiareal@outlook.com</a>.
            </p>
          </section>
        </article>
      </div>
    </div>
  )
}
