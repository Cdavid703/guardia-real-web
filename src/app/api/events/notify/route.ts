import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getAdminDb } from '@/lib/firebase-admin'
import { emailWrapper, infoTable, callToAction, alertBox } from '@/lib/email-helpers'

const RESEND_KEY = process.env.RESEND_API_KEY
const FROM       = process.env.EMAIL_FROM ?? 'Guardia Real <onboarding@resend.dev>'
const SITE_URL   = 'https://www.guardiarealdeantioquia.com'

export async function POST(req: NextRequest) {
  try {
    const { event } = await req.json() as { event: Record<string, unknown> }
    if (!event) return NextResponse.json({ error: 'No event data' }, { status: 400 })

    // Mark as notified in Firestore (best effort)
    try {
      const db = getAdminDb()
      await db.collection('events').doc(event.id as string).update({ notified: true, notifiedAt: new Date() })
    } catch { /* skip if admin not configured */ }

    if (!RESEND_KEY) {
      return NextResponse.json({ ok: true, skipped: 'no email key' })
    }

    const resend = new Resend(RESEND_KEY)

    // Determine recipients
    const isPublic = event.isPublic as boolean
    const roles    = (event.visibleTo as string[]) ?? []

    // Get emails from Firestore
    let emails: string[] = []
    try {
      const db   = getAdminDb()
      const snap = await db.collection('users')
        .where('active', '==', true)
        .get()
      emails = snap.docs
        .map(d => d.data())
        .filter(u => {
          if (isPublic && u.role === 'visitante') return true
          return roles.includes(u.role as string) && u.role !== 'pending'
        })
        .map(u => u.email as string)
        .filter(Boolean)
    } catch { /* admin not configured */ }

    if (emails.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, reason: 'no recipients' })
    }

    const typeEmoji: Record<string, string> = {
      presentacion: '🎺', concurso: '🏆', desfile: '🥁', reunion: '📋', otro: '📌',
    }
    const emoji = typeEmoji[event.type as string] ?? '📌'

    const gcParams = new URLSearchParams({
      action:   'TEMPLATE',
      text:     `${event.title} — Guardia Real de Antioquia`,
      dates:    `${String(event.date).replace(/-/g, '')}T${String(event.startTime ?? '0000').replace(':', '')}00`,
      details:  String(event.description ?? 'Evento de la Corporación Musical Guardia Real de Antioquia'),
      location: String(event.location ?? ''),
      ctz:      'America/Bogota',
    })
    const gcUrl = `https://calendar.google.com/calendar/render?${gcParams}`

    const content = `
      <h2 style="font-family:Georgia,serif;color:#1B2E6E;font-size:22px;margin:0 0 8px;text-align:center;">
        ${emoji} Nuevo Evento
      </h2>
      <p style="text-align:center;color:#6B7280;font-size:14px;margin:0 0 24px;">
        La Corporación Musical Guardia Real de Antioquia te invita a su próximo evento
      </p>

      <div style="background:linear-gradient(135deg,#1B2E6E,#1B75BB);border-radius:12px;padding:20px 24px;margin-bottom:24px;">
        <h3 style="color:#F2C100;font-family:Georgia,serif;font-size:20px;margin:0 0 4px;">${event.title}</h3>
        <p style="color:#93C5FD;font-size:13px;margin:0;text-transform:uppercase;letter-spacing:1px;">${event.type}</p>
      </div>

      ${infoTable([
        ['📅 Fecha',   String(event.date ?? '—')],
        ['⏰ Hora',    `${String(event.startTime ?? '—')}${event.endTime ? ` - ${String(event.endTime)}` : ''}`],
        ['📍 Lugar',   String(event.location ?? '—')],
        ...(event.address ? [['🗺️ Dirección', String(event.address)] as [string, string]] : []),
        ...(event.city    ? [['🏙️ Ciudad',    String(event.city)]    as [string, string]] : []),
      ])}

      ${event.description ? `
        <div style="background:#F5F7FA;border-left:4px solid #1B75BB;padding:14px 16px;border-radius:0 8px 8px 0;margin:16px 0;">
          <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">${event.description}</p>
        </div>
      ` : ''}

      ${callToAction('Ver todos los eventos', `${SITE_URL}/eventos`)}

      <div style="text-align:center;margin-top:16px;">
        <a href="${gcUrl}" style="display:inline-flex;align-items:center;gap:8px;background:#ECFDF5;color:#065F46;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:bold;text-decoration:none;border:1px solid #10B981;">
          📅 Agregar a Google Calendar
        </a>
      </div>

      ${alertBox('Este correo fue generado automáticamente por el sistema de Guardia Real de Antioquia.', 'info')}
    `

    const html = emailWrapper(
      isPublic ? 'Nuevo evento público — Guardia Real' : 'Nuevo evento interno — Guardia Real',
      content
    )

    // Send in batches of 50
    let sent = 0
    for (let i = 0; i < emails.length; i += 50) {
      const batch = emails.slice(i, i + 50)
      await resend.emails.send({
        from:    FROM,
        to:      batch,
        subject: `${emoji} ${event.title} — Guardia Real de Antioquia`,
        html,
      })
      sent += batch.length
    }

    return NextResponse.json({ ok: true, sent })
  } catch (err) {
    console.error('Events notify error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
