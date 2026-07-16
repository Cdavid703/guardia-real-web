'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import {
  Upload, Search, Link2, Link2Off, UserCheck, UserX, ChevronDown,
  Pencil, Trash2, X, Save, AlertTriangle, Users2, FileSearch, Download,
  Cake, Link as LinkIcon, FileDown, CheckCircle2, Phone, List, LayoutGrid, GitMerge,
} from 'lucide-react'
import {
  getAllIntegrantes, getAllUsers, getIntegrantePrivado, bulkImportIntegrantes,
  upsertIntegrante, linkIntegranteToUser, deleteIntegrante, autoLinkIntegrantes,
  updateUserRole, mergeIntegrantes, type IntegranteBase,
} from '@/lib/firebase'
import { FAMILIAS, SECCIONES_LIST, getSeccion, type FamiliaKey } from '@/lib/secciones'
import {
  REQUERIDOS_INTEGRANTE, edadDesde, esMenorDeEdad, descargarCSV,
} from '@/lib/integrantes-utils'
import type { Integrante, UserProfile } from '@/types'
import { cn } from '@/lib/utils'

const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

type CompFilter = 'all' | 'incompletos' | 'completos' | 'sincuenta'
type SortBy = 'nombre' | 'apellido' | 'seccion' | 'incompletos'

