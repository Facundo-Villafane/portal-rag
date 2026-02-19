'use client'

import { useState, useRef } from 'react'
import { Loader2, UploadCloud, CheckCircle2, AlertCircle, FileText, X, PenLine, BookOpen, ClipboardList, Calendar, Award, ListTree, Plus, Trash2, GripVertical } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

type Tab = 'archivo' | 'texto'

type PlantillaId = 'temario' | 'teorico' | 'parcial' | 'evaluacion' | 'cronograma' | 'libre'

interface Plantilla {
    id: PlantillaId
    label: string
    icon: React.ElementType
    color: string
    campos: Campo[]
}

interface Campo {
    name: string
    label: string
    tipo: 'input' | 'textarea'
    placeholder: string
    requerido?: boolean
    maxLength?: number
}

interface Unidad {
    id: string
    nombre: string      // e.g. "Unidad 1", "Módulo A"
    contenido: string
}

const PLANTILLAS: Plantilla[] = [
    {
        id: 'temario',
        label: 'Programa / Temario',
        icon: ListTree,
        color: 'indigo',
        campos: [
            { name: 'titulo', label: 'Nombre del programa', tipo: 'input', placeholder: 'Ej: Programa Billetaje y Reservas 2025', requerido: true, maxLength: 100 },
            { name: 'descripcion', label: 'Descripción general de la materia', tipo: 'textarea', placeholder: 'Breve descripción de la materia, objetivos generales...', maxLength: 600 },
            // unidades are rendered separately (dynamic list)
            { name: 'bibliografia', label: 'Bibliografía', tipo: 'textarea', placeholder: 'Libros, apuntes, recursos recomendados...', maxLength: 600 },
        ]
    },
    {
        id: 'teorico',
        label: 'Contenido Teórico',
        icon: BookOpen,
        color: 'blue',
        campos: [
            { name: 'titulo', label: 'Título del tema', tipo: 'input', placeholder: 'Ej: Álgebra Lineal - Vectores', requerido: true, maxLength: 100 },
            { name: 'unidad', label: 'Unidad / Módulo', tipo: 'input', placeholder: 'Ej: Unidad 3', maxLength: 60 },
            { name: 'contenido', label: 'Desarrollo del contenido', tipo: 'textarea', placeholder: 'Pegá o escribí el contenido teórico aquí...', requerido: true, maxLength: 4000 },
            { name: 'referencias', label: 'Bibliografía / Referencias', tipo: 'textarea', placeholder: 'Ej: Libro X, capítulo Y...', maxLength: 600 },
        ]
    },
    {
        id: 'parcial',
        label: 'Consigna de Parcial',
        icon: ClipboardList,
        color: 'orange',
        campos: [
            { name: 'titulo', label: 'Nombre del parcial', tipo: 'input', placeholder: 'Ej: Primer Parcial 2025', requerido: true, maxLength: 100 },
            { name: 'fecha', label: 'Fecha del parcial', tipo: 'input', placeholder: 'Ej: 15 de mayo de 2025', maxLength: 60 },
            { name: 'duracion', label: 'Duración', tipo: 'input', placeholder: 'Ej: 2 horas', maxLength: 40 },
            { name: 'temas', label: 'Temas que entran', tipo: 'textarea', placeholder: 'Lista los temas que se evalúan...', requerido: true, maxLength: 1500 },
            { name: 'consignas', label: 'Consignas / Ejercicios', tipo: 'textarea', placeholder: 'Escribí las consignas del examen...', maxLength: 3000 },
            { name: 'nota', label: 'Aclaraciones adicionales', tipo: 'textarea', placeholder: 'Material permitido, modalidad, etc.', maxLength: 600 },
        ]
    },
    {
        id: 'evaluacion',
        label: 'Criterios de Evaluación',
        icon: Award,
        color: 'purple',
        campos: [
            { name: 'titulo', label: 'Título', tipo: 'input', placeholder: 'Ej: Criterios de evaluación 2025', requerido: true, maxLength: 100 },
            { name: 'aprobacion', label: 'Condiciones de aprobación', tipo: 'textarea', placeholder: 'Ej: Nota mínima, asistencia requerida...', requerido: true, maxLength: 1500 },
            { name: 'criterios', label: 'Criterios de calificación', tipo: 'textarea', placeholder: 'Describí cómo se puntúa cada instancia...', maxLength: 1500 },
            { name: 'recuperatorios', label: 'Régimen de recuperatorios', tipo: 'textarea', placeholder: 'Condiciones para acceder al recuperatorio...', maxLength: 800 },
        ]
    },
    {
        id: 'cronograma',
        label: 'Fechas / Cronograma',
        icon: Calendar,
        color: 'green',
        campos: [
            { name: 'titulo', label: 'Título', tipo: 'input', placeholder: 'Ej: Cronograma 1er cuatrimestre 2025', requerido: true, maxLength: 100 },
            { name: 'cronograma', label: 'Cronograma de clases y fechas importantes', tipo: 'textarea', placeholder: 'Listá semana a semana o por fecha los temas y eventos...', requerido: true, maxLength: 3000 },
            { name: 'parciales', label: 'Fechas de parciales', tipo: 'textarea', placeholder: 'Ej: Primer parcial: 15/05, Segundo parcial: 20/06...', maxLength: 600 },
            { name: 'entregas', label: 'Fechas de entrega de trabajos', tipo: 'textarea', placeholder: 'Ej: TP1: 30/04...', maxLength: 600 },
        ]
    },
    {
        id: 'libre',
        label: 'Texto Libre',
        icon: PenLine,
        color: 'slate',
        campos: [
            { name: 'titulo', label: 'Título', tipo: 'input', placeholder: 'Título del documento', requerido: true, maxLength: 100 },
            { name: 'contenido', label: 'Contenido', tipo: 'textarea', placeholder: 'Escribí lo que necesites...', requerido: true, maxLength: 4000 },
        ]
    },
]

