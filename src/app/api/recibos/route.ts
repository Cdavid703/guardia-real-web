import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getAdminDb } from '@/lib/firebase-admin'
import { emailWrapper, infoTable, alertBox } from '@/lib/email-helpers'

const RESEND_KEY = process.env.RESEND_API_KEY
const FROM       = process.env.EMAIL_FROM ?? 'Guardia Real <onboarding@resend.dev>'
const SITE       = 'https://www.guardiarealdeantioquia.com'

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
function periodoLabel(p?: string) {
  if (!p) return '—'
  const [y, m] = p.split('-')
  return `${MESES[Number(m) - 1] ?? ''} ${y}`
}

export async function POST(req: NextRequest) {
  try {
    const { pagoId } = await req.json()
    if (!pagoId) return NextResponse.json({ ok: false, error: 'pagoId requerido' }, { status: 400 })

    const db = getAdminDb()
    const snap = await db.collection('pagos').doc(String(pagoId)).get()
    if (!snap.exists) return NextResponse.json({ ok: false, error: 'pago no existe' }, { status: 404 })
    const pago = snap.data() as Record<string, unknown>

    const intSnap = await db.collection('integrantes').doc(String(pago.integranteId)).get()
    const integrante = intSnap.exists ? (intSnap.data() as Record<string, unknown>) : null
    const correo = (integrante?.correo as string) ?? ''

    const url = `${SITE}/recibo/${pagoId}?t=${pago.token ?? ''}`

    if (!RESEND_KEY) return NextResponse.json({ ok: true, url, skipped: 'no email key' })
    if (!correo || !correo.includes('@')) return NextResponse.json({ ok: true, url, skipped: 'integrante sin correo' })

    const nombre = (pago.integranteNombre as string) || `${integrante?.nombre ?? ''}`.trim() || 'Integrante'
    const monto = pago.monto != null ? `$${Number(pago.monto).toLocaleString('es-CO')} COP` : null

    const content = `
      <h2 style="font-family:Georgia,serif;color:#1B2E6E;font-size:20px;margin:0 0 4px;text-align:center;">
        ¡Pago registrado! 🎺
      </h2>
      <p style="text-align:center;color:#6B7280;font-size:14px;margin:0 0 20px;">
        Gracias por tu aporte a la Guardia Real de Antioquia
      </p>
      ${alertBox(`Hola ${nombre}, registramos tu pago y este es tu comprobante oficial.`, 'success')}
      ${infoTable([
        ['Recibo N.º', String(pago.reciboNumero ?? pagoId)],
        ['Concepto', String(pago.concepto ?? 'Mensualidad')],
        ['Periodo', periodoLabel(pago.periodo as string)],
        ...(monto ? [['Valor', monto] as [string, string]] : []),
        ['Fecha', new Date().toLocaleDateString('es-CO', { timeZone: 'America/Bogota', day: 'numeric', month: 'long', year: 'numeric' })],
      ])}
      <p style="text-align:center;margin:22px 0 0;">
        <a href="${url}"
           style="display:inline-block;background:#1B2E6E;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:bold;">
          Ver mi recibo oficial
        </a>
      </p>
      <p style="text-align:center;color:#9CA3AF;font-size:12px;margin:14px 0 0;">
        Desde el recibo puedes imprimirlo o guardarlo como PDF.
      </p>`

    const resend = new Resend(RESEND_KEY)
    await resend.emails.send({
      from: FROM,
      to: correo,
      subject: `Recibo ${pago.reciboNumero ?? ''} — ${pago.concepto ?? 'Pago'} Guardia Real`,
      html: emailWrapper('Recibo de pago', content),
    })

    return NextResponse.json({ ok: true, url, emailed: correo })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
