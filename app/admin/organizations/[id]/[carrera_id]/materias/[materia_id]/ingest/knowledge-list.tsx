'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Trash2, Loader2, BookOpen, ClipboardList, Calendar, Award, PenLine, ChevronDown, ChevronRight, Pencil, Check, X, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DocEntry {
    titulo: string
    created_at: string
    chunks: number
}

// Guess icon from title keywords
function docIcon(titulo: string) {
    const t = titulo.toLowerCase()
    if (t.includes('parcial') || t.includes('examen') || t.includes('consigna')) return ClipboardList
    if (t.includes('fecha') || t.includes('cronograma') || t.includes('calendario')) return Calendar
    if (t.includes('criterio') || t.includes('evaluación') || t.includes('evaluacion') || t.includes('nota')) return Award
    if (t.includes('teori') || t.includes('unidad') || t.includes('módulo') || t.includes('modulo')) return BookOpen
    return FileText
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function KnowledgeList({ docs, materiaId }: { docs: DocEntry[]; materiaId: string }) {
    const router = useRouter()
    const [deleting, setDeleting] = useState<string | null>(null)
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

    // Edit state
    const [editing, setEditing] = useState<string | null>(null)       // titulo being edited
    const [editContent, setEditContent] = useState('')
    const [loadingEdit, setLoadingEdit] = useState(false)
    const [savingEdit, setSavingEdit] = useState(false)
    const [editError, setEditError] = useState<string | null>(null)

    async function openEdit(titulo: string) {
        setEditing(titulo)
        setEditError(null)
        setEditContent('')
        setLoadingEdit(true)
        try {
            const res = await fetch(`/api/ingest?materia_id=${encodeURIComponent(materiaId)}&titulo=${encodeURIComponent(titulo)}`)
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Error al cargar el contenido')
            setEditContent(data.contenido)
        } catch (e: unknown) {
            setEditError(e instanceof Error ? e.message : 'Error desconocido')
        } finally {
            setLoadingEdit(false)
        }
    }

    function closeEdit() {
        setEditing(null)
        setEditContent('')
        setEditError(null)
    }

    async function saveEdit(titulo: string) {
        if (!editContent.trim()) { setEditError('El contenido no puede estar vacío'); return }
        setSavingEdit(true)
        setEditError(null)
        try {
            // 1. Delete old chunks
            const delRes = await fetch('/api/ingest', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ materia_id: materiaId, titulo }),
            })
            if (!delRes.ok) {
                const d = await delRes.json()
                throw new Error(d.error || 'Error al eliminar contenido anterior')
            }

            // 2. Re-index with new content
            const postRes = await fetch('/api/ingest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ materia_id: materiaId, titulo, contenido: editContent }),
            })
            if (!postRes.ok) {
                const d = await postRes.json()
                throw new Error(d.error || 'Error al re-indexar')
            }

            closeEdit()
            router.refresh()
        } catch (e: unknown) {
            setEditError(e instanceof Error ? e.message : 'Error desconocido')
        } finally {
            setSavingEdit(false)
        }
    }

    async function handleDelete(titulo: string) {
        setDeleting(titulo)
        try {
            const res = await fetch('/api/ingest', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ materia_id: materiaId, titulo }),
            })
            if (!res.ok) {
                const d = await res.json()
                alert(d.error || 'Error al eliminar')
            } else {
                router.refresh()
            }
        } finally {
            setDeleting(null)
            setConfirmDelete(null)
        }
    }

    if (docs.length === 0) {
        return (
            <div className="text-center py-8 text-slate-400">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Aún no hay documentos indexados</p>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {docs.map((doc) => {
                const Icon = docIcon(doc.titulo)
                const isConfirming = confirmDelete === doc.titulo
                const isDeleting = deleting === doc.titulo
                const isEditing = editing === doc.titulo

                return (
                    <div key={doc.titulo} className={cn(
                        'rounded-lg border transition-colors',
                        isEditing ? 'border-blue-300 bg-blue-50/30' :
                        isConfirming ? 'border-red-200 bg-red-50' :
                        'border-slate-200 bg-slate-50 hover:border-slate-300'
                    )}>
                        {/* ── Doc row ── */}
                        <div className="flex items-center gap-3 p-3">
                            <div className="w-8 h-8 bg-white rounded-lg border border-slate-200 flex items-center justify-center flex-shrink-0">
                                <Icon className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">{doc.titulo}</p>
                                <p className="text-xs text-slate-400">{doc.chunks} chunk{doc.chunks !== 1 ? 's' : ''} · {formatDate(doc.created_at)}</p>
                            </div>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium flex-shrink-0">
                                Activo
                            </span>

                            {!isConfirming && !isEditing && (
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                        onClick={() => openEdit(doc.titulo)}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Editar contenido"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setConfirmDelete(doc.titulo)}
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Eliminar documento"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {isEditing && !isConfirming && (
                                <button
                                    onClick={closeEdit}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors flex-shrink-0"
                                    title="Cancelar edición"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}

                            {isConfirming && (
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                        onClick={() => setConfirmDelete(null)}
                                        className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(doc.titulo)}
                                        disabled={isDeleting}
                                        className="px-2 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-1 transition-colors"
                                    >
                                        {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                        Eliminar
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* ── Inline editor ── */}
                        {isEditing && (
                            <div className="border-t border-blue-200 p-3 space-y-2">
                                {loadingEdit ? (
                                    <div className="flex items-center justify-center gap-2 py-6 text-slate-400 text-sm">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Cargando contenido...
                                    </div>
                                ) : (
                                    <>
                                        {editError && (
                                            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                                                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                                {editError}
                                            </div>
                                        )}
                                        <textarea
                                            value={editContent}
                                            onChange={e => setEditContent(e.target.value)}
                                            rows={10}
                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y font-mono bg-white"
                                            placeholder="Contenido del documento..."
                                        />
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-slate-400">
                                                Al guardar se re-indexa el contenido completo.
                                            </p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={closeEdit}
                                                    disabled={savingEdit}
                                                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    onClick={() => saveEdit(doc.titulo)}
                                                    disabled={savingEdit}
                                                    className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                                                >
                                                    {savingEdit
                                                        ? <><Loader2 className="w-3 h-3 animate-spin" />Re-indexando...</>
                                                        : <><Check className="w-3 h-3" />Guardar y re-indexar</>
                                                    }
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
