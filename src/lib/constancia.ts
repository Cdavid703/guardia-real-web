// ──────────────────────────────────────────────────────────────────
// Constancia de tenencia de prenda del uniforme (PDF, cliente)
// ──────────────────────────────────────────────────────────────────

export interface DatosConstancia {
  nombre:               string
  seccion:              string
  prenda:               'chaqueta' | 'kepis'
  talla?:               string
  numero?:              string
  firmaDataUrl?:        string | null
  confirmadaEn?:        string
  solicitadaPorNombre?: string
}

const TEXTO: Record<'chaqueta' | 'kepis', string> = {
  chaqueta:
    'declara que tiene en su poder la chaqueta oficial (azul con blanco) de la Corporación Musical ' +
    'Guardia Real de Antioquia, y se hace responsable de su cuidado, conservación y correcta ' +
    'devolución cuando la dirección lo solicite.',
  kepis:
    'declara que tiene en su poder el kepis oficial de la Corporación Musical Guardia Real de ' +
    'Antioquia, y se hace responsable de su cuidado, conservación y correcta devolución cuando la ' +
    'dirección lo solicite.',
}

async function loadDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    return await new Promise(resolve => {
      const r = new FileReader()
      r.onloadend = () => resolve(r.result as string)
      r.onerror = () => resolve(null)
      r.readAsDataURL(blob)
    })
  } catch { return null }
}

function fechaLegible(iso?: string) {
  const d = iso ? new Date(iso) : new Date()
  return d.toLocaleString('es-CO', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export async function descargarConstancia(d: DatosConstancia): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const W = pdf.internal.pageSize.getWidth()
  const M = 48
  const label = d.prenda === 'kepis' ? 'kepis' : 'chaqueta'

  // Encabezado
  pdf.setFillColor(27, 46, 110)   // navy
  pdf.rect(0, 0, W, 90, 'F')
  const escudo = await loadDataUrl('/images/escudo.png')
  if (escudo) { try { pdf.addImage(escudo, 'PNG', M, 20, 50, 50) } catch { /* ignora logo */ } }
  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(15)
  pdf.text('CORPORACIÓN MUSICAL', M + 66, 40)
  pdf.text('GUARDIA REAL DE ANTIOQUIA', M + 66, 58)
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9)
  pdf.setTextColor(242, 193, 0)   // gold
  pdf.text('Control de uniformes', M + 66, 74)

  // Título
  let y = 140
  pdf.setTextColor(27, 46, 110)
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(18)
  pdf.text(`Constancia de tenencia — ${label.charAt(0).toUpperCase() + label.slice(1)}`, W / 2, y, { align: 'center' })

  // Cuerpo
  y += 40
  pdf.setTextColor(40, 40, 40)
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(11)
  const parrafo =
    `Por medio del presente documento, ${d.nombre}, integrante de la sección ${d.seccion || '—'} ` +
    `de la Corporación Musical Guardia Real de Antioquia, ${TEXTO[d.prenda]}`
  const lineas = pdf.splitTextToSize(parrafo, W - M * 2)
  pdf.text(lineas, M, y)
  y += lineas.length * 16 + 24

  // Datos
  const datos: [string, string][] = [
    ['Integrante', d.nombre],
    ['Sección', d.seccion || '—'],
    ['Prenda', label],
    ['Talla', d.talla || '—'],
    ['N.º de prenda', d.numero || '—'],
    ['Fecha de confirmación', fechaLegible(d.confirmadaEn)],
    ['Solicitada por', d.solicitadaPorNombre || '—'],
  ]
  pdf.setFontSize(11)
  for (const [k, v] of datos) {
    pdf.setFont('helvetica', 'bold'); pdf.setTextColor(27, 46, 110); pdf.text(`${k}:`, M, y)
    pdf.setFont('helvetica', 'normal'); pdf.setTextColor(40, 40, 40); pdf.text(String(v), M + 150, y)
    y += 22
  }

  // Firma
  y += 30
  if (d.firmaDataUrl) {
    try { pdf.addImage(d.firmaDataUrl, 'PNG', M, y, 200, 80) } catch { /* ignora firma */ }
  }
  y += 90
  pdf.setDrawColor(150, 150, 150); pdf.line(M, y, M + 240, y)
  y += 16
  pdf.setFont('helvetica', 'bold'); pdf.setTextColor(40, 40, 40); pdf.setFontSize(11)
  pdf.text(d.nombre, M, y)
  pdf.setFont('helvetica', 'normal'); pdf.setTextColor(120, 120, 120); pdf.setFontSize(9)
  pdf.text('Firma del integrante', M, y + 14)

  // Pie
  pdf.setFontSize(8); pdf.setTextColor(150, 150, 150)
  pdf.text(`Documento generado el ${fechaLegible()}  ·  guardiarealdeantioquia.com`, W / 2, 800, { align: 'center' })

  pdf.save(`constancia-${label}-${d.nombre.replace(/\s+/g, '-').toLowerCase()}.pdf`)
}

