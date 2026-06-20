// ──────────────────────────────────────────────────────────────────
// Utilidades del roster de integrantes: completitud, edad, exportación
// ──────────────────────────────────────────────────────────────────
import type { Integrante } from '@/types'

/** Campos obligatorios para considerar una ficha "completa". */
export const REQUERIDOS_INTEGRANTE: [keyof Integrante, string][] = [
  ['apellidos', 'Apellidos'], ['tipoDoc', 'Tipo de documento'], ['numDoc', 'Número de documento'],
  ['fechaNacimiento', 'Fecha de nacimiento'], ['whatsapp', 'WhatsApp'], ['direccion', 'Dirección'],
  ['tipoSangre', 'Tipo de sangre'], ['eps', 'EPS'], ['contactoEmergencia', 'Contacto de emergencia'],
]

function vacio(v: unknown): boolean {
  return v === undefined || v === null || String(v).trim() === ''
}

/** Devuelve las etiquetas de los campos requeridos que están vacíos. */
export function camposFaltantes(data: Partial<Integrante>): string[] {
  return REQUERIDOS_INTEGRANTE.filter(([k]) => vacio(data[k])).map(([, label]) => label)
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
