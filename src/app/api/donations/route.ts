import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { emailWrapper, infoTable, alertBox } from '@/lib/email-helpers'

const RESEND_KEY  = process.env.RESEND_API_KEY
const FROM        = process.env.EMAIL_FROM  ?? 'Guardia Real <onboarding@resend.dev>'
const ADMIN_EMAIL = process.env.CONTACT_EMAIL_TO ?? 'bandashowguardiareal@outlook.com'

const ORG = {
  name:    'CORPORACION BANDA GUARDIA REAL DE ANTIOQUIA',
  nit:     '811028220',
  cuenta:  '102-025448-84 Bancolombia — Ahorro',
  address: 'Medellín, Antioquia, Colombia',
  url:     'https://www.guardiarealdeantioquia.com',
}

function receiptNumber(): string {
  return `GRA-${Date.now().toString(36).toUpperCase()}`
}

export async function POST(req: NextRequest) {
  if (!RESEND_KEY) {
    return NextResponse.json({ ok: true, skipped: 'no email key' })
  }

  try {
    const body = await req.json()
    const { nombre, telefono, identificacion, email, monto, comentarios, evidenciaUrl } = body

    const resend  = new Resend(RESEND_KEY)
    const receipt = receiptNumber()
    const fecha   = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })

    // ── Email to donor ──────────────────────────────────────────────
    const donorContent = `
      <h2 style="font-family:Georgia,serif;color:#1B2E6E;font-size:22px;margin:0 0 4px;text-align:center;">
        ¡Gracias por tu donación!
      </h2>
      <p style="text-align:center;color:#6B7280;font-size:14px;margin:0 0 24px;">
        Tu generosidad nos permite seguir formando músicos y llevando cultura a Colombia
      </p>

      <div style="background:linear-gradient(135deg,#1B2E6E,#1B75BB);border-radius:12px;padding:20px 24px;margin-bottom:24px;text-align:center;">
        <p style="color:#F2C100;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 4px;">Comprobante de donación</p>
        <p style="color:#ffffff;font-family:Georgia,serif;font-size:24px;margin:0;letter-spacing:2px;font-weight:bold;">${receipt}</p>
        <p style="color:#93C5FD;font-size:12px;margin:4px 0 0;">${fecha}</p>
      </div>

      <h3 style="font-family:Georgia,serif;color:#1B2E6E;font-size:16px;margin:0 0 12px;">Datos del donante</h3>
      ${infoTable([
        ['Nombre',          nombre],
        ['Correo',          email],
        ['Teléfono',        telefono],
        ...(identificacion ? [['Identificación', identificacion] as [string, string]] : []),
        ...(monto          ? [['Monto donado',   `COP $${monto}`] as [string, string]] : []),
      ])}

      <h3 style="font-family:Georgia,serif;color:#1B2E6E;font-size:16px;margin:16px 0 12px;">Datos del receptor</h3>
      ${infoTable([
        ['Entidad',         ORG.name],
        ['NIT',             ORG.nit],
        ['Cuenta',          ORG.cuenta],
        ['Naturaleza',      'Corporación sin ánimo de lucro — Cultural'],
        ['Ciudad',          ORG.address],
      ])}

      ${comentarios ? `
        <div style="background:#F5F7FA;border-left:4px solid #1B75BB;padding:14px 16px;border-radius:0 8px 8px 0;margin:16px 0;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:bold;color:#8A93AA;text-transform:uppercase;">Tu mensaje para la banda</p>
          <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">${comentarios}</p>
        </div>
      ` : ''}

      <div style="background:#ECFDF5;border:1px solid #10B981;border-radius:12px;padding:16px;margin:20px 0;text-align:center;">
        <p style="margin:0 0 4px;color:#065F46;font-weight:bold;font-size:14px;">✅ Donación registrada exitosamente</p>
        <p style="margin:0;color:#047857;font-size:12px;">Hemos recibido tu registro. Si subiste un comprobante, lo revisaremos pronto.</p>
      </div>

      ${alertBox(`<strong>Nota tributaria:</strong> Si eres persona jurídica y requieres certificación formal de donación para efectos tributarios (Artículo 125 del Estatuto Tributario), escríbenos a <a href="mailto:${ADMIN_EMAIL}" style="color:#1B75BB;">${ADMIN_EMAIL}</a> indicando el comprobante Nº ${receipt} y tu información de facturación.`, 'warning')}
    `

    // ── Email to admin ──────────────────────────────────────────────
    const adminContent = `
      <h2 style="font-family:Georgia,serif;color:#1B2E6E;font-size:20px;margin:0 0 16px;">Nueva donación recibida</h2>
      <p style="color:#6B7280;font-size:13px;margin:0 0 16px;">Comprobante: <strong>${receipt}</strong></p>
      ${infoTable([
        ['Nombre',          nombre],
        ['Email',           email],
        ['Teléfono',        telefono],
        ...(identificacion ? [['Identificación', identificacion] as [string, string]] : []),
        ...(monto          ? [['Monto',          `COP $${monto}`] as [string, string]] : []),
        ['Fecha',           fecha],
      ])}
      ${comentarios ? `<p style="font-size:14px;color:#374151;"><strong>Mensaje:</strong> ${comentarios}</p>` : ''}
      ${evidenciaUrl ? `<p style="font-size:13px;"><a href="${evidenciaUrl}" style="color:#1B75BB;">Ver comprobante de transferencia</a></p>` : ''}
    `

    await Promise.all([
      resend.emails.send({
        from:    FROM,
        to:      [email],
        subject: `✅ Recibo de donación #${receipt} — Guardia Real de Antioquia`,
        html:    emailWrapper(`Recibo de donación #${receipt}`, donorContent),
      }),
      resend.emails.send({
        from:    FROM,
        to:      [ADMIN_EMAIL],
        subject: `💛 Nueva donación de ${nombre} — ${receipt}`,
        html:    emailWrapper('Nueva donación recibida', adminContent),
      }),
    ])

    return NextResponse.json({ ok: true, receipt })
  } catch (err) {
    console.error('Donations route error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
