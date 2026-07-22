import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getAdminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

const TO = process.env.CONTACT_EMAIL_TO ?? 'bandashowguardiareal@outlook.com'

const NIVEL: Record<string, string> = {
  ninguna:    'Sin experiencia',
  basica:     'Básica',
  intermedia: 'Intermedia',
  avanzada:   'Avanzada',
}

export async function POST(req: NextRequest) {
  try {
    const d = await req.json()

    // Save to Firestore via Admin SDK (bypasses client security rules)
    const db = getAdminDb()
    await db.collection('ingresos').add({
      ...d,
      status:    'nuevo',
      createdAt: FieldValue.serverTimestamp(),
    })

    // Send email notification (best-effort)
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from:    'Guardia Real Web <onboarding@resend.dev>',
        to:      [TO],
        replyTo: d.email,
        subject: `🎺 Nueva solicitud de ingreso — ${d.nombreCompleto}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#1B2E6E;color:white;padding:24px;border-radius:8px 8px 0 0;border-bottom:4px solid #F2C100;">
              <h1 style="margin:0;font-size:20px;letter-spacing:2px;text-transform:uppercase;">
                Nueva solicitud de ingreso
              </h1>
              <p style="margin:4px 0 0;color:#5AB8E5;font-size:13px;">
                Corporación Musical Guardia Real de Antioquia
              </p>
            </div>
            <div style="background:white;padding:24px;border:1px solid #D8DCE8;border-top:none;border-radius:0 0 8px 8px;">
              <table style="width:100%;border-collapse:collapse;">
                ${[
                  ['Nombre completo',      d.nombreCompleto],
                  ['Identificación',       d.identificacion],
                  ['Correo electrónico',   d.email],
                  ['Teléfono / WhatsApp',  d.telefono],
                  ['Fecha de nacimiento',  d.fechaNacimiento],
                  ['Barrio',               d.barrio],
                  ['Ciudad',               d.ciudad],
                  ['Instrumento de interés', d.instrumentoInteres],
                  ['Instrumento propio',        d.instrumentoPropio ? 'Sí' : 'No'],
                  ['Experiencia previa',        d.experienciaPrevia ? 'Sí' : 'No'],
                  ...(d.experienciaPrevia && d.instrumentosExperiencia
                    ? [['Instrumento(s) / Banda(s)', d.instrumentosExperiencia]] as [string, string][]
                    : []),
                  ['Nivel de experiencia',      NIVEL[d.nivelExperiencia] || d.nivelExperiencia],
                  ['Disponibilidad',       d.disponibilidad],
                  ['¿Cómo se enteró?',     d.comoSeEntero],
                ].map(([label, value]) => `
                  <tr style="border-bottom:1px solid #EEF1F6;">
                    <td style="padding:10px 8px;font-size:12px;font-weight:bold;color:#8A93AA;text-transform:uppercase;width:35%;">${label}</td>
                    <td style="padding:10px 8px;font-size:14px;color:#111827;">${value}</td>
                  </tr>
                `).join('')}
              </table>
              ${d.mensaje ? `
                <div style="margin-top:16px;background:#F5F7FA;border-left:3px solid #F2C100;padding:12px;border-radius:0 4px 4px 0;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:bold;color:#8A93AA;text-transform:uppercase;">Mensaje adicional</p>
                  <p style="margin:0;font-size:14px;color:#4A5068;line-height:1.6;">${d.mensaje}</p>
                </div>
              ` : ''}
              <div style="margin-top:24px;text-align:center;padding:16px;background:#EEF1F6;border-radius:8px;">
                <p style="margin:0;font-size:12px;color:#8A93AA;">
                  Esta solicitud quedó registrada en el panel de administración del sitio.
                </p>
              </div>
            </div>
          </div>
        `,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Ingresos API error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
