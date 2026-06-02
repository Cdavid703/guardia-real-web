import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getAdminDb } from '@/lib/firebase-admin'
import { emailWrapper, callToAction, alertBox } from '@/lib/email-helpers'

const RESEND_KEY = process.env.RESEND_API_KEY
const FROM       = process.env.EMAIL_FROM ?? 'Guardia Real <onboarding@resend.dev>'
const SITE_URL   = 'https://www.guardiarealdeantioquia.com'

export async function POST(req: NextRequest) {
  try {
    const { news } = await req.json() as {
      news: {
        id:        string
        title:     string
        excerpt:   string
        slug:      string
        image?:    string
        visibleTo: string[]
        author?:   string
      }
    }

    if (!news) return NextResponse.json({ error: 'No news data' }, { status: 400 })

    // Solo notificar si tiene roles internos (no solo público)
    const internalRoles = (news.visibleTo ?? []).filter(r => r !== 'public')
    if (internalRoles.length === 0) {
      return NextResponse.json({ ok: true, skipped: 'public-only news, no internal notification needed' })
    }

    if (!RESEND_KEY) {
      return NextResponse.json({ ok: true, skipped: 'no email key' })
    }

    // Obtener correos de miembros con los roles correspondientes
    let emails: string[] = []
    try {
      const db   = getAdminDb()
      const snap = await db.collection('users').where('active', '==', true).get()
      emails = snap.docs
        .map(d => d.data())
        .filter(u =>
          internalRoles.includes(u.role as string) &&
          u.role !== 'pending' &&
          u.role !== 'visitante'
        )
        .map(u => u.email as string)
        .filter(Boolean)
    } catch {
      return NextResponse.json({ ok: true, skipped: 'admin SDK not configured' })
    }

    if (emails.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, reason: 'no recipients' })
    }

    const newsUrl = `${SITE_URL}/noticias/${news.slug}`

    const content = `
      <h2 style="font-family:Georgia,serif;color:#1B2E6E;font-size:22px;margin:0 0 8px;text-align:center;">
        📰 Nueva noticia publicada
      </h2>
      <p style="text-align:center;color:#6B7280;font-size:14px;margin:0 0 24px;">
        Hay una nueva novedad para los miembros de la Guardia Real de Antioquia
      </p>

      ${news.image ? `
      <div style="border-radius:12px;overflow:hidden;margin-bottom:20px;max-height:280px;">
        <img src="${news.image}" alt="${news.title}" style="width:100%;object-fit:cover;max-height:280px;display:block;" />
      </div>` : ''}

      <div style="background:linear-gradient(135deg,#0D1B3E,#1B2E6E);border-radius:12px;padding:20px 24px;margin-bottom:20px;border-left:4px solid #F2C100;">
        <p style="color:#F2C100;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">
          Noticia interna
        </p>
        <h3 style="color:#ffffff;font-family:Georgia,serif;font-size:20px;margin:0 0 10px;line-height:1.3;">
          ${news.title}
        </h3>
        <p style="color:#CBD5E1;font-size:14px;margin:0;line-height:1.6;">
          ${news.excerpt}
        </p>
      </div>

      ${callToAction('Leer noticia completa →', newsUrl)}

      ${alertBox('Esta noticia es exclusiva para miembros de la banda. Por favor no la compartas fuera de los canales oficiales.', 'info')}
    `

    const resend   = new Resend(RESEND_KEY)
    const html     = emailWrapper(`📰 ${news.title}`, content)

    let sent = 0
    for (let i = 0; i < emails.length; i += 50) {
      const batch = emails.slice(i, i + 50)
      await resend.emails.send({
        from:    FROM,
        to:      batch,
        subject: `📰 Nueva noticia: ${news.title}`,
        html,
      })
      sent += batch.length
    }

    // Marcar como notificada en Firestore
    try {
      const db = getAdminDb()
      await db.collection('news').doc(news.id).update({
        notified:   true,
        notifiedAt: new Date(),
      })
    } catch { /* skip */ }

    return NextResponse.json({ ok: true, sent })
  } catch (err) {
    console.error('News notify error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
