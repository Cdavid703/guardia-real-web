import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getAdminDb } from '@/lib/firebase-admin'
import { emailWrapper, infoTable, alertBox, callToAction } from '@/lib/email-helpers'

const RESEND_KEY = process.env.RESEND_API_KEY
const FROM       = process.env.EMAIL_FROM ?? 'Guardia Real <onboarding@resend.dev>'
const SITE       = 'https://www.guardiarealdeantioquia.com'

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
function periodoLabel(p?: string) {
  if (!p) return '—'
  const [y, m] = p.split('-')
  return `${MESES[Number(m) - 1] ?? ''} ${y}`
}
const titleCase = (s: string) => (s ?? '').trim().toLowerCase().replace(/\b([a-záéíóúñ])/g, m => m.toUpperCase())

/** Envía por correo el aviso de cobro (recordatorio de pago) a varios integrantes. */
export async function POST(req: NextRequest) {
  try {
    const { integranteIds, periodo, concepto, monto } = await req.json()
    if (!Array.isArray(integranteIds) || integranteIds.length === 0)
      return NextResponse.json({ ok: false, error: 'integranteIds requerido' }, { status: 400 })

    if (!RESEND_KEY) return NextResponse.json({ ok: false, error: 'no email key' }, { status: 500 })

    const db = getAdminDb()
    const resend = new Resend(RESEND_KEY)
    const montoTxt = monto != null ? `$${Number(monto).toLocaleString('es-CO')} COP` : null
    const conceptoTxt = String(concepto || 'Mensualidad')
    const periodoTxt = periodoLabel(periodo)

    const results: { id: string; nombre?: string; emailed?: string; skipped?: string; error?: string }[] = []

    for (const id of integranteIds as string[]) {
      try {
        const snap = await db.collection('integrantes').doc(String(id)).get()
        if (!snap.exists) { results.push({ id, skipped: 'ficha no existe' }); continue }
        const int = snap.data() as Record<string, unknown>
        const nombre = titleCase(`${int.nombre ?? ''} ${int.apellidos ?? ''}`.trim()) || 'Integrante'
        const correo = (int.correo as string) ?? ''
        if (!correo || !correo.includes('@')) { results.push({ id, nombre, skipped: 'sin correo' }); continue }

        const primerNombre = nombre.split(' ')[0]
        const content = `
          <h2 style="font-family:Georgia,serif;color:#1B2E6E;font-size:20px;margin:0 0 4px;text-align:center;">
            Recordatorio de pago 🎺
          </h2>
          <p style="text-align:center;color:#6B7280;font-size:14px;margin:0 0 20px;">
            Corporación Musical Guardia Real de Antioquia
          </p>
          ${alertBox(`Hola ${primerNombre}, te recordamos con cariño que tienes pendiente el pago de <strong>${conceptoTxt}</strong> correspondiente a <strong>${periodoTxt}</strong>.`, 'warning')}
          ${infoTable([
            ['Concepto', conceptoTxt],
            ['Periodo', periodoTxt],
            ...(montoTxt ? [['Valor a pagar', montoTxt] as [string, string]] : []),
          ])}
          <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 4px;">
            Puedes ponerte al día con el recaudador en el próximo ensayo o comunicándote con la administración.
            Tu aporte sostiene el trabajo de toda la banda. ¡Gracias por tu compromiso!
          </p>
          ${callToAction('Ir al portal', SITE)}
          <p style="text-align:center;color:#9CA3AF;font-size:12px;margin:6px 0 0;">
            Si ya realizaste este pago, por favor ignora este mensaje.
          </p>`

        await resend.emails.send({
          from: FROM,
          to: correo,
          subject: `Recordatorio: ${conceptoTxt} de ${periodoTxt} — Guardia Real`,
          html: emailWrapper('Recordatorio de pago', content),
        })
        results.push({ id, nombre, emailed: correo })
      } catch (e) {
        results.push({ id, error: String(e) })
      }
    }

    const enviados = results.filter(r => r.emailed).length
    const sinCorreo = results.filter(r => r.skipped).length
    const fallidos = results.filter(r => r.error).length
    return NextResponse.json({ ok: true, enviados, sinCorreo, fallidos, results })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