/** Normaliza texto para comparar/buscar sin importar mayúsculas ni acentos. */
const norm = (s: string) => (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/** Puntaje de completitud de una ficha (para sugerir cuál conservar al fusionar). */
function scoreFicha(i: IntegranteBase): number {
  let s = 0
  if (i.datosCompletos === true) s += 1000
  s -= (i.faltan?.length ?? 20) * 10           // menos faltantes → más completa
  for (const v of [i.correo, i.whatsapp, i.fotoURL, i.seccion, i.consentimientoDatos]) if (v) s += 2
  s += (i.correosAutorizados?.length ?? 0)
  s += i.linkedUids.length * 3                  // conservar preferentemente la que ya tiene cuenta
  return s
}

/** ¿La ficha fue creada en los últimos 7 días? */
const esNuevo = (createdAt?: Date) => {
  if (!createdAt) return false
  return Date.now() - createdAt.getTime() < 7 * 24 * 60 * 60 * 1000
}

/** Resalta en amarillo la coincidencia de búsqueda dentro del texto. */
function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim()
  if (!q) return <span className="truncate">{text}</span>
  const idx = norm(text).indexOf(norm(q))
  if (idx < 0) return <span className="truncate">{text}</span>
  return (
    <span className="truncate">
      {text.slice(0, idx)}
      <mark className="bg-gold/40 text-navy rounded px-0.5">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </span>
  )
}

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
  const [sortBy,      setSortBy]      = useState<SortBy>('nombre')
  const [quick,       setQuick]       = useState<Set<string>>(new Set())
  const [vista,       setVista]       = useState<'lista' | 'tarjetas'>('lista')
  const [selected,    setSelected]    = useState<Set<string>>(new Set())
  const [letra,       setLetra]       = useState<string | null>(null)

  const toggleQuick = (k: string) => setQuick(prev => {
    const next = new Set(prev)
    next.has(k) ? next.delete(k) : next.add(k)
    return next
  })

  const toggleSel = (id: string) => setSelected(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })
  const [expanded,    setExpanded]    = useState<string | null>(null)
  const [editing,     setEditing]     = useState<Integrante | null>(null)
  const [creatingNew, setCreatingNew] = useState(false)
  const [preview,     setPreview]     = useState<PreviewResult | null>(null)
  const [reportOpen,  setReportOpen]  = useState(false)
  const [dupOpen,     setDupOpen]     = useState(false)

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

  // Cuenta(s) cuyo correo autorizado coincide pero aún no está enlazada a la ficha
  const enlazablesDe = (i: IntegranteBase): UserProfile[] => {
    const correos = new Set([i.correo, ...i.correosAutorizados].filter(Boolean))
    const res: UserProfile[] = []
    for (const c of correos) {
      const u = usersByEmail.get(c)
      if (u && !i.linkedUids.includes(u.uid)) res.push(u)
    }
    return res
  }

  const stats = useMemo(() => {
    const vinculados  = integrantes.filter(i => i.linkedUids.length > 0).length
    const vinculables = integrantes.filter(i => enlazablesDe(i).length > 0).length
    const incompletos = integrantes.filter(i => i.datosCompletos === false).length
    return { total: integrantes.length, vinculados, vinculables, sinCuenta: integrantes.length - vinculados, incompletos }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [integrantes, usersByEmail])

  const cumpleMes = useMemo(() => {
    const m = new Date().getMonth() + 1
    return integrantes
      .filter(i => i.cumpleMes === m)
      .sort((a, b) => (a.cumpleDia ?? 0) - (b.cumpleDia ?? 0))
  }, [integrantes])

  const filtered = useMemo(() => {
    const q = norm(search.trim())
    const out = integrantes.filter(i => {
      if (filterFam !== 'all' && i.familia !== filterFam) return false
      if (filterComp === 'incompletos' && i.datosCompletos !== false) return false
      if (filterComp === 'completos'   && i.datosCompletos !== true)  return false
      if (filterComp === 'sincuenta'   && i.linkedUids.length > 0) return false
      if (quick.has('menor')     && i.esMenor !== true) return false
      if (quick.has('pasaporte') && i.tienePasaporte !== true) return false
      if (quick.has('sinwa')     && i.whatsapp) return false
      if (quick.has('sinfoto')   && i.fotoURL) return false
      if (letra && norm(sortBy === 'apellido' ? i.apellidos : i.nombre).charAt(0).toUpperCase() !== letra) return false
      if (!q) return true
      return norm(`${i.nombre} ${i.apellidos} ${i.correo} ${getSeccion(i.seccion)?.label ?? ''}`).includes(q)
    })
    const cmp = (a: string, b: string) => a.localeCompare(b, 'es', { sensitivity: 'base' })
    out.sort((a, b) => {
      if (sortBy === 'apellido') return cmp(`${a.apellidos} ${a.nombre}`, `${b.apellidos} ${b.nombre}`)
      if (sortBy === 'seccion')  return cmp(getSeccion(a.seccion)?.label ?? a.seccion, getSeccion(b.seccion)?.label ?? b.seccion) || cmp(a.nombre, b.nombre)
      if (sortBy === 'incompletos') {
        const d = (a.datosCompletos === false ? 0 : 1) - (b.datosCompletos === false ? 0 : 1)
        return d || cmp(`${a.nombre} ${a.apellidos}`, `${b.nombre} ${b.apellidos}`)
      }
      return cmp(`${a.nombre} ${a.apellidos}`, `${b.nombre} ${b.apellidos}`)
    })
    return out
  }, [integrantes, search, filterFam, filterComp, sortBy, quick, letra])

  // Letras presentes en el roster (según el campo de orden)
  const letrasDisponibles = useMemo(
    () => new Set(integrantes.map(i => norm(sortBy === 'apellido' ? i.apellidos : i.nombre).charAt(0).toUpperCase()).filter(Boolean)),
    [integrantes, sortBy],
  )

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
        cuentasSinFicha: users.filter(u => ['integrante','director','junta','cm'].includes(u.role) && !correos.has(u.email?.toLowerCase())),
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
    const pendientes = enlazablesDe(i)
    if (!pendientes.length) { toast.error('No hay una cuenta con ese correo'); return }
    try {
      for (const u of pendientes) {
        await linkIntegranteToUser(i.id, u.uid, u.email)
        if (u.role === 'pending' || u.role === 'visitante') await updateUserRole(u.uid, 'integrante')
      }
      toast.success(pendientes.length > 1 ? `${pendientes.length} cuentas enlazadas` : `Enlazado con ${pendientes[0].displayName || pendientes[0].email}`)
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
            p.contactoEmergencia ?? '', p.diagnostico ?? '', i.datosCompletos ? 'Sí' : 'No', i.linkedUids.length ? 'Sí' : 'No',
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

  const exportSeleccionados = async () => {
    const sel = integrantes.filter(i => selected.has(i.id))
    if (!sel.length) return
    setBusy(true)
    try {
      const priv = await cargarPrivados(sel)
      descargarCSV('integrantes-seleccionados',
        ['Apellidos','Nombre','Sección','Edad','Menor de edad','Sangre','EPS','Pasaporte','Contacto emergencia','Condición médica','WhatsApp','Correo'],
        sel.map(i => {
          const p = priv.get(i.id) ?? {}
          return [
            i.apellidos, i.nombre, getSeccion(i.seccion)?.label ?? i.seccion,
            edadDesde(p.fechaNacimiento) ?? '', esMenorDeEdad(p.fechaNacimiento) ? 'SÍ' : 'No',
            p.tipoSangre ?? '', p.eps ?? '', p.pasaporte ? 'Sí' : 'No',
            p.contactoEmergencia ?? '', p.diagnostico ?? '', i.whatsapp, i.correo,
          ]
        }))
      toast.success(`${sel.length} integrante(s) exportados`)
    } catch { toast.error('Error al exportar') }
    finally { setBusy(false) }
  }

  /**
   * Compara fichas sin cuenta vs. cuentas de banda que no tienen ficha enlazada.
   * Usa similitud de nombre (no solo correo) para sugerir candidatos de enlace
   * manual, porque muchos se registraron con un correo distinto al del Excel.
   */
  const exportCruceCuentas = () => {
    const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z\s]/g, '').trim()
    const fichasSinCuenta = integrantes.filter(i => i.linkedUids.length === 0)
    const todosLinked = new Set(integrantes.flatMap(i => i.linkedUids))
    const cuentasSinFicha = users.filter(u =>
      ['integrante', 'director', 'junta', 'cm'].includes(u.role) && !todosLinked.has(u.uid))

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
        <button onClick={() => setCreatingNew(true)} className="btn btn-ghost btn-sm">
          <Users2 size={14} /> Nuevo integrante
        </button>
        <button onClick={() => setDupOpen(true)} className="btn btn-ghost btn-sm text-amber-600">
          <GitMerge size={14} /> Duplicados
        </button>
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
        <select value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)} className="input max-w-[190px]">
          <option value="nombre">Orden: Nombre (A-Z)</option>
          <option value="apellido">Orden: Apellido (A-Z)</option>
          <option value="seccion">Orden: Sección</option>
          <option value="incompletos">Orden: Incompletos primero</option>
        </select>
      </div>

      {/* Chips de filtro rápido */}
      <div className="flex flex-wrap gap-2 mb-3">
        {([
          ['menor',     'Menores de edad', integrantes.filter(i => i.esMenor).length],
          ['pasaporte', 'Con pasaporte',   integrantes.filter(i => i.tienePasaporte).length],
          ['sinwa',     'Sin WhatsApp',    integrantes.filter(i => !i.whatsapp).length],
          ['sinfoto',   'Sin foto',        integrantes.filter(i => !i.fotoURL).length],
        ] as const).map(([k, label, count]) => (
          <button key={k} onClick={() => toggleQuick(k)}
            className={cn('px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
              quick.has(k) ? 'bg-gold text-navy border-gold' : 'bg-white text-gray-600 border-gray-200 hover:border-navy hover:text-navy')}>
            {label}<span className="ml-1.5 opacity-60">{count}</span>
          </button>
        ))}
        {quick.size > 0 && (
          <button onClick={() => setQuick(new Set())} className="px-3 py-1.5 rounded-full text-xs font-medium text-red-500 hover:bg-red-50">
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Índice alfabético */}
      {!loading && integrantes.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 mb-3">
          <button onClick={() => setLetra(null)}
            className={cn('px-2 py-0.5 rounded text-xs font-semibold transition-colors', !letra ? 'bg-navy text-white' : 'text-gray-500 hover:text-navy')}>
            Todos
          </button>
          {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(L => {
            const avail = letrasDisponibles.has(L)
            return (
              <button key={L} disabled={!avail} onClick={() => setLetra(letra === L ? null : L)}
                className={cn('w-6 h-6 rounded text-xs font-semibold transition-colors',
                  letra === L ? 'bg-royal text-white' : avail ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-300 cursor-default')}>
                {L}
              </button>
            )
          })}
        </div>
      )}

      {!loading && integrantes.length > 0 && (
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <p className="text-xs text-gray-400">
            Mostrando <strong className="text-gray-600">{filtered.length}</strong> de {integrantes.length} integrantes
          </p>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setVista('lista')} className={cn('px-2.5 py-1 rounded-md text-xs font-medium transition-colors', vista === 'lista' ? 'bg-white text-navy shadow-sm' : 'text-gray-500')}>
              <List size={13} className="inline mr-1" /> Lista
            </button>
            <button onClick={() => setVista('tarjetas')} className={cn('px-2.5 py-1 rounded-md text-xs font-medium transition-colors', vista === 'tarjetas' ? 'bg-white text-navy shadow-sm' : 'text-gray-500')}>
              <LayoutGrid size={13} className="inline mr-1" /> Tarjetas
            </button>
          </div>
        </div>
      )}

      {/* Barra de selección múltiple */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-3 px-4 py-2.5 bg-royal/10 border border-royal/20 rounded-xl">
          <span className="text-sm font-semibold text-royal">{selected.size} seleccionado(s)</span>
          <button onClick={exportSeleccionados} disabled={busy} className="btn btn-primary btn-sm disabled:opacity-60">
            <FileDown size={13} /> Exportar seleccionados
          </button>
          <button onClick={() => setSelected(new Set())} className="text-xs text-gray-500 hover:text-navy ml-auto">Limpiar selección</button>
        </div>
      )}

      {/* Tabla */}
      {integrantes.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <Users2 size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm mb-1">Aún no hay integrantes cargados.</p>
          <p className="text-xs">Usa <strong>Importar</strong> y selecciona el archivo <code>data/integrantes-seed.local.json</code>.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12 text-gray-400 text-sm">Sin resultados para el filtro.</div>
      ) : vista === 'tarjetas' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(i => {
            const sec = getSeccion(i.seccion)
            return (
              <div key={i.id} className="relative bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                <input type="checkbox" checked={selected.has(i.id)} onChange={() => toggleSel(i.id)}
                  className="absolute top-3 right-3 w-4 h-4 accent-royal" />
                <button onClick={() => openEdit(i)} className="flex flex-col items-center text-center w-full">
                  {i.fotoURL ? (
                    <Image src={i.fotoURL} alt="" width={64} height={64} className="rounded-full w-16 h-16 object-cover mb-2" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-royal/10 flex items-center justify-center text-royal text-xl font-bold mb-2">{(i.nombre[0] ?? '?').toUpperCase()}</div>
                  )}
                  <p className="text-sm font-semibold text-dark leading-tight">{i.nombre} {i.apellidos}</p>
                  <p className="text-xs text-gray-400 mb-2">{sec?.label ?? i.seccion}</p>
                  <div className="flex flex-wrap justify-center gap-1">
                    {esNuevo(i.createdAt) && <span className="text-[9px] bg-gold/20 text-amber-700 rounded-full px-1.5 py-0.5 font-bold">NUEVO</span>}
                    {i.esMenor && <span className="text-[9px] bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5 font-medium">menor</span>}
                    {i.datosCompletos === false && <span className="text-[9px] bg-red-100 text-red-600 rounded-full px-1.5 py-0.5 font-medium">Falta {i.faltan?.length}</span>}
                    {i.linkedUids.length > 0 ? <span className="text-[9px] bg-green-100 text-green-700 rounded-full px-1.5 py-0.5 font-medium">Cuenta{i.linkedUids.length > 1 ? ` ×${i.linkedUids.length}` : ''}</span>
                      : enlazablesDe(i).length > 0 ? <span className="text-[9px] bg-royal/10 text-royal rounded-full px-1.5 py-0.5 font-medium">Enlazable</span>
                      : <span className="text-[9px] bg-gray-100 text-gray-400 rounded-full px-1.5 py-0.5 font-medium">Sin cuenta</span>}
                  </div>
                </button>
                {i.whatsapp && (
                  <a href={`https://wa.me/57${i.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                    className="absolute bottom-3 right-3 w-7 h-7 rounded-full bg-[#25D366]/10 text-[#1ebd5a] hover:bg-[#25D366] hover:text-white flex items-center justify-center transition-colors">
                    <Phone size={13} />
                  </a>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map(i => {
            const sec = getSeccion(i.seccion)
            const isOpen = expanded === i.id
            return (
              <div key={i.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 p-3">
                  <input type="checkbox" checked={selected.has(i.id)} onChange={() => toggleSel(i.id)} className="w-4 h-4 accent-royal shrink-0" />
                  <button onClick={() => setExpanded(isOpen ? null : i.id)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                    <ChevronDown size={16} className={cn('text-gray-300 transition-transform shrink-0', isOpen && 'rotate-180')} />
                    {i.fotoURL ? (
                      <Image src={i.fotoURL} alt="" width={36} height={36} className="rounded-full w-9 h-9 object-cover shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-royal/10 flex items-center justify-center text-royal text-sm font-bold shrink-0">{(i.nombre[0] ?? '?').toUpperCase()}</div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-dark truncate flex items-center gap-1.5">
                        <Highlight text={`${i.nombre} ${i.apellidos}`} query={search} />
                        {esNuevo(i.createdAt) && <span className="text-[9px] bg-gold/20 text-amber-700 rounded-full px-1.5 py-0.5 font-bold shrink-0">NUEVO</span>}
                        {i.esMenor && <span className="text-[9px] bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5 font-medium shrink-0">menor</span>}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{sec?.label ?? i.seccion} · {i.correo}</p>
                    </div>
                  </button>
                  {/* WhatsApp directo */}
                  {i.whatsapp && (
                    <a href={`https://wa.me/57${i.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      title={`WhatsApp ${i.whatsapp}`}
                      className="w-7 h-7 rounded-full bg-[#25D366]/10 text-[#1ebd5a] hover:bg-[#25D366] hover:text-white flex items-center justify-center shrink-0 transition-colors">
                      <Phone size={13} />
                    </a>
                  )}
                  {/* Completitud */}
                  {i.datosCompletos === false && (
                    <span className="text-[10px] bg-red-100 text-red-600 rounded-full px-2 py-1 font-medium hidden sm:flex items-center gap-1 shrink-0" title={(i.faltan ?? []).join(', ')}>
                      <AlertTriangle size={11} /> Falta {i.faltan?.length}
                    </span>
                  )}
                  {/* Vínculo */}
                  {i.linkedUids.length > 0 ? (
                    <span className="text-[10px] bg-green-100 text-green-700 rounded-full px-2 py-1 font-medium flex items-center gap-1 shrink-0"><Link2 size={11} /> Cuenta{i.linkedUids.length > 1 ? ` ×${i.linkedUids.length}` : ''}</span>
                  ) : enlazablesDe(i).length > 0 ? (
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
      {creatingNew && <EditModal integrante={FICHA_VACIA} isNew uid={uid} onClose={() => setCreatingNew(false)} onSaved={() => { setCreatingNew(false); load() }} />}
      {preview && <PreviewModal result={preview} onClose={() => setPreview(null)} />}
      {dupOpen && <DuplicadosModal integrantes={integrantes} uid={uid} onClose={() => setDupOpen(false)} onMerged={load} />}
    </div>
  )
}

// ── Detección y fusión de duplicados ────────────────────────────────
function DuplicadosModal({ integrantes, uid, onClose, onMerged }: {
  integrantes: IntegranteBase[]; uid: string; onClose: () => void; onMerged: () => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const [primarios, setPrimarios] = useState<Record<number, string>>({})

  // Agrupa fichas que comparten nombre completo, correo o WhatsApp (union-find).
  const grupos = useMemo(() => {
    const padre: Record<string, string> = {}
    const find = (x: string): string => { while (padre[x] && padre[x] !== x) { padre[x] = padre[padre[x]]; x = padre[x] } return x }
    const union = (a: string, b: string) => { padre[a] = padre[a] ?? a; padre[b] = padre[b] ?? b; padre[find(a)] = find(b) }
    const porClave = new Map<string, string>()
    for (const i of integrantes) {
      padre[i.id] = padre[i.id] ?? i.id
      const claves = [
        i.nombre && i.apellidos ? `n:${norm(`${i.nombre} ${i.apellidos}`)}` : '',
        i.correo ? `c:${i.correo.toLowerCase().trim()}` : '',
        i.whatsapp ? `w:${i.whatsapp.replace(/\D/g, '')}` : '',
      ].filter(Boolean)
      for (const k of claves) {
        if (porClave.has(k)) union(i.id, porClave.get(k)!)
        else porClave.set(k, i.id)
      }
    }
    const byRoot: Record<string, IntegranteBase[]> = {}
    for (const i of integrantes) { const r = find(i.id); (byRoot[r] ??= []).push(i) }
    return Object.values(byRoot).filter(g => g.length > 1)
      .sort((a, b) => `${a[0].nombre}`.localeCompare(b[0].nombre, 'es'))
  }, [integrantes])

  const fusionar = async (idx: number, grupo: IntegranteBase[]) => {
    const primaryId = primarios[idx] ?? grupo[0].id
    const secundarios = grupo.filter(g => g.id !== primaryId)
    if (!secundarios.length) return
    const correos = correosDe(grupo)
    if (!confirm(
      `Fusionar ${secundarios.length + 1} fichas en una sola.\n\n` +
      `Se conserva la ficha marcada y ${correos.length > 1 ? `AMBOS correos quedan autorizados (${correos.join(', ')})` : 'el correo queda autorizado'}. ` +
      `La otra tarjeta se elimina, pero su correo NO se pierde.\n\n¿Continuar?`,
    )) return
    setBusy(true)
    try {
      for (const s of secundarios) await mergeIntegrantes(primaryId, s.id, uid)
      toast.success('Fichas fusionadas. Ambos correos quedaron autorizados; usa "Enlazar coincidentes" para relacionar las cuentas.', { duration: 7000 })
      await onMerged()
    } catch { toast.error('No se pudo fusionar') }
    finally { setBusy(false) }
  }

  // Correos que quedarán autorizados en la ficha fusionada (de todo el grupo).
  const correosDe = (g: IntegranteBase[]) =>
    Array.from(new Set(g.flatMap(i => [i.correo, ...(i.correosAutorizados ?? [])]).map(c => (c ?? '').toLowerCase().trim()).filter(Boolean)))

  return (
    <div className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-navy text-lg flex items-center gap-2"><GitMerge size={18} className="text-amber-600" /> Posibles duplicados</h3>
            <p className="text-xs text-gray-400">Coinciden en nombre, correo o WhatsApp. Marca cuál conservar y fusiona.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-navy"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          {grupos.length === 0 ? (
            <div className="text-center py-10 text-gray-400"><CheckCircle2 size={32} className="mx-auto mb-2 text-green-500" /><p className="text-sm">No se encontraron duplicados. 🎉</p></div>
          ) : grupos.map((g, idx) => {
            const mejorId = [...g].sort((a, b) => scoreFicha(b) - scoreFicha(a))[0].id
            const primaryId = primarios[idx] ?? mejorId
            return (
              <div key={idx} className="border border-amber-200 rounded-xl overflow-hidden">
                <div className="bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">{g.length} fichas parecidas · <span className="font-normal">se sugiere conservar la más completa (marcada)</span></div>
                <div className="p-3 space-y-1.5">
                  {g.map(i => (
                    <label key={i.id} className={cn('flex items-center gap-3 p-2 rounded-lg cursor-pointer', primaryId === i.id ? 'bg-green-50 border border-green-200' : 'hover:bg-gray-50')}>
                      <input type="radio" name={`dup-${idx}`} checked={primaryId === i.id} onChange={() => setPrimarios(p => ({ ...p, [idx]: i.id }))} className="accent-royal" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-dark truncate flex items-center gap-1.5">
                          {i.nombre} {i.apellidos}
                          {i.id === mejorId && <span className="text-[9px] bg-green-100 text-green-700 rounded-full px-1.5 py-0.5 font-bold shrink-0">MÁS COMPLETA</span>}
                          {i.linkedUids.length > 0 && <span className="text-[9px] bg-blue-100 text-blue-700 rounded-full px-1.5 py-0.5 shrink-0">con cuenta</span>}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {getSeccion(i.seccion)?.label ?? i.seccion} · {i.correo || 'sin correo'} · {i.whatsapp || 'sin WhatsApp'}
                          {i.datosCompletos === false && <span className="text-red-500"> · faltan {i.faltan?.length ?? '?'} datos</span>}
                          {i.datosCompletos === true && <span className="text-green-600"> · datos completos</span>}
                        </p>
                      </div>
                      {primaryId === i.id && <span className="text-[10px] text-green-700 font-semibold shrink-0">Se conserva</span>}
                    </label>
                  ))}
                  {correosDe(g).length > 1 && (
                    <div className="mx-2 mt-1 text-xs text-royal bg-royal/5 border border-royal/15 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
                      <LinkIcon size={12} className="shrink-0 mt-0.5" />
                      <span>Quedarán autorizados ambos correos: <strong className="break-all">{correosDe(g).join(', ')}</strong> — luego usa &ldquo;Enlazar coincidentes&rdquo; para relacionar las cuentas.</span>
                    </div>
                  )}
                  <p className="mx-2 text-[11px] text-gray-400">No se pierden datos: la ficha que se conserva se completa con los datos de la(s) otra(s) antes de eliminarla(s).</p>
                  <div className="flex justify-end pt-1">
                    <button onClick={() => fusionar(idx, g)} disabled={busy} className="btn btn-primary btn-sm disabled:opacity-60"><GitMerge size={13} /> Conservar la marcada y fusionar</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
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
    ...(base.esMenor ? [['Autorización menor', base.autorizacionMenor?.estado === 'firmada'
      ? `Firmada por ${base.autorizacionMenor.acudienteNombre} (${base.autorizacionMenor.parentesco})`
      : 'Pendiente'] as [string, string]] : []),
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

const FICHA_VACIA: Integrante = {
  id: '', nombre: '', apellidos: '', tipoDoc: '', numDoc: '', fechaNacimiento: '',
  seccion: '', familia: '', secciones: [], whatsapp: '', correo: '', direccion: '',
  tipoSangre: '', eps: '', pasaporte: false, contactoEmergencia: '', diagnostico: '',
  activo: true, createdAt: new Date(), updatedAt: new Date(),
}

function EditModal({ integrante, onClose, onSaved, uid, isNew }: { integrante: Integrante; onClose: () => void; onSaved: () => void; uid: string; isNew?: boolean }) {
  const [form, setForm] = useState<Integrante>(integrante)
  const [saving, setSaving] = useState(false)
  const set = (k: keyof Integrante, v: unknown) => setForm({ ...form, [k]: v })
  const save = async () => {
    if (!form.nombre.trim() || !form.apellidos.trim()) { toast.error('Nombre y apellidos son obligatorios'); return }
    if (!form.correo.trim()) { toast.error('El correo es obligatorio'); return }
    setSaving(true)
    try {
      const patch: Partial<Integrante> = { ...form }
      if (form.seccion) { const sec = getSeccion(form.seccion); patch.seccion = sec?.key ?? form.seccion; patch.familia = sec?.familia ?? form.familia; if (!patch.secciones?.length) patch.secciones = sec ? [sec.key] : [] }
      // Normaliza los correos con acceso (incluye siempre el correo principal)
      patch.correosAutorizados = Array.from(new Set([form.correo, ...(form.correosAutorizados ?? [])].map(c => c.trim().toLowerCase()).filter(Boolean)))
      delete (patch as Record<string, unknown>).createdAt; delete (patch as Record<string, unknown>).updatedAt; delete (patch as Record<string, unknown>).linkedUids
      await upsertIntegrante(isNew ? null : integrante.id, patch, uid)
      toast.success(isNew ? 'Integrante creado' : 'Ficha actualizada'); onSaved()
    } catch { toast.error('Error al guardar') } finally { setSaving(false) }
  }
  return (
    <div className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif font-bold text-navy text-lg">{isNew ? 'Nuevo integrante' : 'Editar ficha'}</h3>
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
          <Fld label="Correos con acceso (además del principal, separados por coma)" full>
            <input className="input" value={(form.correosAutorizados ?? []).join(', ')}
              onChange={e => set('correosAutorizados', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              placeholder="otro-correo@gmail.com, tercero@hotmail.com" />
            <p className="text-[11px] text-gray-400 mt-1">Cualquiera de estos correos podrá entrar y ver/editar esta ficha. Se enlazan con &ldquo;Enlazar coincidentes&rdquo; cuando la cuenta exista.</p>
          </Fld>
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