// ── Autorización de menor de edad ──────────────────────────────────

export interface DatosAutorizacion {
  menorNombre:     string
  menorDoc?:       string
  menorNacimiento?: string
  seccion:         string
  acudienteNombre: string
  parentesco:      string
  acudienteDoc:    string
  acudienteTel?:   string
  firmaDataUrl?:   string | null
  firmadaEn?:      string
}

export async function descargarAutorizacionMenor(d: DatosAutorizacion): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const W = pdf.internal.pageSize.getWidth()
  const M = 48

  // Encabezado
  pdf.setFillColor(27, 46, 110)
  pdf.rect(0, 0, W, 90, 'F')
  const escudo = await loadDataUrl('/images/escudo.png')
  if (escudo) { try { pdf.addImage(escudo, 'PNG', M, 20, 50, 50) } catch { /* ignora logo */ } }
  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(15)
  pdf.text('CORPORACIÓN MUSICAL', M + 66, 40)
  pdf.text('GUARDIA REAL DE ANTIOQUIA', M + 66, 58)
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9)
  pdf.setTextColor(242, 193, 0)
  pdf.text('Autorización de participación de menor de edad', M + 66, 74)

  let y = 140
  pdf.setTextColor(27, 46, 110)
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(18)
  pdf.text('Autorización del acudiente', W / 2, y, { align: 'center' })

  y += 40
  pdf.setTextColor(40, 40, 40)
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(11)
  const parrafo =
    `Yo, ${d.acudienteNombre}, identificado(a) con documento ${d.acudienteDoc || '—'}, en calidad de ` +
    `${d.parentesco || 'acudiente'} del/la menor ${d.menorNombre}` +
    `${d.menorDoc ? ` (documento ${d.menorDoc})` : ''}, autorizo de manera libre y voluntaria su ` +
    `participación en las actividades de la Corporación Musical Guardia Real de Antioquia: ensayos, ` +
    `presentaciones, desfiles, concursos y viajes/giras. Autorizo igualmente el uso de su imagen con ` +
    `fines institucionales y de difusión de la banda, y declaro conocer y aceptar las normas de ` +
    `convivencia y seguridad de la corporación. Esta autorización se otorga conforme a la Ley 1581 de 2012 ` +
    `(tratamiento de datos personales).`
  const lineas = pdf.splitTextToSize(parrafo, W - M * 2)
  pdf.text(lineas, M, y)
  y += lineas.length * 16 + 24

  const datos: [string, string][] = [
    ['Menor', d.menorNombre],
    ['Documento del menor', d.menorDoc || '—'],
    ['Fecha de nacimiento', d.menorNacimiento || '—'],
    ['Sección', d.seccion || '—'],
    ['Acudiente', d.acudienteNombre],
    ['Parentesco', d.parentesco || '—'],
    ['Documento del acudiente', d.acudienteDoc || '—'],
    ['Teléfono del acudiente', d.acudienteTel || '—'],
    ['Fecha de firma', fechaLegible(d.firmadaEn)],
  ]
  pdf.setFontSize(11)
  for (const [k, v] of datos) {
    pdf.setFont('helvetica', 'bold'); pdf.setTextColor(27, 46, 110); pdf.text(`${k}:`, M, y)
    pdf.setFont('helvetica', 'normal'); pdf.setTextColor(40, 40, 40); pdf.text(String(v), M + 190, y)
    y += 22
  }

  y += 24
  if (d.firmaDataUrl) { try { pdf.addImage(d.firmaDataUrl, 'PNG', M, y, 200, 80) } catch { /* ignora */ } }
  y += 90
  pdf.setDrawColor(150, 150, 150); pdf.line(M, y, M + 240, y)
  y += 16
  pdf.setFont('helvetica', 'bold'); pdf.setTextColor(40, 40, 40); pdf.setFontSize(11)
  pdf.text(d.acudienteNombre, M, y)
  pdf.setFont('helvetica', 'normal'); pdf.setTextColor(120, 120, 120); pdf.setFontSize(9)
  pdf.text(`Firma del acudiente · ${d.parentesco || ''}`, M, y + 14)

  pdf.setFontSize(8); pdf.setTextColor(150, 150, 150)
  pdf.text(`Documento generado el ${fechaLegible()}  ·  guardiarealdeantioquia.com`, W / 2, 800, { align: 'center' })

  pdf.save(`autorizacion-${d.menorNombre.replace(/\s+/g, '-').toLowerCase()}.pdf`)
}