const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:border-indigo-400',
    blue: 'bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-400',
    orange: 'bg-orange-50 text-orange-700 border-orange-200 hover:border-orange-400',
    purple: 'bg-purple-50 text-purple-700 border-purple-200 hover:border-purple-400',
    green: 'bg-green-50 text-green-700 border-green-200 hover:border-green-400',
    slate: 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400',
}
const colorActiveMap: Record<string, string> = {
    indigo: 'bg-indigo-100 border-indigo-500 text-indigo-800',
    blue: 'bg-blue-100 border-blue-500 text-blue-800',
    orange: 'bg-orange-100 border-orange-500 text-orange-800',
    purple: 'bg-purple-100 border-purple-500 text-purple-800',
    green: 'bg-green-100 border-green-500 text-green-800',
    slate: 'bg-slate-100 border-slate-500 text-slate-800',
}

interface FileItem {
    file: File
    titulo: string
}

function buildTextoFromCampos(
    plantilla: Plantilla,
    values: Record<string, string>,
    unidades: Unidad[] = []
): { titulo: string; contenido: string } {
    const titulo = values['titulo'] || plantilla.label

    // Special builder for temario — dynamic units list
    if (plantilla.id === 'temario') {
        const lines: string[] = [`# PROGRAMA DE LA MATERIA: ${titulo}`, '']
        const desc = values['descripcion']?.trim()
        if (desc) { lines.push('## Descripción General', desc, '') }
        if (unidades.length > 0) {
            lines.push('## TEMARIO COMPLETO', '')
            for (const u of unidades) {
                const contenido = u.contenido.trim()
                if (!contenido) continue
                lines.push(`### ${u.nombre}`)
                lines.push(contenido)
                lines.push('')
            }
        }
        const bib = values['bibliografia']?.trim()
        if (bib) { lines.push('## Bibliografía', bib, '') }
        return { titulo, contenido: lines.join('\n') }
    }

    const lines: string[] = [`# ${titulo}`, '']
    for (const campo of plantilla.campos) {
        if (campo.name === 'titulo') continue
        const val = values[campo.name]?.trim()
        if (!val) continue
        lines.push(`## ${campo.label}`)
        lines.push(val)
        lines.push('')
    }

    return { titulo, contenido: lines.join('\n') }
}

