import { NextResponse } from 'next/server'
import {
  Document, Page, View, Text, Image as PDFImage,
  StyleSheet, renderToBuffer, Font,
} from '@react-pdf/renderer'
import { createElement } from 'react'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const NAVY  = '#0D1B3E'
const ROYAL = '#1B2E6E'
const BLUE  = '#1B75BB'
const GOLD  = '#F2C100'
const WHITE = '#FFFFFF'
const GRAY  = '#6B7280'
const LGRAY = '#F5F7FA'

const SITE = 'https://www.guardiarealdeantioquia.com'

// ── Styles ─────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page:        { fontFamily: 'Helvetica', backgroundColor: WHITE, paddingBottom: 40 },

  // Header
  header:      { backgroundColor: NAVY, padding: 32, alignItems: 'center', borderBottomWidth: 4, borderBottomColor: GOLD },
  headerTitle: { color: WHITE, fontSize: 22, fontFamily: 'Helvetica-Bold', letterSpacing: 4, textTransform: 'uppercase', marginTop: 10 },
  headerSub:   { color: BLUE, fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', marginTop: 2 },
  tagline:     { color: GOLD, fontSize: 10, fontFamily: 'Helvetica-Oblique', marginTop: 8, letterSpacing: 1 },

  // Section
  section:     { paddingHorizontal: 32, paddingTop: 24 },
  sectionLabel:{ color: ROYAL, fontSize: 9, fontFamily: 'Helvetica-Bold', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 },
  sectionTitle:{ color: NAVY, fontSize: 18, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  divider:     { height: 2, backgroundColor: GOLD, width: 60, marginBottom: 16 },
  body:        { color: GRAY, fontSize: 10, lineHeight: 1.7, marginBottom: 8 },

  // Stats row
  statsRow:    { flexDirection: 'row', paddingHorizontal: 32, paddingTop: 20, gap: 12 },
  statBox:     { flex: 1, backgroundColor: LGRAY, borderRadius: 8, padding: 14, alignItems: 'center', borderTopWidth: 3, borderTopColor: GOLD },
  statNum:     { color: NAVY, fontSize: 22, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  statLabel:   { color: GRAY, fontSize: 8, textAlign: 'center' },

  // Services
  servicesRow: { flexDirection: 'row', paddingHorizontal: 32, gap: 12, marginTop: 12 },
  serviceCard: { flex: 1, backgroundColor: ROYAL, borderRadius: 10, padding: 14 },
  serviceTitle:{ color: WHITE, fontSize: 12, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  serviceSub:  { color: GOLD, fontSize: 8, marginBottom: 8 },
  serviceItem: { flexDirection: 'row', marginBottom: 4, gap: 5 },
  serviceDot:  { color: GOLD, fontSize: 10, lineHeight: 1.3 },
  serviceText: { color: '#CBD5E1', fontSize: 9, lineHeight: 1.4, flex: 1 },

  // Why us
  whyRow:      { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 32, gap: 10, marginTop: 12 },
  whyCard:     { width: '47%', backgroundColor: LGRAY, borderRadius: 8, padding: 12, borderLeftWidth: 3, borderLeftColor: GOLD },
  whyTitle:    { color: NAVY, fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  whyText:     { color: GRAY, fontSize: 9, lineHeight: 1.5 },

  // Events
  eventsGrid:  { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 32, gap: 8, marginTop: 12 },
  eventChip:   { backgroundColor: '#EEF3FF', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 10, flexDirection: 'row', gap: 5, alignItems: 'center' },
  eventStar:   { color: GOLD, fontSize: 10 },
  eventText:   { color: NAVY, fontSize: 9 },

  // Tech info
  techRow:     { flexDirection: 'row', paddingHorizontal: 32, gap: 12, marginTop: 12 },
  techCard:    { flex: 1, backgroundColor: LGRAY, borderRadius: 8, padding: 14 },
  techTitle:   { color: NAVY, fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 10 },
  techItem:    { fontSize: 9, color: GRAY, marginBottom: 5, lineHeight: 1.4 },

  // Footer / CTA
  footer:      { backgroundColor: NAVY, marginTop: 24, padding: 28, alignItems: 'center' },
  footerTitle: { color: WHITE, fontSize: 16, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 },
  footerSub:   { color: BLUE, fontSize: 10, marginBottom: 16 },
  contactRow:  { flexDirection: 'row', gap: 24, marginBottom: 12 },
  contactItem: { color: '#CBD5E1', fontSize: 10 },
  footerUrl:   { color: GOLD, fontSize: 10, marginTop: 4 },
  footerNote:  { color: '#4A5068', fontSize: 8, marginTop: 10 },
  pageNum:     { position: 'absolute', bottom: 12, right: 32, color: '#9CA3AF', fontSize: 8 },
})

// ── PDF Document ────────────────────────────────────────────────────
function BrochureDocument() {
  return createElement(Document, { title: 'Brochure — Guardia Real de Antioquia', author: 'Guardia Real de Antioquia' },

    // ── PAGE 1: Portada + presentación + stats ──────────────────────
    createElement(Page, { size: 'A4', style: s.page },

      // Header
      createElement(View, { style: s.header },
        createElement(Text, { style: s.headerTitle }, 'GUARDIA REAL DE ANTIOQUIA'),
        createElement(Text, { style: s.headerSub }, 'CORPORACIÓN MUSICAL'),
        createElement(Text, { style: s.tagline }, '"Disciplina · Progreso · Honor"'),
      ),

      // Stats
      createElement(View, { style: s.statsRow },
        ...[
          { num: '42+', lbl: 'Años de\nexperiencia' },
          { num: '60+', lbl: 'Músicos y\nartistas' },
          { num: '200+', lbl: 'Eventos\nrealizados' },
          { num: '100%', lbl: 'Compromiso\nprofesional' },
        ].map(({ num, lbl }) =>
          createElement(View, { key: num, style: s.statBox },
            createElement(Text, { style: s.statNum }, num),
            createElement(Text, { style: s.statLabel }, lbl),
          )
        )
      ),

      // Quiénes somos
      createElement(View, { style: s.section },
        createElement(Text, { style: s.sectionLabel }, 'Quiénes somos'),
        createElement(Text, { style: s.sectionTitle }, 'Corporación Musical\nGuardia Real de Antioquia'),
        createElement(View, { style: s.divider }),
        createElement(Text, { style: s.body },
          'Somos una corporación cultural sin ánimo de lucro fundada en 1982, dedicada a la formación musical y a la difusión de la cultura a través de espectáculos de alta calidad.'
        ),
        createElement(Text, { style: s.body },
          'Contamos con más de 60 músicos, bailarines y artistas especializados en bandas show estilo campo y recorrido, con un repertorio que combina música tropical, latina y marchas de concierto, llevando el nombre de Antioquia y Colombia a escenarios locales, regionales y nacionales.'
        ),
      ),

      // Servicios
      createElement(View, { style: s.section },
        createElement(Text, { style: s.sectionLabel }, 'Lo que ofrecemos'),
        createElement(Text, { style: s.sectionTitle }, 'Nuestros Servicios'),
        createElement(View, { style: s.divider }),
      ),

      createElement(View, { style: s.servicesRow },
        ...[
          {
            title: 'Exhibición de Campo',
            sub: 'Espectáculo estático en espacio delimitado',
            items: ['Plazas, canchas y escenarios al aire libre', 'Espacios deportivos y recintos cubiertos', 'Coreografía temática personalizable', 'Duración flexible: 20–45 minutos'],
          },
          {
            title: 'Show de Recorrido',
            sub: 'Desfile y presentación en movimiento',
            items: ['Desfiles cívicos y culturales', 'Actos deportivos y ceremonias', 'Caminatas, festividades y marchas', 'Formación militar con música tropical'],
          },
          {
            title: 'Presentación Especial',
            sub: 'Montaje a medida para tu evento',
            items: ['Conciertos y temporadas musicales', 'Lanzamientos de marca o producto', 'Actos de gala e inauguraciones', 'Diseño de repertorio y puesta en escena'],
          },
        ].map(({ title, sub, items }) =>
          createElement(View, { key: title, style: s.serviceCard },
            createElement(Text, { style: s.serviceTitle }, title),
            createElement(Text, { style: s.serviceSub }, sub),
            ...items.map(item =>
              createElement(View, { key: item, style: s.serviceItem },
                createElement(Text, { style: s.serviceDot }, '▸'),
                createElement(Text, { style: s.serviceText }, item),
              )
            ),
          )
        )
      ),

      createElement(Text, { style: s.pageNum }, '1 / 2'),
    ),

    // ── PAGE 2: Por qué elegirnos + eventos + info técnica + contacto ──
    createElement(Page, { size: 'A4', style: s.page },

      // Header compacto
      createElement(View, { style: [s.header, { padding: 16 }] },
        createElement(Text, { style: [s.headerTitle, { fontSize: 14 }] }, 'GUARDIA REAL DE ANTIOQUIA'),
        createElement(Text, { style: [s.headerSub, { marginTop: 0 }] }, 'BROCHURE DE SERVICIOS'),
      ),

      // Por qué elegirnos
      createElement(View, { style: s.section },
        createElement(Text, { style: s.sectionLabel }, 'Nuestra propuesta de valor'),
        createElement(Text, { style: s.sectionTitle }, '¿Por qué elegirnos?'),
        createElement(View, { style: s.divider }),
      ),

      createElement(View, { style: s.whyRow },
        ...[
          { t: '42 años de trayectoria', d: 'Fundada en 1982, somos una de las bandas show con mayor historia en Antioquia.' },
          { t: 'Talento certificado', d: 'Músicos, bailarines y artistas con formación técnica y experiencia escénica.' },
          { t: 'Logística propia', d: 'Transporte, uniformes, equipos y dirección musical garantizados por nosotros.' },
          { t: 'Flexibilidad total', d: 'Adaptamos el montaje, duración y repertorio a tu evento y presupuesto.' },
          { t: 'Cobertura regional', d: 'Atendemos eventos en todo Antioquia y el resto de Colombia.' },
          { t: 'Corporación sin ánimo de lucro', d: 'Nuestros ingresos financian la formación musical de jóvenes de la región.' },
        ].map(({ t, d }) =>
          createElement(View, { key: t, style: s.whyCard },
            createElement(Text, { style: s.whyTitle }, t),
            createElement(Text, { style: s.whyText }, d),
          )
        )
      ),

      // Eventos destacados
      createElement(View, { style: s.section },
        createElement(Text, { style: s.sectionLabel }, 'Trayectoria'),
        createElement(Text, { style: s.sectionTitle }, 'Eventos destacados'),
        createElement(View, { style: s.divider }),
      ),

      createElement(View, { style: s.eventsGrid },
        ...[
          'Feria de las Flores — Desfile de Silleteros',
          'Desfile de Mitos y Leyendas (Medellín)',
          'Fiestas de la Candelaria (Medellín)',
          'Feria de Manizales y eventos departamentales',
          'Eventos corporativos en Antioquia',
          'Ceremonias de grado e inauguraciones',
        ].map(ev =>
          createElement(View, { key: ev, style: s.eventChip },
            createElement(Text, { style: s.eventStar }, '★'),
            createElement(Text, { style: s.eventText }, ev),
          )
        )
      ),

      // Info técnica
      createElement(View, { style: s.section },
        createElement(Text, { style: s.sectionLabel }, 'Datos técnicos'),
        createElement(Text, { style: s.sectionTitle }, 'Información técnica'),
        createElement(View, { style: s.divider }),
      ),

      createElement(View, { style: s.techRow },
        createElement(View, { style: s.techCard },
          createElement(Text, { style: s.techTitle }, 'Secciones de la banda'),
          ...['🎺 Sección de metales (brass)', '🪗 Sección de vientos', '🥁 Sección de percusión', '🚩 Color guard (banderas y sables)', '💃 Cuerpo de danza'].map(item =>
            createElement(Text, { key: item, style: s.techItem }, item)
          ),
        ),
        createElement(View, { style: s.techCard },
          createElement(Text, { style: s.techTitle }, 'Requisitos del espacio'),
          ...['📐 Campo: mínimo 50×40 m para exhibición completa', '🚌 Acceso vehicular para transporte', '⚡ Conexión eléctrica (opcional)', '🏢 Camerinos o área de preparación', '📍 Cobertura: Medellín + área metro (otros previa consulta)'].map(item =>
            createElement(Text, { key: item, style: s.techItem }, item)
          ),
        ),
      ),

      // Footer / Contacto
      createElement(View, { style: s.footer },
        createElement(Text, { style: s.footerTitle }, '¡Contáctenos!'),
        createElement(Text, { style: s.footerSub }, 'Solicite su cotización sin compromiso'),
        createElement(View, { style: s.contactRow },
          createElement(Text, { style: s.contactItem }, '📞  319 773 5052'),
          createElement(Text, { style: s.contactItem }, '📞  312 817 9516'),
          createElement(Text, { style: s.contactItem }, '📧  bandashowguardiareal@outlook.com'),
        ),
        createElement(Text, { style: s.contactItem }, '📍  Cra. 48 #73–36, Campo Valdés, Medellín, Antioquia'),
        createElement(Text, { style: s.footerUrl }, SITE),
        createElement(Text, { style: s.footerNote }, 'NIT. 811028220 — Corporación sin ánimo de lucro — Personería Jurídica vigente'),
      ),

      createElement(Text, { style: s.pageNum }, '2 / 2'),
    ),
  )
}

// ── Route handler ───────────────────────────────────────────────────
export async function GET() {
  try {
    const buffer = await renderToBuffer(createElement(BrochureDocument))

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': 'attachment; filename="Brochure-Guardia-Real-Antioquia.pdf"',
        'Cache-Control':       'public, max-age=3600',
      },
    })
  } catch (err) {
    console.error('Brochure generation error:', err)
    return NextResponse.json({ error: 'Error generando el PDF' }, { status: 500 })
  }
}
