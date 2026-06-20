'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Contact, Upload, Search, Link2, Link2Off, UserCheck, UserX,
  ChevronDown, Pencil, Trash2, X, Save, AlertTriangle, Users2, ArrowLeft,
  FileSearch, UserPlus, MailX, CheckCircle2,
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import {
  getAllIntegrantes, getAllUsers, getIntegrantePrivado, bulkImportIntegrantes,
  upsertIntegrante, linkIntegranteToUser, deleteIntegrante,
  type IntegranteBase,
} from '@/lib/firebase'
import { FAMILIAS, SECCIONES_LIST, getSeccion, type FamiliaKey } from '@/lib/secciones'
import type { Integrante, UserProfile } from '@/types'
import { cn } from '@/lib/utils'

// Campos obligatorios para considerar una ficha "completa"
const REQUERIDOS: [keyof Integrante, string][] = [
  ['apellidos', 'Apellidos'], ['tipoDoc', 'Tipo doc'], ['numDoc', 'Documento'],
  ['fechaNacimiento', 'Nacimiento'], ['whatsapp', 'WhatsApp'], ['direccion', 'Dirección'],
  ['tipoSangre', 'Tipo de sangre'], ['eps', 'EPS'], ['contactoEmergencia', 'Contacto emergencia'],
]

interface PreviewRow { nombre: string; correo: string; seccion: string; faltan: string[] }
interface PreviewResult {
  total:          number
  conCuenta:      PreviewRow[]   // su correo coincide con una cuenta (ya se registró)
  sinCuenta:      PreviewRow[]   // su correo NO tiene cuenta (no se ha logueado)
  incompletos:    PreviewRow[]   // les falta algún dato requerido
  cuentasSinFicha: UserProfile[] // cuentas de banda que no están en el Excel
}

