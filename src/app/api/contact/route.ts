import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const TO = process.env.CONTACT_EMAIL_TO ?? 'bandashowguardiareal@outlook.com'

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: true, skipped: 'no email key' })
  }
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    const body = await req.json()
    const { name, email, phone, organization, eventType, eventDate, eventLocation, attendees, serviceType, message } = body

    const serviceLabels: Record<string, string> = {
      campo:   'Exhibición de Campo',
      desfile: 'Show de Recorrido / Desfile',
      ambos:   'Exhibición de Campo + Show de Recorrido',
    }

    const { error } = await resend.emails.send({
      from:    'Guardia Real Web <onboarding@resend.dev>',
      to:      [TO],
      replyTo: email,
      subject: `Nueva cotización — ${name} | ${eventType}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1B2E6E; color: white; padding: 24px; border-radius: 8px 8px 0 0; border-bottom: 4px solid #F2C100;">
            <h1 style="margin:0; font-size: 20px; letter-spacing: 2px; text-transform: uppercase;">
              Nueva solicitud de cotización
            </h1>
            <p style="margin: 4px 0 0; color: #5AB8E5; font-size: 13px;">
              Corporación Musical Guardia Real de Antioquia
            </p>
          </div>
          <div style="background: white; padding: 24px; border: 1px solid #D8DCE8; border-top: none; border-radius: 0 0 8px 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              ${[
                ['Nombre',        name],
                ['Email',         email],
                ['Teléfono',      phone],
                ['Organización',  organization || '—'],
                ['Tipo de evento',eventType],
                ['Fecha',         eventDate],
                ['Ubicación',     eventLocation],
                ['Asistentes',    attendees || '—'],
                ['Servicio',      serviceLabels[serviceType] || serviceType],
              ].map(([label, value]) => `
                <tr style="border-bottom: 1px solid #EEF1F6;">
                  <td style="padding: 10px 8px; font-size: 12px; font-weight: bold; color: #8A93AA; text-transform: uppercase; width: 35%;">${label}</td>
                  <td style="padding: 10px 8px; font-size: 14px; color: #111827;">${value}</td>
                </tr>
              `).join('')}
            </table>
            ${message ? `
              <div style="margin-top: 16px; background: #F5F7FA; border-left: 3px solid #1B75BB; padding: 12px; border-radius: 0 4px 4px 0;">
                <p style="margin: 0 0 4px; font-size: 11px; font-weight: bold; color: #8A93AA; text-transform: uppercase;">Mensaje adicional</p>
                <p style="margin: 0; font-size: 14px; color: #4A5068; line-height: 1.6;">${message}</p>
              </div>
            ` : ''}
            <div style="margin-top: 24px; text-align: center; padding: 16px; background: #EEF1F6; border-radius: 8px;">
              <p style="margin: 0; font-size: 12px; color: #8A93AA;">
                Esta solicitud también fue guardada en el panel de administración del sitio web.
              </p>
            </div>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: 'Email error' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Contact API error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
