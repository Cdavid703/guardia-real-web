'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import {
  Upload, Search, Link2, Link2Off, UserCheck, UserX, ChevronDown,
  Pencil, Trash2, X, Save, AlertTriangle, Users2, FileSearch, Download,
  Cake, Link as LinkIcon, FileDown, CheckCircle2,
} from 'lucide-react'
import {
  getAllIntegrantes, getAllUsers, getIntegrantePrivado, bulkImportIntegrantes,
  upsertIntegrante, linkIntegranteToUser, deleteIntegrante, autoLinkIntegrantes,
  updateUserRole, type IntegranteBase,
} from '@/lib/firebase'
import { FAMILIAS, SECCIONES_LIST, getSeccion, type FamiliaKey } from '@/lib/secciones'
import {
  REQUERIDOS_INTEGRANTE, edadDesde, esMenorDeEdad, descargarCSV,
} from '@/lib/integrantes-utils'
import type { Integrante, UserProfile } from '@/types'
import { cn } from '@/lib/utils'

const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

type CompFilter = 'all' | 'incompletos' | 'completos' | 'sincuenta'

export default function IntegrantesPanel({ uid }: { uid: string }) {
  const fileRef    = useRef<HTMLInputElement>(null)
  const previewRef = useRef<HTMLInputElement>(null)

  const [integrantes, setIntegrantes] = useState<IntegranteBase[]>([])
  const [users,       setUsers]       = useState<UserProfile[]>([])
  const [loading,     setLoading]     = useState(true)
  const [busy,        setBusy]        = useState(false)
  const [search,      setSearch]      = useState('')
  const [filterFam,   setFilterFam]   = useState<FamiliaKey | 'all'>('all')
  const [filterComp,  setFilterComp]  = useState<CompFilter>('all')
  const [expanded,    setExpanded]    = useState<string | null>(null)
  const [editing,     setEditing]     = useState<Integrante | null>(null)
  const [preview,     setPreview]     = useState<PreviewResult | null>(null)
  const [reportOpen,  setReportOpen]  = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [ints, us] = await Promise.all([getAllIntegrantes(), getAllUsers()])
      setIntegrantes(ints); setUsers(us)
    } catch { toast.error('Error al cargar los integrantes') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const usersByEmail = useMemo(() => new Map(users.map(u => [u.email?.toLowerCase(), u])), [users])

  const stats = useMemo(() => {
    const vinculados  = integrantes.filter(i => i.linkedUid).length
    const vinculables = integrantes.filter(i => !i.linkedUid && usersByEmail.has(i.correo)).length
    const incompletos = integrantes.filter(i => i.datosCompletos === false).length
    return { total: integrantes.length, vinculados, vinculables, sinCuenta: integrantes.length - vinculados, incompletos }
  }, [integrantes, usersByEmail])

  const cumpleMes = useMemo(() => {
    const m = new Date().getMonth() + 1
    return integrantes
      .filter(i => i.cumpleMes === m)
      .sort((a, b) => (a.cumpleDia ?? 0) - (b.cumpleDia ?? 0))
  }, [integrantes])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return integrantes.filter(i => {
      if (filterFam !== 'all' && i.familia !== filterFam) return false
      if (filterComp === 'incompletos' && i.datosCompletos !== false) return false
      if (filterComp === 'completos'   && i.datosCompletos !== true)  return false
      if (filterComp === 'sincuenta'   && i.linkedUid) return false
      if (!q) return true
      return `${i.nombre} ${i.apellidos} ${i.correo} ${getSeccion(i.seccion)?.label ?? ''}`.toLowerCase().includes(q)
    })
  }, [integrantes, search, filterFam, filterComp])

  // ── Acciones ────────────────────────────────────────────────────
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setBusy(true)
    try {
      const parsed = JSON.parse(await file.text())
      if (!Array.isArray(parsed)) throw new Error('El archivo debe ser un arreglo JSON')
      const { creados, actualizados } = await bulkImportIntegrantes(parsed as Partial<Integrante>[], uid)
      toast.success(`Importación lista: ${creados} nuevos, ${actualizados} actualizados`)
      load()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'No se pudo importar') }
    finally { setBusy(false); if (fileRef.current) fileRef.current.value = '' }
  }

  const handlePreview = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    try {
      const parsed = JSON.parse(await file.text())
      if (!Array.isArray(parsed)) throw new Error('El archivo debe ser un arreglo JSON')
      const regs = parsed as Partial<Integrante>[]
      const toRow = (r: Partial<Integrante>): PreviewRow => ({
        nombre: `${r.nombre ?? ''} ${r.apellidos ?? ''}`.trim(),
        correo: (r.correo ?? '').toLowerCase(),
        seccion: getSeccion(r.seccion)?.label ?? (r.seccion ?? ''),
        faltan: REQUERIDOS_INTEGRANTE.filter(([k]) => { const v = r[k]; return v === undefined || v === null || String(v).trim() === '' }).map(([, l]) => l),
      })
      const rows = regs.map(toRow)
      const correos = new Set(rows.map(r => r.correo))
      setPreview({
        total: regs.length,
        conCuenta: rows.filter(r => usersByEmail.has(r.correo)),
        sinCuenta: rows.filter(r => !usersByEmail.has(r.correo)),
        incompletos: rows.filter(r => r.faltan.length > 0),
        cuentasSinFicha: users.filter(u => ['integrante','director','junta'].includes(u.role) && !correos.has(u.email?.toLowerCase())),
      })
    } catch (err) { toast.error(err instanceof Error ? err.message : 'No se pudo leer el archivo') }
    finally { if (previewRef.current) previewRef.current.value = '' }
  }

  const handleAutoLink = async () => {
    if (stats.vinculables === 0) { toast.info('No hay fichas enlazables (ningún correo coincide con una cuenta)'); return }
    if (!confirm(`Enlazar ${stats.vinculables} ficha(s) con su cuenta y darles rol de integrante?`)) return
    setBusy(true)
    try {
      const { enlazados } = await autoLinkIntegrantes(true)
      toast.success(`${enlazados} integrante(s) enlazados`)
      load()
    } catch { toast.error('Error al enlazar automáticamente') }
    finally { setBusy(false) }
  }

  const handleLink = async (i: IntegranteBase) => {
    const u = usersByEmail.get(i.correo)
    if (!u) { toast.error('No hay una cuenta con ese correo'); return }
    try {
      await linkIntegranteToUser(i.id, u.uid)
      if (u.role === 'pending' || u.role === 'visitante') await updateUserRole(u.uid, 'integrante')
      toast.success(`Enlazado con ${u.displayName || u.email}`)
      load()
    } catch { toast.error('Error al enlazar') }
  }

  const handleDelete = async (i: IntegranteBase) => {
    if (!confirm(`¿Eliminar la ficha de ${i.nombre} ${i.apellidos}? Borra también sus datos sensibles.`)) return
    try { await deleteIntegrante(i.id); toast.success('Ficha eliminada'); load() }
    catch { toast.error('Error al eliminar') }
  }

  const openEdit = async (i: IntegranteBase) => {
    const priv = await getIntegrantePrivado(i.id) ?? {}
    setEditing({ ...i, tipoDoc: '', numDoc: '', fechaNacimiento: '', direccion: '', tipoSangre: '', eps: '', pasaporte: false, contactoEmergencia: '', diagnostico: '', ...priv } as Integrante)
  }

  // ── Informes (CSV) ─────────────────────────────────────────────
  const cargarPrivados = async (list: IntegranteBase[]) => {
    const entries = await Promise.all(list.map(async i => [i.id, await getIntegrantePrivado(i.id) ?? {}] as const))
    return new Map(entries)
  }

  const exportRecordatorio = () => {
    const inc = integrantes.filter(i => i.datosCompletos === false)
    if (!inc.length) { toast.info('Todos tienen sus datos completos 🎉'); return }
    descargarCSV('integrantes-pendientes-actualizar',
      ['Nombre', 'WhatsApp', 'Correo', 'Sección', 'Campos que faltan'],
      inc.map(i => [`${i.nombre} ${i.apellidos}`, i.whatsapp, i.correo, getSeccion(i.seccion)?.label ?? i.seccion, (i.faltan ?? []).join(', ')]))
    setReportOpen(false)
    toast.success(`Informe de ${inc.length} integrante(s) por actualizar descargado`)
  }

  const exportTodos = async () => {
    setBusy(true)
    try {
      const priv = await cargarPrivados(integrantes)
      descargarCSV('roster-integrantes-completo',
        ['Apellidos','Nombre','Sección','Familia','Documento','Nacimiento','Edad','WhatsApp','Correo','Dirección','Sangre','EPS','Pasaporte','Contacto emergencia','Condición médica','Datos completos','Cuenta'],
        integrantes.map(i => {
          const p = priv.get(i.id) ?? {}
          return [
            i.apellidos, i.nombre, getSeccion(i.seccion)?.label ?? i.seccion, FAMILIAS[i.familia as FamiliaKey]?.label ?? i.familia,
            `${p.tipoDoc ?? ''} ${p.numDoc ?? ''}`.trim(), p.fechaNacimiento ?? '', edadDesde(p.fechaNacimiento) ?? '',
            i.whatsapp, i.correo, p.direccion ?? '', p.tipoSangre ?? '', p.eps ?? '', p.pasaporte ? 'Sí' : 'No',
            p.contactoEmergencia ?? '', p.diagnostico ?? '', i.datosCompletos ? 'Sí' : 'No', i.linkedUid ? 'Sí' : 'No',
          ]
        }))
      toast.success('Roster completo descargado')
    } catch { toast.error('Error al generar el informe') }
    finally { setBusy(false); setReportOpen(false) }
  }

  const exportGira = async () => {
    setBusy(true)
    try {
      const priv = await cargarPrivados(integrantes)
      descargarCSV('lista-gira',
        ['Apellidos','Nombre','Sección','Edad','Menor de edad','Sangre','EPS','Pasaporte','Contacto emergencia','Condición médica','WhatsApp'],
        integrantes.map(i => {
          const p = priv.get(i.id) ?? {}
          return [
            i.apellidos, i.nombre, getSeccion(i.seccion)?.label ?? i.seccion,
            edadDesde(p.fechaNacimiento) ?? '', esMenorDeEdad(p.fechaNacimiento) ? 'SÍ' : 'No',
            p.tipoSangre ?? '', p.eps ?? '', p.pasaporte ? 'Sí' : 'No',
            p.contactoEmergencia ?? '', p.diagnostico ?? '', i.whatsapp,
          ]
        }))
      toast.success('Lista de gira descargada')
    } catch { toast.error('Error al generar la lista') }
    finally { setBusy(false); setReportOpen(false) }
  }

  /**
   * Compara fichas sin cuenta vs. cuentas de banda que no tienen ficha enlazada.
   * Usa similitud de nombre (no solo correo) para sugerir candidatos de enlace
   * manual, porque muchos se registraron con un correo distinto al del Excel.
   */
  const exportCruceCuentas = () => {
    const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z\s]/g, '').trim()
    const fichasSinCuenta = integrantes.filter(i => !i.linkedUid)
    const linkedUids = new Set(integrantes.filter(i => i.linkedUid).map(i => i.linkedUid))
    const cuentasSinFicha = users.filter(u =>
      ['integrante', 'director', 'junta'].includes(u.role) && !linkedUids.has(u.uid))

    const filas = fichasSinCuenta.map(f => {
      const nombreFicha = norm(`${f.nombre} ${f.apellidos}`)
      const palabras = nombreFicha.split(/\s+/).filter(Boolean)
      // candidato: cuenta cuyo nombre comparte al menos 2 palabras con la ficha
      const candidato = cuentasSinFicha.find(u => {
        const nombreCuenta = norm(u.displayName || '')
        const coincidencias = palabras.filter(p => p.length > 2 && nombreCuenta.includes(p)).length
        return coincidencias >= 2
      })
      return [
        `${f.nombre} ${f.apellidos}`, getSeccion(f.seccion)?.label ?? f.seccion, f.correo, f.whatsapp,
        candidato ? `${candidato.displayName} (${candidato.email})` : '',
      ]
    })

    descargarCSV('cruce-fichas-vs-cuentas',
      ['Integrante (ficha)', 'Sección', 'Correo en el Excel', 'WhatsApp', 'Posible cuenta registrada con otro correo'],
      filas)

    if (cuentasSinFicha.length) {
      descargarCSV('cuentas-de-banda-sin-ficha',
        ['Nombre de la cuenta', 'Correo', 'Rol'],
        cuentasSinFicha.map(u => [u.displayName, u.email, u.role]))
    }
    setReportOpen(false)
    toast.success(`Descargado: ${fichasSinCuenta.length} ficha(s) sin cuenta y ${cuentasSinFicha.length} cuenta(s) sin ficha`)
  }

  if (loading) {
    return <div className="flex items-center justify-center py-16"><div className="w-7 h-7 border-2 border-royal/30 border-t-royal rounded-full animate-spin" /></div>
  }

  return (
    <div>
      {/* Barra de acciones */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <button onClick={() => previewRef.current?.click()} className="btn btn-ghost btn-sm">
          <FileSearch size={14} /> Previsualizar
        </button>
        <input ref={previewRef} type="file" accept="application/json,.json" className="hidden" onChange={handlePreview} />
        <button onClick={() => fileRef.current?.click()} disabled={busy} className="btn btn-ghost btn-sm disabled:opacity-60">
          <Upload size={14} /> Importar
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={handleImport} />
        {stats.vinculables > 0 && (
          <button onClick={handleAutoLink} disabled={busy} className="btn btn-ghost btn-sm text-royal disabled:opacity-60">
            <Link2 size={14} /> Enlazar coincidentes ({stats.vinculables})
          </button>
        )}
        <div className="relative ml-auto">
          <button onClick={() => setReportOpen(o => !o)} disabled={busy} className="btn btn-primary btn-sm disabled:opacity-60">
            <FileDown size={14} /> Informe ▾
          </button>
          {reportOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setReportOpen(false)} />
              <div className="absolute right-0 mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg w-64 py-1 text-sm">
                <ReportItem icon={AlertTriangle} title="Pendientes por actualizar" desc="Nombre + WhatsApp + qué les falta" onClick={exportRecordatorio} />
                <ReportItem icon={Link2} title="Cruce fichas vs. cuentas" desc="Quién falta enlazar y posibles candidatos" onClick={exportCruceCuentas} />
                <ReportItem icon={Users2} title="Lista de gira" desc="Menores, sangre, EPS, médico, pasaporte" onClick={exportGira} />
                <ReportItem icon={Download} title="Roster completo" desc="Todos los datos de todos" onClick={exportTodos} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Stat icon={Users2} label="Total integrantes" value={stats.total} color="text-navy" />
        <Stat icon={UserCheck} label="Con cuenta" value={stats.vinculados} color="text-green-600" />
        <Stat icon={AlertTriangle} label="Datos incompletos" value={stats.incompletos} color="text-red-500" />
        <Stat icon={UserX} label="Sin cuenta" value={stats.sinCuenta} color="text-gold" />
      </div>

      {/* Cumpleaños del mes */}
      {cumpleMes.length > 0 && (
        <div className="card border-l-4 border-pink-300 p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Cake size={16} className="text-pink-500" />
            <h3 className="font-serif font-bold text-navy text-sm">Cumpleaños de {MESES[new Date().getMonth()]}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {cumpleMes.map(i => (
              <span key={i.id} className="text-xs bg-pink-50 text-pink-700 rounded-full px-2.5 py-1">
                <strong>{i.cumpleDia}</strong> · {i.nombre} {i.apellidos}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" placeholder="Buscar por nombre, correo o instrumento..." />
        </div>
        <select value={filterFam} onChange={e => setFilterFam(e.target.value as FamiliaKey | 'all')} className="input max-w-[190px]">
          <option value="all">Todas las familias</option>
          {(Object.keys(FAMILIAS) as FamiliaKey[]).map(fk => <option key={fk} value={fk}>{FAMILIAS[fk].emoji} {FAMILIAS[fk].label}</option>)}
        </select>
        <select value={filterComp} onChange={e => setFilterComp(e.target.value as CompFilter)} className="input max-w-[190px]">
          <option value="all">Todos los datos</option>
          <option value="incompletos">Solo incompletos</option>
          <option value="completos">Solo completos</option>
          <option value="sincuenta">Sin cuenta enlazada</option>
        </select>
      </div>

      {/* Tabla */}
      {integrantes.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <Users2 size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm mb-1">Aún no hay integrantes cargados.</p>
          <p className="text-xs">Usa <strong>Importar</strong> y selecciona el archivo <code>data/integrantes-seed.local.json</code>.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12 text-gray-400 text-sm">Sin resultados para el filtro.</div>
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
                    {i.fotoURL ? (
                      <Image src={i.fotoURL} alt="" width={36} height={36} className="rounded-full w-9 h-9 object-cover shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-royal/10 flex items-center justify-center text-royal text-sm font-bold shrink-0">{(i.nombre[0] ?? '?').toUpperCase()}</div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-dark truncate">{i.nombre} {i.apellidos}</p>
                      <p className="text-xs text-gray-400 truncate">{sec?.label ?? i.seccion} · {i.correo}</p>
                    </div>
                  </button>
                  {/* Completitud */}
                  {i.datosCompletos === false && (
                    <span className="text-[10px] bg-red-100 text-red-600 rounded-full px-2 py-1 font-medium hidden sm:flex items-center gap-1 shrink-0" title={(i.faltan ?? []).join(', ')}>
                      <AlertTriangle size={11} /> Falta {i.faltan?.length}
                    </span>
                  )}
                  {/* Vínculo */}
                  {i.linkedUid ? (
                    <span className="text-[10px] bg-green-100 text-green-700 rounded-full px-2 py-1 font-medium flex items-center gap-1 shrink-0"><Link2 size={11} /> Cuenta</span>
                  ) : cuenta ? (
                    <button onClick={() => handleLink(i)} className="text-[10px] bg-royal/10 text-royal hover:bg-royal hover:text-white rounded-full px-2 py-1 font-medium flex items-center gap-1 shrink-0 transition-colors"><Link2 size={11} /> Enlazar</button>
                  ) : (
                    <span className="text-[10px] bg-gray-100 text-gray-400 rounded-full px-2 py-1 font-medium flex items-center gap-1 shrink-0"><Link2Off size={11} /> Sin cuenta</span>
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

      {editing && <EditModal integrante={editing} uid={uid} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />}
      {preview && <PreviewModal result={preview} onClose={() => setPreview(null)} />}
    </div>
  )
}

// ── Sub-componentes ─────────────────────────────────────────────────
function ExpandedRow({ id, base }: { id: string; base: IntegranteBase }) {
  const [priv, setPriv] = useState<Partial<Integrante> | null>(null)
  useEffect(() => { getIntegrantePrivado(id).then(p => setPriv(p ?? {})) }, [id])
  if (priv === null) return <p className="text-xs text-gray-400">Cargando datos...</p>
  const edad = edadDesde(priv.fechaNacimiento)
  const rows: [string, string][] = [
    ['Documento', priv.numDoc ? `${priv.tipoDoc ?? ''} ${priv.numDoc}` : '—'],
    ['Nacimiento', `${priv.fechaNacimiento || '—'}${edad !== null ? ` (${edad} años${esMenorDeEdad(priv.fechaNacimiento) ? ', menor' : ''})` : ''}`],
    ['WhatsApp', base.whatsapp || '—'],
    ['Dirección', priv.direccion || '—'],
    ['Tipo de sangre', priv.tipoSangre || '—'],
    ['EPS', priv.eps || '—'],
    ['Pasaporte', priv.pasaporte ? 'Sí' : 'No'],
    ['Contacto emergencia', priv.contactoEmergencia || '—'],
    ['Condición médica', priv.diagnostico || '—'],
    ['Consentimiento datos', base.consentimientoDatos ? `Aceptado${base.consentimientoFecha ? ` (${base.consentimientoFecha})` : ''}` : 'Pendiente'],
  ]
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5 text-sm">
      {rows.map(([k, v]) => (
        <div key={k}><span className="text-[11px] text-gray-400 uppercase tracking-wide">{k}</span><p className="text-dark break-words">{v}</p></div>
      ))}
      {base.datosCompletos === false && (
        <div className="sm:col-span-2 lg:col-span-3 text-xs text-red-500 flex items-center gap-1.5 mt-1">
          <AlertTriangle size={13} /> Faltan: {(base.faltan ?? []).join(', ')}
        </div>
      )}
    </div>
  )
}

function EditModal({ integrante, onClose, onSaved, uid }: { integrante: Integrante; onClose: () => void; onSaved: () => void; uid: string }) {
  const [form, setForm] = useState<Integrante>(integrante)
  const [saving, setSaving] = useState(false)
  const set = (k: keyof Integrante, v: unknown) => setForm({ ...form, [k]: v })
  const save = async () => {
    setSaving(true)
    try {
      const patch: Partial<Integrante> = { ...form }
      if (form.seccion) { const sec = getSeccion(form.seccion); patch.seccion = sec?.key ?? form.seccion; patch.familia = sec?.familia ?? form.familia; if (!patch.secciones?.length) patch.secciones = sec ? [sec.key] : [] }
      delete (patch as Record<string, unknown>).createdAt; delete (patch as Record<string, unknown>).updatedAt
      await upsertIntegrante(integrante.id, patch, uid)
      toast.success('Ficha actualizada'); onSaved()
    } catch { toast.error('Error al guardar') } finally { setSaving(false) }
  }
  return (
    <div className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif font-bold text-navy text-lg">Editar ficha</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-navy"><X size={18} /></button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Fld label="Nombre"><input className="input" value={form.nombre} onChange={e => set('nombre', e.target.value)} /></Fld>
          <Fld label="Apellidos"><input className="input" value={form.apellidos} onChange={e => set('apellidos', e.target.value)} /></Fld>
          <Fld label="Sección"><select className="input" value={getSeccion(form.seccion)?.key ?? ''} onChange={e => set('seccion', e.target.value)}>{SECCIONES_LIST.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}</select></Fld>
          <Fld label="WhatsApp"><input className="input" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} /></Fld>
          <Fld label="Correo"><input className="input" value={form.correo} onChange={e => set('correo', e.target.value.toLowerCase())} /></Fld>
          <Fld label="Tipo documento"><input className="input" value={form.tipoDoc} onChange={e => set('tipoDoc', e.target.value)} /></Fld>
          <Fld label="Número documento"><input className="input" value={form.numDoc} onChange={e => set('numDoc', e.target.value)} /></Fld>
          <Fld label="Nacimiento"><input className="input" value={form.fechaNacimiento} onChange={e => set('fechaNacimiento', e.target.value)} placeholder="YYYY-MM-DD" /></Fld>
          <Fld label="Tipo sangre"><input className="input" value={form.tipoSangre} onChange={e => set('tipoSangre', e.target.value)} /></Fld>
          <Fld label="EPS"><input className="input" value={form.eps} onChange={e => set('eps', e.target.value)} /></Fld>
          <Fld label="Pasaporte"><select className="input" value={form.pasaporte ? 'si' : 'no'} onChange={e => set('pasaporte', e.target.value === 'si')}><option value="no">No</option><option value="si">Sí</option></select></Fld>
          <Fld label="Dirección" full><input className="input" value={form.direccion} onChange={e => set('direccion', e.target.value)} /></Fld>
          <Fld label="Contacto emergencia" full><input className="input" value={form.contactoEmergencia} onChange={e => set('contactoEmergencia', e.target.value)} /></Fld>
          <Fld label="Condición médica" full><textarea className="input resize-none" rows={2} value={form.diagnostico} onChange={e => set('diagnostico', e.target.value)} /></Fld>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={save} disabled={saving} className="btn btn-primary btn-md disabled:opacity-60"><Save size={15} /> {saving ? 'Guardando...' : 'Guardar'}</button>
          <button onClick={onClose} className="btn btn-ghost btn-md">Cancelar</button>
        </div>
      </div>
    </div>
  )
}

interface PreviewRow { nombre: string; correo: string; seccion: string; faltan: string[] }
interface PreviewResult { total: number; conCuenta: PreviewRow[]; sinCuenta: PreviewRow[]; incompletos: PreviewRow[]; cuentasSinFicha: UserProfile[] }

function PreviewModal({ result, onClose }: { result: PreviewResult; onClose: () => void }) {
  const { total, conCuenta, sinCuenta, incompletos, cuentasSinFicha } = result
  return (
    <div className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-navy text-lg flex items-center gap-2"><FileSearch size={18} className="text-royal" /> Vista previa del cruce</h3>
            <p className="text-xs text-gray-400">{total} registros · nada se ha guardado todavía</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-navy"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-2 text-center">
            <MiniStat value={conCuenta.length} label="Ya registrados" color="text-green-600" />
            <MiniStat value={sinCuenta.length} label="No se han logueado" color="text-gold" />
            <MiniStat value={incompletos.length} label="Con datos faltantes" color="text-red-500" />
          </div>
          <PvList icon={UserX} color="text-gold" title={`No se han registrado (${sinCuenta.length})`} hint="Su correo aún no tiene cuenta" rows={sinCuenta.map(r => ({ main: r.nombre, sub: `${r.seccion} · ${r.correo}` }))} />
          <PvList icon={AlertTriangle} color="text-red-500" title={`Les falta algún dato (${incompletos.length})`} hint="Campos vacíos" rows={incompletos.map(r => ({ main: r.nombre, sub: `Falta: ${r.faltan.join(', ')}` }))} />
          <PvList icon={LinkIcon} color="text-royal" title={`Cuentas SIN ficha (${cuentasSinFicha.length})`} hint="Registrados que no están en el Excel" rows={cuentasSinFicha.map(u => ({ main: u.displayName || u.email, sub: `${u.role} · ${u.email}` }))} />
          <PvList icon={CheckCircle2} color="text-green-600" title={`Ya tienen cuenta — enlazables (${conCuenta.length})`} hint="Enlázalos con un clic" rows={conCuenta.map(r => ({ main: r.nombre, sub: `${r.seccion} · ${r.correo}` }))} collapsed />
        </div>
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-end">
          <button onClick={onClose} className="btn btn-primary btn-md">Entendido</button>
        </div>
      </div>
    </div>
  )
}

function PvList({ icon: Icon, color, title, hint, rows, collapsed }: { icon: React.ElementType; color: string; title: string; hint: string; rows: { main: string; sub: string }[]; collapsed?: boolean }) {
  const [open, setOpen] = useState(!collapsed)
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 px-4 py-2.5 bg-gray-50/60 text-left">
        <Icon size={15} className={color} /><span className="text-sm font-semibold text-navy flex-1">{title}</span>
        {rows.length === 0 ? <CheckCircle2 size={15} className="text-green-500" /> : <ChevronDown size={15} className={cn('text-gray-300 transition-transform', open && 'rotate-180')} />}
      </button>
      {open && (
        <div className="px-4 py-2">
          <p className="text-[11px] text-gray-400 mb-2">{hint}</p>
          {rows.length === 0 ? <p className="text-sm text-gray-400 py-1">Ninguno 🎉</p> : (
            <ul className="divide-y divide-gray-50">{rows.map((r, i) => <li key={i} className="py-1.5"><p className="text-sm text-dark">{r.main}</p><p className="text-xs text-gray-400">{r.sub}</p></li>)}</ul>
          )}
        </div>
      )}
    </div>
  )
}

function Stat({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return <div className="bg-white border border-gray-100 rounded-xl p-4"><Icon size={18} className={cn('mb-1', color)} /><div className={cn('font-display text-2xl font-bold', color)}>{value}</div><div className="text-xs text-gray-400 leading-tight">{label}</div></div>
}
function MiniStat({ value, label, color }: { value: number; label: string; color: string }) {
  return <div className="bg-gray-50 rounded-xl p-3"><div className={cn('font-display text-2xl font-bold', color)}>{value}</div><div className="text-[11px] text-gray-400 leading-tight">{label}</div></div>
}
function ReportItem({ icon: Icon, title, desc, onClick }: { icon: React.ElementType; title: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-start gap-2.5 px-3 py-2 hover:bg-gray-50 text-left">
      <Icon size={15} className="text-royal mt-0.5 shrink-0" />
      <div><p className="text-sm font-medium text-dark leading-tight">{title}</p><p className="text-[11px] text-gray-400">{desc}</p></div>
    </button>
  )
}
function Fld({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return <div className={cn(full && 'sm:col-span-2')}><label className="block text-xs font-semibold text-dark mb-1">{label}</label>{children}</div>
}
