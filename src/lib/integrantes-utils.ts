// ──────────────────────────────────────────────────────────────────
// Utilidades del roster de integrantes: completitud, edad, exportación
// ──────────────────────────────────────────────────────────────────
import type { Integrante } from '@/types'

/** Tipos de documento de identidad (para los selectores de ficha). */
export const TIPOS_DOCUMENTO = ['Cédula', 'Tarjeta de identidad', 'Pasaporte', 'NUIP', 'Documento Venezuela', 'Permiso de permanencia'] as const

/**
 * Sugiere a cuál tipo estándar corresponde un valor de documento existente
 * (formato viejo o texto libre). Devuelve '' si no hay una correspondencia clara
 * (p. ej. "Cédula de extranjería"), para que el admin decida manualmente.
 */
export function sugerirTipoDoc(raw: string): string {
  const s = (raw ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[.\-_]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!s) return ''
  // ya es uno de los estándar
  for (const t of TIPOS_DOCUMENTO) {
    if (s === t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')) return t
  }
  // extranjería no tiene equivalente en el estándar → sin sugerencia
  if (s.includes('extranjeria')) return ''
  if (/permiso.*(permanencia|proteccion)|(^| )ppt( |$)|(^| )pep( |$)/.test(s)) return 'Permiso de permanencia'
  if (/venez|(^| )v ?\d/.test(s)) return 'Documento Venezuela'
  if (/nuip/.test(s)) return 'NUIP'
  if (/pasaporte|passport/.test(s)) return 'Pasaporte'
  if (/tarjeta.*identidad|(^| )ti( |$)/.test(s)) return 'Tarjeta de identidad'
  if (/cedula|(^| )cc( |$)|ciudadania/.test(s)) return 'Cédula'
  return ''
}

/** Campos obligatorios para considerar una ficha "completa". */
export const REQUERIDOS_INTEGRANTE: [keyof Integrante, string][] = [
  ['apellidos', 'Apellidos'], ['tipoDoc', 'Tipo de documento'], ['numDoc', 'Número de documento'],
  ['fechaNacimiento', 'Fecha de nacimiento'], ['whatsapp', 'WhatsApp'], ['direccion', 'Dirección'],
  ['tipoSangre', 'Tipo de sangre'], ['eps', 'EPS'],
  ['contactoEmergencia', 'Contacto de emergencia'], ['contactoEmergenciaTel', 'Tel. de emergencia'],
]

function vacio(v: unknown): boolean {
  return v === undefined || v === null || String(v).trim() === ''
}

/** Devuelve las etiquetas de los campos requeridos que están vacíos. */
export function camposFaltantes(data: Partial<Integrante>): string[] {
  const faltan = REQUERIDOS_INTEGRANTE.filter(([k]) => vacio(data[k])).map(([, label]) => label)
  // El número de pasaporte solo es obligatorio si la persona marcó que tiene pasaporte.
  if (data.pasaporte === true && vacio(data.numeroPasaporte)) faltan.push('Número de pasaporte')
  return faltan
}

/** Calcula la edad a partir de una fecha (ISO o dd/mm/yyyy). */
export function edadDesde(fecha?: string): number | null {
  const d = parseFecha(fecha)
  if (!d) return null
  const hoy = new Date()
  let edad = hoy.getFullYear() - d.getFullYear()
  const m = hoy.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < d.getDate())) edad--
  return edad >= 0 && edad < 120 ? edad : null
}

export function esMenorDeEdad(fecha?: string): boolean {
  const e = edadDesde(fecha)
  return e !== null && e < 18
}

/** Parsea una fecha en formato ISO (YYYY-MM-DD) o dd/mm/yyyy. */
export function parseFecha(v?: string): Date | null {
  if (!v) return null
  const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3])
  const dmy = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (dmy) return new Date(+dmy[3], +dmy[2] - 1, +dmy[1])
  return null
}

/** Día y mes de cumpleaños (para listados), null si no se puede parsear. */
export function diaMesCumple(fecha?: string): { dia: number; mes: number } | null {
  const d = parseFecha(fecha)
  return d ? { dia: d.getDate(), mes: d.getMonth() + 1 } : null
}

/** Convierte filas a CSV (compatible con Excel) y dispara la descarga. */
export function descargarCSV(nombreArchivo: string, headers: string[], filas: (string | number)[][]) {
  const escapar = (s: string | number) => {
    const t = String(s ?? '').replace(/"/g, '""')
    return /[",\n;]/.test(t) ? `"${t}"` : t
  }
  // BOM para que Excel respete los acentos
  const contenido = '﻿' + [headers, ...filas].map(f => f.map(escapar).join(';')).join('\r\n')
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo.endsWith('.csv') ? nombreArchivo : `${nombreArchivo}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
