// ──────────────────────────────────────────────────────────────────
// Email templates — Guardia Real de Antioquia
// ──────────────────────────────────────────────────────────────────

const SITE_URL = 'https://www.guardiarealdeantioquia.com'

export function emailWrapper(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#F0F2F8;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 32px rgba(27,46,110,0.14);">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#0D1B3E 0%,#1B2E6E 50%,#1B75BB 100%);padding:36px 28px 28px;text-align:center;border-bottom:4px solid #F2C100;">
    <img src="${SITE_URL}/images/escudo.png" alt="Guardia Real de Antioquia"
         width="88" height="88"
         style="border-radius:50%;border:3px solid #F2C100;display:block;margin:0 auto 16px;" />
    <h1 style="margin:0 0 4px;color:#ffffff;font-size:22px;letter-spacing:3px;text-transform:uppercase;font-family:Georgia,serif;">
      Guardia Real de Antioquia
    </h1>
    <p style="margin:0;color:#5AB8E5;font-size:11px;letter-spacing:2px;text-transform:uppercase;">
      Corporación Musical
    </p>
    <div style="margin-top:10px;padding:6px 18px;display:inline-block;border:1px solid rgba(242,193,0,0.4);border-radius:20px;">
      <p style="margin:0;color:#F2C100;font-size:10px;letter-spacing:3px;text-transform:uppercase;">
        DISCIPLINA · PROGRESO · HONOR
      </p>
    </div>
  </div>

  <!-- Content -->
  <div style="padding:36px 28px;">
    ${content}
  </div>

  <!-- Footer -->
  <div style="background:#0D1B3E;padding:24px 28px;text-align:center;">
    <p style="margin:0 0 4px;color:#5AB8E5;font-size:13px;font-weight:bold;">
      Corporación Musical Guardia Real de Antioquia
    </p>
    <p style="margin:0 0 8px;color:#8A93AA;font-size:11px;">
      NIT. 811028220 | Medellín, Antioquia, Colombia
    </p>
    <a href="${SITE_URL}" style="color:#F2C100;font-size:12px;text-decoration:none;">
      ${SITE_URL}
    </a>
    <p style="margin:12px 0 0;color:#4A5068;font-size:10px;">
      Este es un mensaje automático. Por favor no responda directamente a este correo.
    </p>
  </div>

</div>
</body>
</html>`
}

export function infoRow(label: string, value: string): string {
  return `
  <tr style="border-bottom:1px solid #EEF1F6;">
    <td style="padding:10px 8px;font-size:11px;font-weight:bold;color:#8A93AA;text-transform:uppercase;width:38%;vertical-align:top;">${label}</td>
    <td style="padding:10px 8px;font-size:14px;color:#111827;">${value}</td>
  </tr>`
}

export function infoTable(rows: [string, string][]): string {
  return `<table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
    ${rows.map(([l, v]) => infoRow(l, v)).join('')}
  </table>`
}

export function callToAction(label: string, url: string): string {
  return `
  <div style="text-align:center;margin:28px 0;">
    <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#1B2E6E,#1B75BB);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:14px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;border-bottom:3px solid #F2C100;">
      ${label}
    </a>
  </div>`
}

export function alertBox(text: string, type: 'info' | 'success' | 'warning' = 'info'): string {
  const colors = {
    info:    { bg: '#EEF3FF', border: '#1B75BB', text: '#1B2E6E' },
    success: { bg: '#ECFDF5', border: '#10B981', text: '#065F46' },
    warning: { bg: '#FFFBEB', border: '#F59E0B', text: '#92400E' },
  }
  const c = colors[type]
  return `
  <div style="background:${c.bg};border-left:4px solid ${c.border};padding:14px 16px;border-radius:0 8px 8px 0;margin:16px 0;">
    <p style="margin:0;font-size:13px;color:${c.text};line-height:1.6;">${text}</p>
  </div>`
}
