import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getAdminDb } from '@/lib/firebase-admin'
import { emailWrapper, infoTable, alertBox } from '@/lib/email-helpers'

const RESEND_KEY = process.env.RESEND_API_KEY
const FROM       = process.env.EMAIL_FROM ?? 'Guardia Real <onboarding@resend.dev>'
const SITE_URL   = 'https://www.guardiarealdeantioquia.com'

const TYPE_INFO: Record<string, { emoji: string; label: string }> = {
  general:    { emoji: '🎺', label: 'Ensayo General' },
  vientos:    { emoji: '🪗', label: 'Solo Vientos' },
  percusion:  { emoji: '🥁', label: 'Solo Percusión' },
  colorguard: { emoji: '🚩', label: 'Solo Color Guard' },
  brass:      { emoji: '📯', label: 'Solo Brass' },
  reunion:    { emoji: '📋', label: 'Reunión' },
}

export async function POST(req: NextRequest) {
  try {
    const { ensayo } = await req.json() as { ensayo: Record<string, unknown> }
    if (!ensayo) return NextResponse.json({ error: 'No ensayo data' }, { status: 400 })

    // Mark as notified
    try {
      const db = getAdminDb()
      await db.collection('ensayos').doc(ensayo.id as string).update({ notified: true, notifiedAt: new Date() })
    } catch { /* skip */ }

    if (!RESEND_KEY) {
      return NextResponse.json({ ok: true, skipped: 'no email key' })
    }

    const roles = (ensayo.visibleTo as string[]) ?? ['integrante', 'director']

    // Get member emails
    let emails: string[] = []
    try {
      const db   = getAdminDb()
      const snap = await db.collection('users').where('active', '==', true).get()
      emails = snap.docs
        .map(d => d.data())
        .filter(u => roles.includes(u.role as string) && u.role !== 'pending' && u.role !== 'visitante')
        .map(u => u.email as string)
        .filter(Boolean)
    } catch { /* admin not configured */ }

    if (emails.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, reason: 'no recipients' })
    }

    const resend = new Resend(RESEND_KEY)
    const typeInfo = TYPE_INFO[ensayo.type as string] ?? { emoji: '🎵', label: String(ensayo.type) }

    const content = `
      <h2 style="font-family:Georgia,serif;color:#1B2E6E;font-size:22px;margin:0 0 8px;text-align:center;">
        ${typeInfo.emoji} Ensayo Programado
      </h2>
      <p style="text-align:center;color:#6B7280;font-size:14px;margin:0 0 24px;">
        El Director Musical ha programado un nuevo ensayo. Tu presencia es importante.
      </p>

      <div style="background:linear-gradient(135deg,#0D1B3E,#1B2E6E);border-radius:12px;padding:20px 24px;margin-bottom:24px;border-left:4px solid #F2C100;">
        <p style="color:#F2C100;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 6px;">${typeInfo.label}</p>
        <h3 style="color:#ffffff;font-family:Georgia,serif;font-size:20px;margin:0;">${ensayo.title}</h3>
      </div>

      ${infoTable([
        ['📅 Fecha',  String(ensayo.date ?? '—')],
        ['⏰ Hora',   `${String(ensayo.startTime ?? '—')}${ensayo.endTime ? ` - ${String(ensayo.endTime)}` : ''}`],
        ['📍 Lugar',  String(ensayo.location ?? '—')],
        ...(ensayo.objective ? [['🎯 Objetivo', String(ensayo.objective)] as [string, string]] : []),
      ])}

      ${ensayo.notes ? `
        <div style="background:#FFFBEB;border-left:4px solid #F59E0B;padding:14px 16px;border-radius:0 8px 8px 0;margin:16px 0;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:bold;color:#92400E;text-transform:uppercase;">Notas adicionales</p>
          <p style="margin:0;font-size:14px;color:#78350F;line-height:1.6;">${ensayo.notes}</p>
        </div>
      ` : ''}

      <div style="background:#EEF3FF;border-radius:12px;padding:16px;text-align:center;margin:24px 0;">
        <p style="margin:0 0 4px;font-size:14px;font-weight:bold;color:#1B2E6E;">¡Tu asistencia es fundamental!</p>
        <p style="margin:0;font-size:12px;color:#4B5563;">Recuerda llegar puntual con tus instrumentos y partituras.</p>
      </div>

      <div style="text-align:center;margin:20px 0;">
        <a href="${SITE_URL}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#1B2E6E,#1B75BB);color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:bold;letter-spacing:1px;border-bottom:3px solid #F2C100;">
          Ver mi portal de integrante
        </a>
      </div>

      ${alertBox('Para confirmar asistencia o solicitar permiso, comunícate con la dirección musical.', 'info')}
    `

    const html = emailWrapper(`${typeInfo.emoji} ${typeInfo.label} Programado`, content)

    let sent = 0
    for (let i = 0; i < emails.length; i += 50) {
      const batch = emails.slice(i, i + 50)
      await resend.emails.send({
        from:    FROM,
        to:      batch,
        subject: `${typeInfo.emoji} ${typeInfo.label}: ${String(ensayo.title)} — ${String(ensayo.date)}`,
        html,
      })
      sent += batch.length
    }

    return NextResponse.json({ ok: true, sent })
  } catch (err) {
    console.error('Ensayos notify error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
