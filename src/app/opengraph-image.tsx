import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const alt = 'Corporación Musical Guardia Real de Antioquia'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpengraphImage() {
  let logoSrc = ''
  try {
    const logo = await readFile(join(process.cwd(), 'public/images/escudo.png'))
    logoSrc = `data:image/png;base64,${logo.toString('base64')}`
  } catch { /* sin logo si no se puede leer */ }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', textAlign: 'center',
          background: 'linear-gradient(135deg, #0a1a3f 0%, #1B2E6E 55%, #0a2350 100%)',
          color: '#ffffff', position: 'relative', fontFamily: 'sans-serif',
        }}
      >
        {/* Barra dorada superior */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 14, background: '#F2C100' }} />

        {logoSrc
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={logoSrc} width={150} height={150} alt="" style={{ marginBottom: 28 }} />
          : null}

        <div style={{ color: '#F2C100', fontSize: 26, letterSpacing: 8, textTransform: 'uppercase', marginBottom: 10 }}>
          Corporación Musical
        </div>
        <div style={{ fontSize: 74, fontWeight: 800, letterSpacing: 2, lineHeight: 1.05, display: 'flex', flexDirection: 'column' }}>
          <span>GUARDIA REAL</span>
          <span>DE ANTIOQUIA</span>
        </div>
        <div style={{ fontSize: 30, color: '#cbd5e1', marginTop: 22 }}>
          Banda Show · Medellín · Desde 1983
        </div>
        <div style={{ fontSize: 26, color: '#F2C100', fontStyle: 'italic', marginTop: 14 }}>
          «Disciplina, progreso y honor»
        </div>

        <div style={{ position: 'absolute', bottom: 26, fontSize: 20, color: '#93a3c4' }}>
          guardiarealdeantioquia.com
        </div>
      </div>
    ),
    { ...size },
  )
}
