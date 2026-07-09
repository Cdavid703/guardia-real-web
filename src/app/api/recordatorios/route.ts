import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getAdminDb } from '@/lib/firebase-admin'
import { emailWrapper, infoTable, alertBox } from '@/lib/email-helpers'

const RESEND_KEY   = process.env.RESEND_API_KEY
const FROM         = process.env.EMAIL_FROM ?? 'Guardia Real <onboarding@resend.dev>'
const ADMIN_EMAIL  = process.env.CONTACT_EMAIL_TO ?? 'bandashowguardiareal@outlook.com'
const CRON_SECRET  = process.env.CRON_SECRET
// Enviar recordatorio individual a cada integrante con correo (por defecto NO, solo al admin)
const A_INTEGRANTES = process.env.RECORDATORIOS_A_INTEGRANTES === 'true'

/** YYYY-MM-DD en la zona horaria de Colombia. */
function fechaBogota(offsetDias = 0): string {
  const d = new Date(Date.now() + offsetDias * 86400000)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

export async function GET(req: NextRequest) {
  // Seguridad: si hay CRON_SECRET, exige el header que envía Vercel Cron.
  if (CRON_SECRET && req.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  }
  if (!RESEND_KEY) return NextResponse.json({ ok: true, skipped: 'no email key' })

  try {
    const db = getAdminDb()
    const manana = fechaBogota(1)

    // Ensayos y eventos de mañana
    const [ensSnap, evSnap] = await Promise.all([
      db.collection('ensayos').where('date', '==', manana).get(),
      db.collection('events').where('date', '==', manana).get().catch(() => ({ docs: [] as unknown[] })),
    ])
    const ensayos = ensSnap.docs.map(d => d.data() as { title?: string; startTime?: string; location?: string })
    const eventos = (evSnap.docs as { data(): unknown }[]).map(d => d.data() as { title?: string; startTime?: string; location?: string })
    const items = [
      ...ensayos.map(e => ({ tipo: 'Ensayo', ...e })),
      ...eventos.map(e => ({ tipo: 'Evento', ...e })),
    ]

    if (items.length === 0) {
      return NextResponse.json({ ok: true, manana, items: 0, mensaje: 'Sin actividades mañana' })
    }

    const resend = new Resend(RESEND_KEY)
    const fechaLegible = new Date(manana + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })

    const listaHtml = items.map(i =>
      infoTable([
        ['Actividad', `${i.tipo}: ${i.title ?? '—'}`],
        ...(i.startTime ? [['Hora', i.startTime] as [string, string]] : []),
        ...(i.location ? [['Lugar', i.location] as [string, string]] : []),
      ])).join('')

    // 1) Digest al admin (siempre)
    const adminContent = `
      <h2 style="font-family:Georgia,serif;color:#1B2E6E;font-size:20px;margin:0 0 4px;text-align:center;">Recordatorio para mañana</h2>
      <p style="text-align:center;color:#6B7280;font-size:14px;margin:0 0 16px;text-transform:capitalize;">${fechaLegible}</p>
      ${alertBox(`Mañana hay ${items.length} actividad(es) programada(s). Recuerda avisar a los integrantes por WhatsApp.`, 'info')}
      ${listaHtml}`
    await resend.emails.send({ from: FROM, to: ADMIN_EMAIL, subject: `Recordatorio — ${items.length} actividad(es) mañana`, html: emailWrapper('Recordatorio de actividades', adminContent) })

    // 2) Recordatorio individual a integrantes (opcional, según env)
    let enviados = 0
    if (A_INTEGRANTES) {
      const intSnap = await db.collection('integrantes').where('activo', '==', true).get()
      const correos = intSnap.docs
        .map(d => (d.data() as { correo?: string }).correo)
        .filter((c): c is string => !!c && c.includes('@'))
      const contentInt = `
        <h2 style="font-family:Georgia,serif;color:#1B2E6E;font-size:20px;margin:0 0 4px;text-align:center;">¡Mañana tienes actividad!</h2>
        <p style="text-align:center;color:#6B7280;font-size:14px;margin:0 0 16px;text-transform:capitalize;">${fechaLegible}</p>
        ${listaHtml}
        <p style="text-align:center;color:#6B7280;font-size:13px;">Corporación Musical Guardia Real de Antioquia</p>`
      const html = emailWrapper('Recordatorio de la banda', contentInt)
      await Promise.all(correos.map(c =>
        resend.emails.send({ from: FROM, to: c, subject: `Recordatorio: mañana hay ${items[0].tipo.toLowerCase()}`, html }).then(() => { enviados++ }).catch(() => {}),
      ))
    }

    return NextResponse.json({ ok: true, manana, items: items.length, adminNotificado: true, integrantesNotificados: enviados })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