export function IngestForm({ materiaId }: { materiaId: string }) {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [tab, setTab] = useState<Tab>('archivo')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)

    // File tab state
    const [files, setFiles] = useState<FileItem[]>([])

    // Text tab state
    const [plantillaId, setPlantillaId] = useState<PlantillaId>('temario')
    const [campoValues, setCampoValues] = useState<Record<string, string>>({})
    const [unidades, setUnidades] = useState<Unidad[]>([{ id: '1', nombre: 'Unidad 1', contenido: '' }])

    function addUnidad() {
        const next = unidades.length + 1
        setUnidades(prev => [...prev, { id: String(Date.now()), nombre: `Unidad ${next}`, contenido: '' }])
    }

    function removeUnidad(id: string) {
        setUnidades(prev => prev.filter(u => u.id !== id))
    }

    function updateUnidad(id: string, field: 'nombre' | 'contenido', value: string) {
        setUnidades(prev => prev.map(u => u.id === id ? { ...u, [field]: value } : u))
    }

    const plantilla = PLANTILLAS.find(p => p.id === plantillaId)!

    // ── File handling ──────────────────────────────────────────
    function handleFiles(incoming: File[]) {
        const valid = incoming.filter(f =>
            f.type === 'application/pdf' || f.name.endsWith('.pdf') ||
            f.type === 'text/plain' || f.name.endsWith('.txt') ||
            f.name.endsWith('.md')
        )
        const invalid = incoming.filter(f => !valid.includes(f))
        if (invalid.length) setError(`Archivos no soportados: ${invalid.map(f => f.name).join(', ')}`)

        setFiles(prev => [
            ...prev,
            ...valid.map(f => ({ file: f, titulo: f.name.replace(/\.(pdf|txt|md)$/i, '') }))
        ])
    }

    function handleDragOver(e: React.DragEvent) { e.preventDefault(); setIsDragging(true) }
    function handleDragLeave(e: React.DragEvent) { e.preventDefault(); setIsDragging(false) }
    function handleDrop(e: React.DragEvent) { e.preventDefault(); setIsDragging(false); handleFiles(Array.from(e.dataTransfer.files)) }

    // ── Submit file ────────────────────────────────────────────
    async function submitFiles() {
        if (!files.length) { setError('Agregá al menos un archivo'); return }
        setLoading(true); setError(null); setSuccess(null)
        try {
            for (const item of files) {
                const fd = new FormData()
                fd.append('materia_id', materiaId)
                fd.append('titulo', item.titulo)
                fd.append('file', item.file)
                const res = await fetch('/api/ingest', { method: 'POST', body: fd })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error || 'Error al indexar')
            }
            setSuccess(`${files.length} archivo${files.length > 1 ? 's' : ''} indexado${files.length > 1 ? 's' : ''} correctamente`)
            setFiles([])
            router.refresh()
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    // ── Submit text ────────────────────────────────────────────
    async function submitTexto() {
        const missing = plantilla.campos.filter(c => c.requerido && !campoValues[c.name]?.trim())
        if (missing.length) { setError(`Completá los campos requeridos: ${missing.map(c => c.label).join(', ')}`); return }

        const { titulo, contenido } = buildTextoFromCampos(plantilla, campoValues, unidades)
        setLoading(true); setError(null); setSuccess(null)
        try {
            const res = await fetch('/api/ingest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ materia_id: materiaId, titulo, contenido }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Error al indexar')
            setSuccess('Texto indexado correctamente')
            setCampoValues({})
            setUnidades([{ id: '1', nombre: 'Unidad 1', contenido: '' }])
            router.refresh()
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    const fileExt = (f: File) => f.name.split('.').pop()?.toUpperCase() || 'FILE'
    const fileSize = (f: File) => f.size < 1024 * 1024
        ? `${(f.size / 1024).toFixed(0)} KB`
        : `${(f.size / 1024 / 1024).toFixed(1)} MB`

    return (
        <div className="space-y-5">
            {/* Feedback */}
            {success && (
                <div className="p-3 bg-green-50 text-green-700 rounded-lg flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{success}</span>
                    <button onClick={() => setSuccess(null)} className="ml-auto"><X className="w-4 h-4" /></button>
                </div>
            )}
            {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
                </div>
            )}

            {/* Tabs */}
            <div className="flex border border-slate-200 rounded-lg overflow-hidden">
                <button
                    onClick={() => setTab('archivo')}
                    className={cn('flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors',
                        tab === 'archivo' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50')}
                >
                    <UploadCloud className="w-4 h-4" /> Subir Archivo
                </button>
                <button
                    onClick={() => setTab('texto')}
                    className={cn('flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors border-l border-slate-200',
                        tab === 'texto' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50')}
                >
                    <PenLine className="w-4 h-4" /> Escribir Texto
                </button>
            </div>

            {/* ── FILE TAB ── */}
            {tab === 'archivo' && (
                <div className="space-y-4">
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                            'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
                            isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                        )}
                    >
                        <input ref={fileInputRef} type="file" multiple accept=".pdf,.txt,.md" onChange={e => { if (e.target.files) handleFiles(Array.from(e.target.files)) }} className="hidden" />
                        <UploadCloud className={cn('w-10 h-10 mx-auto mb-3', isDragging ? 'text-blue-500' : 'text-slate-400')} />
                        <p className="font-medium text-slate-700 text-sm">Arrastrá archivos o hacé clic para seleccionar</p>
                        <p className="text-xs text-slate-400 mt-1">PDF, TXT, MD — máx. 10 MB c/u</p>
                    </div>

                    {files.length > 0 && (
                        <div className="space-y-2">
                            {files.map((item, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <FileText className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <input
                                            value={item.titulo}
                                            onChange={e => setFiles(prev => prev.map((f, j) => j === i ? { ...f, titulo: e.target.value } : f))}
                                            className="w-full text-sm font-medium text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-400 outline-none pb-0.5"
                                        />
                                        <p className="text-xs text-slate-400 mt-0.5">{fileExt(item.file)} · {fileSize(item.file)}</p>
                                    </div>
                                    <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={submitFiles}
                        disabled={loading || files.length === 0}
                        className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm transition-colors"
                    >
                        {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Procesando...</> : <><UploadCloud className="w-4 h-4" />Indexar {files.length > 0 ? `${files.length} archivo${files.length > 1 ? 's' : ''}` : 'archivos'}</>}
                    </button>
                </div>
            )}

            {/* ── TEXT TAB ── */}
            {tab === 'texto' && (
                <div className="space-y-4">
                    {/* Plantilla selector */}
                    <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Tipo de contenido</p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {PLANTILLAS.map(p => {
                                const Icon = p.icon
                                const isActive = plantillaId === p.id
                                return (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => { setPlantillaId(p.id); setCampoValues({}); setUnidades([{ id: '1', nombre: 'Unidad 1', contenido: '' }]) }}
                                        className={cn(
                                            'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all text-left',
                                            isActive ? colorActiveMap[p.color] : colorMap[p.color]
                                        )}
                                    >
                                        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                                        {p.label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Campos de la plantilla */}
                    <div className="space-y-3">
                        {plantilla.campos
                            .filter(c => c.name !== 'bibliografia' || plantilla.id !== 'temario')
                            .map(campo => {
                            const val = campoValues[campo.name] || ''
                            const len = val.length
                            const max = campo.maxLength
                            const nearLimit = max && len >= max * 0.9
                            return (
                                <div key={campo.name}>
                                    <div className="flex items-baseline justify-between mb-1">
                                        <label className="text-xs font-medium text-slate-700">
                                            {campo.label}{campo.requerido && <span className="text-red-500 ml-0.5">*</span>}
                                        </label>
                                        {max && (
                                            <span className={`text-xs tabular-nums ${nearLimit ? 'text-amber-600 font-medium' : 'text-slate-400'}`}>
                                                {len}/{max}
                                            </span>
                                        )}
                                    </div>
                                    {campo.tipo === 'input' ? (
                                        <input
                                            type="text"
                                            value={val}
                                            onChange={e => setCampoValues(prev => ({ ...prev, [campo.name]: e.target.value }))}
                                            placeholder={campo.placeholder}
                                            maxLength={max}
                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        />
                                    ) : (
                                        <textarea
                                            rows={campo.name === 'contenido' || campo.name === 'consignas' || campo.name === 'cronograma' ? 5 : 3}
                                            value={val}
                                            onChange={e => setCampoValues(prev => ({ ...prev, [campo.name]: e.target.value }))}
                                            placeholder={campo.placeholder}
                                            maxLength={max}
                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y"
                                        />
                                    )}
                                </div>
                            )
                        })}

                        {/* ── Dynamic units (temario only) ── */}
                        {plantilla.id === 'temario' && (
                            <div className="space-y-2 pt-1">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-medium text-slate-700">Unidades / Módulos</p>
                                    <button
                                        type="button"
                                        onClick={addUnidad}
                                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Agregar
                                    </button>
                                </div>

                                {unidades.map((u, idx) => (
                                    <div key={u.id} className="border border-slate-200 rounded-lg overflow-hidden">
                                        {/* Unit header row */}
                                        <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 border-b border-slate-200">
                                            <GripVertical className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                                            <input
                                                type="text"
                                                value={u.nombre}
                                                onChange={e => updateUnidad(u.id, 'nombre', e.target.value)}
                                                placeholder={`Unidad ${idx + 1}`}
                                                maxLength={80}
                                                className="flex-1 text-xs font-medium text-slate-800 bg-transparent outline-none placeholder:text-slate-400"
                                            />
                                            {unidades.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeUnidad(u.id)}
                                                    className="p-0.5 text-slate-400 hover:text-red-500 rounded transition-colors flex-shrink-0"
                                                    title="Eliminar unidad"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                        {/* Unit body */}
                                        <textarea
                                            rows={3}
                                            value={u.contenido}
                                            onChange={e => updateUnidad(u.id, 'contenido', e.target.value)}
                                            placeholder={`- Tema ${idx + 1}.1\n- Tema ${idx + 1}.2\n- Tema ${idx + 1}.3`}
                                            maxLength={1200}
                                            className="w-full px-3 py-2 text-sm border-0 outline-none resize-y bg-white"
                                        />
                                        <div className="px-3 pb-1 text-right">
                                            <span className={`text-xs tabular-nums ${u.contenido.length >= 1080 ? 'text-amber-600 font-medium' : 'text-slate-300'}`}>
                                                {u.contenido.length}/1200
                                            </span>
                                        </div>
                                    </div>
                                ))}

                                {/* Bibliografía — shown after the units */}
                                {(() => {
                                    const campo = plantilla.campos.find(c => c.name === 'bibliografia')!
                                    const val = campoValues['bibliografia'] || ''
                                    const nearLimit = val.length >= (campo.maxLength ?? 600) * 0.9
                                    return (
                                        <div className="pt-1">
                                            <div className="flex items-baseline justify-between mb-1">
                                                <label className="text-xs font-medium text-slate-700">{campo.label}</label>
                                                <span className={`text-xs tabular-nums ${nearLimit ? 'text-amber-600 font-medium' : 'text-slate-400'}`}>
                                                    {val.length}/{campo.maxLength}
                                                </span>
                                            </div>
                                            <textarea
                                                rows={3}
                                                value={val}
                                                onChange={e => setCampoValues(prev => ({ ...prev, bibliografia: e.target.value }))}
                                                placeholder={campo.placeholder}
                                                maxLength={campo.maxLength}
                                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y"
                                            />
                                        </div>
                                    )
                                })()}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={submitTexto}
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm transition-colors"
                    >
                        {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Indexando...</> : <><PenLine className="w-4 h-4" />Indexar contenido</>}
                    </button>
                </div>
            )}
        </div>
    )
}
