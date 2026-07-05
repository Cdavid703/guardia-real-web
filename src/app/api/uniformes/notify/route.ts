import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { emailWrapper, infoTable, alertBox } from '@/lib/email-helpers'

const RESEND_KEY  = process.env.RESEND_API_KEY
const FROM        = process.env.EMAIL_FROM  ?? 'Guardia Real <onboarding@resend.dev>'
const ADMIN_EMAIL = process.env.CONTACT_EMAIL_TO ?? 'bandashowguardiareal@outlook.com'

export async function POST(req: NextRequest) {
  if (!RESEND_KEY) return NextResponse.json({ ok: true, skipped: 'no email key' })

  try {
    const { prendaLabel, integrante, tipo, talla } = await req.json()
    const label = String(prendaLabel ?? 'prenda')
    const fecha = new Date().toLocaleString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    const confirmada = tipo === 'confirmada'

    const titulo = confirmada
      ? `${integrante} confirmó su ${label}`
      : `${integrante} respondió que NO tiene su ${label}`

    const content = `
      <h2 style="font-family:Georgia,serif;color:#1B2E6E;font-size:20px;margin:0 0 4px;text-align:center;">
        Control de uniformes
      </h2>
      <p style="text-align:center;color:#6B7280;font-size:14px;margin:0 0 20px;">Novedad en la ${label}</p>
      ${confirmada
        ? alertBox(`✅ ${integrante} confirmó y firmó que tiene su ${label}.`, 'success')
        : alertBox(`⚠️ ${integrante} indicó que no tiene su ${label}. Puedes volver a preguntarle más adelante.`, 'warning')}
      ${infoTable([
        ['Integrante', integrante],
        ['Prenda', label.charAt(0).toUpperCase() + label.slice(1)],
        ['Respuesta', confirmada ? 'Sí, la tiene (firmada)' : 'No la tiene'],
        ...(confirmada && talla ? [['Talla', String(talla)] as [string, string]] : []),
        ['Fecha', fecha],
      ])}
      <p style="text-align:center;margin:20px 0 0;">
        <a href="https://www.guardiarealdeantioquia.com/dashboard/admin/uniformes"
           style="display:inline-block;background:#1B2E6E;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;">
          Ver control de uniformes
        </a>
      </p>`

    const resend = new Resend(RESEND_KEY)
    await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `Uniformes — ${titulo}`,
      html: emailWrapper('Control de uniformes', content),
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