export default function MapaIntegrantesPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<HTMLInputElement>(null)

  const [integrantes, setIntegrantes] = useState<IntegranteBase[]>([])
  const [users,       setUsers]       = useState<UserProfile[]>([])
  const [loading,     setLoading]     = useState(true)
  const [importing,   setImporting]   = useState(false)
  const [search,      setSearch]      = useState('')
  const [filterFam,   setFilterFam]   = useState<FamiliaKey | 'all'>('all')
  const [expanded,    setExpanded]    = useState<string | null>(null)
  const [editing,     setEditing]     = useState<Integrante | null>(null)
  const [preview,     setPreview]     = useState<PreviewResult | null>(null)

  useEffect(() => {
    if (profile && profile.role !== 'admin') router.replace('/dashboard')
  }, [profile, router])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [ints, us] = await Promise.all([getAllIntegrantes(), getAllUsers()])
      setIntegrantes(ints)
      setUsers(us)
    } catch {
      toast.error('Error al cargar el mapeo de integrantes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Cruce e indexación ──────────────────────────────────────────
  const usersByEmail = useMemo(
    () => new Map(users.map(u => [u.email?.toLowerCase(), u])),
    [users],
  )
  const integranteEmails = useMemo(
    () => new Set(integrantes.map(i => i.correo)),
    [integrantes],
  )

  // Cuentas de banda SIN ficha en el roster
  const cuentasSinFicha = useMemo(
    () => users.filter(u =>
      ['integrante', 'director', 'junta'].includes(u.role) &&
      !integranteEmails.has(u.email?.toLowerCase())),
    [users, integranteEmails],
  )

  // Estadísticas
  const stats = useMemo(() => {
    const vinculados = integrantes.filter(i => i.linkedUid).length
    const vinculables = integrantes.filter(i => !i.linkedUid && usersByEmail.has(i.correo)).length
    const porFamilia = (Object.keys(FAMILIAS) as FamiliaKey[]).map(fk => ({
      fam: FAMILIAS[fk],
      count: integrantes.filter(i => i.familia === fk).length,
    }))
    return { total: integrantes.length, vinculados, vinculables, sinCuenta: integrantes.length - vinculados, porFamilia }
  }, [integrantes, usersByEmail])

  // Filtro de tabla
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return integrantes.filter(i => {
      if (filterFam !== 'all' && i.familia !== filterFam) return false
      if (!q) return true
      return `${i.nombre} ${i.apellidos} ${i.correo} ${getSeccion(i.seccion)?.label ?? ''}`.toLowerCase().includes(q)
    })
  }, [integrantes, search, filterFam])

  // ── Importación ─────────────────────────────────────────────────
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      if (!Array.isArray(parsed)) throw new Error('El archivo debe ser un arreglo JSON')
      const { creados, actualizados } = await bulkImportIntegrantes(parsed as Partial<Integrante>[], profile!.uid)
      toast.success(`Importación lista: ${creados} nuevos, ${actualizados} actualizados`)
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo importar el archivo')
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  // Cruce SIN escribir: lee el JSON + cuentas en vivo y arma el diagnóstico
  const handlePreview = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text())
      if (!Array.isArray(parsed)) throw new Error('El archivo debe ser un arreglo JSON')
      const regs = parsed as Partial<Integrante>[]

      const toRow = (r: Partial<Integrante>): PreviewRow => ({
        nombre:  `${r.nombre ?? ''} ${r.apellidos ?? ''}`.trim(),
        correo:  (r.correo ?? '').toLowerCase(),
        seccion: getSeccion(r.seccion)?.label ?? (r.seccion ?? ''),
        faltan:  REQUERIDOS.filter(([k]) => {
          const v = r[k]
          return v === undefined || v === null || String(v).trim() === ''
        }).map(([, label]) => label),
      })

      const rows = regs.map(toRow)
      const correosExcel = new Set(rows.map(r => r.correo))
      const conCuenta = rows.filter(r => usersByEmail.has(r.correo))
      const sinCuenta = rows.filter(r => !usersByEmail.has(r.correo))
      const incompletos = rows.filter(r => r.faltan.length > 0)
      const cuentasSinFicha = users.filter(u =>
        ['integrante', 'director', 'junta'].includes(u.role) &&
        !correosExcel.has(u.email?.toLowerCase()))

      setPreview({ total: regs.length, conCuenta, sinCuenta, incompletos, cuentasSinFicha })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo leer el archivo')
    } finally {
      if (previewRef.current) previewRef.current.value = ''
    }
  }

  const handleLink = async (i: IntegranteBase) => {
    const u = usersByEmail.get(i.correo)
    if (!u) { toast.error('No hay una cuenta con ese correo'); return }
    try {
      await linkIntegranteToUser(i.id, u.uid)
      toast.success(`Enlazado con ${u.displayName || u.email}`)
      load()
    } catch { toast.error('Error al enlazar') }
  }

  const handleDelete = async (i: IntegranteBase) => {
    if (!confirm(`¿Eliminar la ficha de ${i.nombre} ${i.apellidos}? Esto borra también sus datos sensibles.`)) return
    try { await deleteIntegrante(i.id); toast.success('Ficha eliminada'); load() }
    catch { toast.error('Error al eliminar') }
  }

  const openEdit = async (i: IntegranteBase) => {
    const priv = await getIntegrantePrivado(i.id) ?? {}
    setEditing({ ...i, tipoDoc: '', numDoc: '', fechaNacimiento: '', direccion: '', tipoSangre: '', eps: '', pasaporte: false, contactoEmergencia: '', diagnostico: '', ...priv } as Integrante)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <Link href="/dashboard/admin" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-navy mb-1">
            <ArrowLeft size={12} /> Volver
          </Link>
          <h1 className="font-display text-navy text-2xl font-bold uppercase tracking-wider flex items-center gap-2">
            <Contact size={22} className="text-royal" /> Mapeo de integrantes
          </h1>
          <p className="text-gray-400 text-sm mt-1">Roster oficial por sección, cruce con cuentas y datos completos</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => previewRef.current?.click()} className="btn btn-ghost btn-md">
            <FileSearch size={15} /> Previsualizar cruce
          </button>
          <input ref={previewRef} type="file" accept="application/json,.json" className="hidden" onChange={handlePreview} />
          <button onClick={() => fileRef.current?.click()} disabled={importing} className="btn btn-primary btn-md disabled:opacity-60">
            <Upload size={15} /> {importing ? 'Importando...' : 'Importar JSON'}
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={handleImport} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-2 border-royal/30 border-t-royal rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* ── Estadísticas ──────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <StatCard icon={Users2}    label="Total integrantes" value={stats.total}     color="text-navy" />
            <StatCard icon={UserCheck} label="Con cuenta"        value={stats.vinculados} color="text-green-600" />
            <StatCard icon={Link2}     label="Enlazables"        value={stats.vinculables} color="text-royal" hint="correo coincide con una cuenta" />
            <StatCard icon={UserX}     label="Sin cuenta"        value={stats.sinCuenta}  color="text-gold" />
          </div>

          {/* Por familia */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-6">
            {stats.porFamilia.map(({ fam, count }) => (
              <div key={fam.key} className="bg-white border border-gray-100 rounded-xl p-3 text-center">
                <div className="text-lg">{fam.emoji}</div>
                <div className="font-display text-navy text-xl font-bold">{count}</div>
                <div className="text-[11px] text-gray-400 leading-tight">{fam.label}</div>
              </div>
            ))}
          </div>

          {/* ── Diagnóstico ───────────────────────────────────────── */}
          {(stats.vinculables > 0 || cuentasSinFicha.length > 0) && (
            <div className="card border-l-4 border-gold p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-gold" />
                <h3 className="font-serif font-bold text-navy text-sm">Diagnóstico del cruce</h3>
              </div>
              {stats.vinculables > 0 && (
                <p className="text-sm text-gray-600 mb-1">
                  <strong>{stats.vinculables}</strong> ficha(s) tienen un correo que coincide con una cuenta y se pueden enlazar
                  con un clic (botón <Link2 size={12} className="inline" /> en la tabla).
                </p>
              )}
              {cuentasSinFicha.length > 0 && (
                <div className="text-sm text-gray-600">
                  <strong>{cuentasSinFicha.length}</strong> cuenta(s) de la banda no tienen ficha en el roster:
                  <ul className="mt-1 ml-1 space-y-0.5">
                    {cuentasSinFicha.slice(0, 8).map(u => (
                      <li key={u.uid} className="text-xs text-gray-500">• {u.displayName || u.email} <span className="text-gray-400">({u.email})</span></li>
                    ))}
                    {cuentasSinFicha.length > 8 && <li className="text-xs text-gray-400">…y {cuentasSinFicha.length - 8} más</li>}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* ── Filtros ───────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                className="input pl-9" placeholder="Buscar por nombre, correo o instrumento..." />
            </div>
            <select value={filterFam} onChange={e => setFilterFam(e.target.value as FamiliaKey | 'all')} className="input max-w-[200px]">
              <option value="all">Todas las familias</option>
              {(Object.keys(FAMILIAS) as FamiliaKey[]).map(fk => (
                <option key={fk} value={fk}>{FAMILIAS[fk].emoji} {FAMILIAS[fk].label}</option>
              ))}
            </select>
          </div>

          {/* ── Tabla ─────────────────────────────────────────────── */}
          {filtered.length === 0 ? (
            <div className="card text-center py-16 text-gray-400">
              <Contact size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">{integrantes.length === 0 ? 'No hay integrantes. Importa el listado para empezar.' : 'Sin resultados para el filtro.'}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map(i => {
                const sec = getSeccion(i.seccion)
                const cuenta = usersByEmail.get(i.correo)
                const isOpen = expanded === i.id
                return (
                  <div key={i.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-3 p-3">
                      <button onClick={() => setExpanded(isOpen ? null : i.id)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                        <ChevronDown size={16} className={cn('text-gray-300 transition-transform shrink-0', isOpen && 'rotate-180')} />
                        <div className="w-9 h-9 rounded-full bg-royal/10 flex items-center justify-center text-royal text-sm font-bold shrink-0">
                          {(i.nombre[0] ?? '?').toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-dark truncate">{i.nombre} {i.apellidos}</p>
                          <p className="text-xs text-gray-400 truncate">{sec?.label ?? i.seccion} · {i.correo}</p>
                        </div>
                      </button>
                      {/* Estado de vínculo */}
                      {i.linkedUid ? (
                        <span className="text-[10px] bg-green-100 text-green-700 rounded-full px-2 py-1 font-medium flex items-center gap-1 shrink-0">
                          <Link2 size={11} /> Con cuenta
                        </span>
                      ) : cuenta ? (
                        <button onClick={() => handleLink(i)} className="text-[10px] bg-royal/10 text-royal hover:bg-royal hover:text-white rounded-full px-2 py-1 font-medium flex items-center gap-1 shrink-0 transition-colors">
                          <Link2 size={11} /> Enlazar
                        </button>
                      ) : (
                        <span className="text-[10px] bg-gray-100 text-gray-400 rounded-full px-2 py-1 font-medium flex items-center gap-1 shrink-0">
                          <Link2Off size={11} /> Sin cuenta
                        </span>
                      )}
                    </div>

                    {isOpen && (
                      <div className="border-t border-gray-100 bg-gray-50/50 p-4">
                        <ExpandedRow id={i.id} base={i} />
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => openEdit(i)} className="btn btn-ghost btn-sm"><Pencil size={13} /> Editar</button>
                          <button onClick={() => handleDelete(i)} className="btn btn-ghost btn-sm text-red-500 hover:bg-red-50"><Trash2 size={13} /> Eliminar</button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── Modal edición ────────────────────────────────────────── */}
      {editing && (
        <EditModal
          integrante={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load() }}
          uid={profile!.uid}
        />
      )}

      {/* ── Modal previsualización del cruce ─────────────────────── */}
      {preview && <PreviewModal result={preview} onClose={() => setPreview(null)} />}
    </div>
  )
}

function PreviewModal({ result, onClose }: { result: PreviewResult; onClose: () => void }) {
  const { total, conCuenta, sinCuenta, incompletos, cuentasSinFicha } = result
  return (
    <div className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-navy text-lg flex items-center gap-2">
              <FileSearch size={18} className="text-royal" /> Vista previa del cruce
            </h3>
            <p className="text-xs text-gray-400">{total} registros en el archivo · nada se ha guardado todavía</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-navy"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Resumen */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <Mini value={conCuenta.length} label="Ya registrados" color="text-green-600" />
            <Mini value={sinCuenta.length} label="No se han logueado" color="text-gold" />
            <Mini value={incompletos.length} label="Con datos faltantes" color="text-red-500" />
          </div>

          {/* No se han logueado */}
          <PreviewList
            icon={UserX} color="text-gold"
            title={`No se han registrado en la página (${sinCuenta.length})`}
            hint="Su correo del Excel aún no tiene cuenta creada"
            rows={sinCuenta.map(r => ({ main: r.nombre, sub: `${r.seccion} · ${r.correo}` }))}
          />

          {/* Con datos faltantes */}
          <PreviewList
            icon={AlertTriangle} color="text-red-500"
            title={`Les falta algún dato (${incompletos.length})`}
            hint="Campos vacíos en el Excel"
            rows={incompletos.map(r => ({ main: r.nombre, sub: `Falta: ${r.faltan.join(', ')}` }))}
          />

          {/* Cuentas registradas sin ficha */}
          <PreviewList
            icon={MailX} color="text-royal"
            title={`Cuentas registradas SIN ficha en el Excel (${cuentasSinFicha.length})`}
            hint="Se han logueado pero su correo no está en el listado"
            rows={cuentasSinFicha.map(u => ({ main: u.displayName || u.email, sub: `${u.role} · ${u.email}` }))}
          />

          {/* Ya registrados (enlazables) */}
          <PreviewList
            icon={UserPlus} color="text-green-600"
            title={`Ya tienen cuenta — enlazables (${conCuenta.length})`}
            hint="Al importar, podrás enlazarlos con un clic"
            rows={conCuenta.map(r => ({ main: r.nombre, sub: `${r.seccion} · ${r.correo}` }))}
            collapsed
          />
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-end">
          <button onClick={onClose} className="btn btn-primary btn-md">Entendido</button>
        </div>
      </div>
    </div>
  )
}

function Mini({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <div className={cn('font-display text-2xl font-bold', color)}>{value}</div>
      <div className="text-[11px] text-gray-400 leading-tight">{label}</div>
    </div>
  )
}

function PreviewList({ icon: Icon, color, title, hint, rows, collapsed }: {
  icon: React.ElementType; color: string; title: string; hint: string
  rows: { main: string; sub: string }[]; collapsed?: boolean
}) {
  const [open, setOpen] = useState(!collapsed)
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 px-4 py-2.5 bg-gray-50/60 text-left">
        <Icon size={15} className={color} />
        <span className="text-sm font-semibold text-navy flex-1">{title}</span>
        {rows.length === 0
          ? <CheckCircle2 size={15} className="text-green-500" />
          : <ChevronDown size={15} className={cn('text-gray-300 transition-transform', open && 'rotate-180')} />}
      </button>
      {open && (
        <div className="px-4 py-2">
          <p className="text-[11px] text-gray-400 mb-2">{hint}</p>
          {rows.length === 0 ? (
            <p className="text-sm text-gray-400 py-1">Ninguno 🎉</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {rows.map((r, i) => (
                <li key={i} className="py-1.5">
                  <p className="text-sm text-dark">{r.main}</p>
                  <p className="text-xs text-gray-400">{r.sub}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

// Carga perezosa de datos sensibles al expandir
function ExpandedRow({ id, base }: { id: string; base: IntegranteBase }) {
  const [priv, setPriv] = useState<Partial<Integrante> | null>(null)
  useEffect(() => { getIntegrantePrivado(id).then(p => setPriv(p ?? {})) }, [id])

  if (priv === null) return <p className="text-xs text-gray-400">Cargando datos...</p>
  const rows: [string, string][] = [
    ['Documento', priv.numDoc ? `${priv.tipoDoc ?? ''} ${priv.numDoc}` : '—'],
    ['Nacimiento', priv.fechaNacimiento || '—'],
    ['WhatsApp', base.whatsapp || '—'],
    ['Dirección', priv.direccion || '—'],
    ['Tipo de sangre', priv.tipoSangre || '—'],
    ['EPS', priv.eps || '—'],
    ['Pasaporte', priv.pasaporte ? 'Sí' : 'No'],
    ['Contacto emergencia', priv.contactoEmergencia || '—'],
    ['Diagnóstico médico', priv.diagnostico || '—'],
  ]
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5 text-sm">
      {rows.map(([k, v]) => (
        <div key={k}>
          <span className="text-[11px] text-gray-400 uppercase tracking-wide">{k}</span>
          <p className="text-dark break-words">{v}</p>
        </div>
      ))}
    </div>
  )
}

function EditModal({ integrante, onClose, onSaved, uid }: {
  integrante: Integrante; onClose: () => void; onSaved: () => void; uid: string
}) {
  const [form, setForm] = useState<Integrante>(integrante)
  const [saving, setSaving] = useState(false)
  const set = (k: keyof Integrante, v: unknown) => setForm({ ...form, [k]: v })

  const save = async () => {
    setSaving(true)
    try {
      const patch: Partial<Integrante> = { ...form }
      if (form.seccion) {
        const sec = getSeccion(form.seccion)
        patch.seccion = sec?.key ?? form.seccion
        patch.familia = sec?.familia ?? form.familia
        if (!patch.secciones?.length) patch.secciones = sec ? [sec.key] : []
      }
      delete (patch as Record<string, unknown>).createdAt
      delete (patch as Record<string, unknown>).updatedAt
      await upsertIntegrante(integrante.id, patch, uid)
      toast.success('Ficha actualizada')
      onSaved()
    } catch { toast.error('Error al guardar') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif font-bold text-navy text-lg">Editar ficha</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-navy"><X size={18} /></button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <F label="Nombre"><input className="input" value={form.nombre} onChange={e => set('nombre', e.target.value)} /></F>
          <F label="Apellidos"><input className="input" value={form.apellidos} onChange={e => set('apellidos', e.target.value)} /></F>
          <F label="Sección">
            <select className="input" value={getSeccion(form.seccion)?.key ?? ''} onChange={e => set('seccion', e.target.value)}>
              {SECCIONES_LIST.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </F>
          <F label="WhatsApp"><input className="input" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} /></F>
          <F label="Correo"><input className="input" value={form.correo} onChange={e => set('correo', e.target.value.toLowerCase())} /></F>
          <F label="Tipo documento"><input className="input" value={form.tipoDoc} onChange={e => set('tipoDoc', e.target.value)} /></F>
          <F label="Número documento"><input className="input" value={form.numDoc} onChange={e => set('numDoc', e.target.value)} /></F>
          <F label="Nacimiento"><input className="input" value={form.fechaNacimiento} onChange={e => set('fechaNacimiento', e.target.value)} placeholder="YYYY-MM-DD" /></F>
          <F label="Tipo sangre"><input className="input" value={form.tipoSangre} onChange={e => set('tipoSangre', e.target.value)} /></F>
          <F label="EPS"><input className="input" value={form.eps} onChange={e => set('eps', e.target.value)} /></F>
          <F label="Pasaporte">
            <select className="input" value={form.pasaporte ? 'si' : 'no'} onChange={e => set('pasaporte', e.target.value === 'si')}>
              <option value="no">No</option><option value="si">Sí</option>
            </select>
          </F>
          <F label="Dirección" full><input className="input" value={form.direccion} onChange={e => set('direccion', e.target.value)} /></F>
          <F label="Contacto emergencia" full><input className="input" value={form.contactoEmergencia} onChange={e => set('contactoEmergencia', e.target.value)} /></F>
          <F label="Diagnóstico médico" full><textarea className="input resize-none" rows={2} value={form.diagnostico} onChange={e => set('diagnostico', e.target.value)} /></F>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={save} disabled={saving} className="btn btn-primary btn-md disabled:opacity-60"><Save size={15} /> {saving ? 'Guardando...' : 'Guardar'}</button>
          <button onClick={onClose} className="btn btn-ghost btn-md">Cancelar</button>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, hint }: {
  icon: React.ElementType; label: string; value: number; color: string; hint?: string
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <Icon size={18} className={cn('mb-1', color)} />
      <div className={cn('font-display text-2xl font-bold', color)}>{value}</div>
      <div className="text-xs text-gray-400 leading-tight">{label}</div>
      {hint && <div className="text-[10px] text-gray-300 mt-0.5">{hint}</div>}
    </div>
  )
}

function F({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={cn(full && 'sm:col-span-2')}>
      <label className="block text-xs font-semibold text-dark mb-1">{label}</label>
      {children}
    </div>
  )
}
