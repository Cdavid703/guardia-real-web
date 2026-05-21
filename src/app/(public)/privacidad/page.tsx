import type { Metadata } from 'next'
import PageBanner from '@/components/layout/PageBanner'

export const metadata: Metadata = {
  title:       'Política de privacidad',
  description: 'Política de tratamiento de datos personales de la Corporación Musical Guardia Real de Antioquia, conforme a la Ley 1581 de 2012.',
}

export default function PrivacidadPage() {
  return (
    <div>
      <PageBanner
        image="/images/banners/banner-nosotros.jpg"
        eyebrow="Cumplimos la Ley 1581 de 2012"
        title="Política de privacidad"
        subtitle="Tratamiento responsable de tus datos personales"
      />

      <div className="section-container py-16 max-w-3xl">
        <article className="prose-custom text-gray-600 space-y-6">
          <p className="text-sm text-gray-400">Última actualización: {new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

          <section>
            <h2 className="font-serif text-navy text-xl font-bold mb-2">1. Responsable del tratamiento</h2>
            <p>
              La <strong>Corporación Musical Guardia Real de Antioquia</strong>, entidad cultural sin
              ánimo de lucro con domicilio en Cra. 48 #73–36, Campo Valdés, Medellín, Colombia, es la
              responsable del tratamiento de los datos personales recolectados a través de este sitio web.
              Contacto: <a href="mailto:bandashowguardiareal@outlook.com" className="text-royal hover:underline">bandashowguardiareal@outlook.com</a>.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-navy text-xl font-bold mb-2">2. Finalidad del tratamiento</h2>
            <p>Los datos personales que recolectamos se usan exclusivamente para:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Atender solicitudes de cotización y contratación de servicios musicales.</li>
              <li>Procesar solicitudes de ingreso a la corporación.</li>
              <li>Mantener contacto con integrantes activos del portal interno.</li>
              <li>Enviar información sobre eventos, presentaciones y novedades (solo si lo autorizas).</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-navy text-xl font-bold mb-2">3. Datos que recolectamos</h2>
            <p>
              Según el formulario que llenes, podemos recolectar: nombre, identificación, correo
              electrónico, teléfono, dirección, fecha de nacimiento, instrumento de interés y
              experiencia musical. Solo los datos marcados con asterisco son obligatorios.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-navy text-xl font-bold mb-2">4. Tus derechos</h2>
            <p>Como titular de los datos, tienes derecho a:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Conocer, actualizar y rectificar tus datos personales.</li>
              <li>Solicitar prueba de la autorización otorgada.</li>
              <li>Ser informado sobre el uso que damos a tus datos.</li>
              <li>Revocar la autorización y/o solicitar la supresión de tus datos.</li>
              <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC).</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-navy text-xl font-bold mb-2">5. Cómo ejercer tus derechos</h2>
            <p>
              Puedes ejercer tus derechos enviando una solicitud al correo{' '}
              <a href="mailto:bandashowguardiareal@outlook.com" className="text-royal hover:underline">bandashowguardiareal@outlook.com</a>{' '}
              indicando tu nombre completo, número de identificación y la solicitud específica.
              Te responderemos en un máximo de 10 días hábiles según lo establece la ley.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-navy text-xl font-bold mb-2">6. Almacenamiento y seguridad</h2>
            <p>
              Los datos se almacenan en servidores seguros (Google Firestore con cifrado en reposo
              y en tránsito). No compartimos datos con terceros excepto cuando sea estrictamente
              necesario para cumplir con la finalidad declarada (por ejemplo, envío de correos a
              través de Resend) o cuando lo exija una autoridad competente.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-navy text-xl font-bold mb-2">7. Vigencia</h2>
            <p>
              Esta política rige a partir de la fecha de publicación y los datos se conservarán
              mientras sea necesario para cumplir la finalidad para la cual fueron recolectados,
              o hasta que el titular solicite su supresión.
            </p>
          </section>
        </article>
      </div>
    </div>
  )
}
