import { createClient } from '@/lib/supabase/server'
import { AdminLayout } from '@/components/admin-layout'
import { notFound } from 'next/navigation'
import { IngestForm } from './ingest-form'
import { KnowledgeList } from './knowledge-list'
import { FileText, Eye, Settings2 } from 'lucide-react'
import { ChatInterface } from '@/components/chat-interface'
import Link from 'next/link'

interface PageProps {
    params: Promise<{ id: string; carrera_id: string; materia_id: string }>
}

function resolveWelcomeMessage(template: string | undefined, nombreBot: string, nombreMateria: string): string {
    const base = template || `¡Hola! Soy {nombre_bot}. ¿En qué puedo ayudarte con ${nombreMateria}?`
    return base.replace(/{nombre_bot}/g, nombreBot)
}

export default async function IngestPage({ params }: PageProps) {
    const { id, carrera_id, materia_id } = await params
    const supabase = await createClient()

    const { data: materia } = await supabase
        .from('materia')
        .select('*, carrera:carrera_id(nombre), organization:org_id(nombre, logo_url)')
        .eq('materia_id', materia_id)
        .single()

    if (!materia) notFound()

    // Get all entries grouped by titulo
    const { data: entries } = await supabase
        .from('knowledge_entry')
        .select('titulo, created_at')
        .eq('materia_id', materia_id)
        .order('created_at', { ascending: false })

    // Deduplicate: one entry per titulo, keeping earliest created_at
    const docsMap = new Map<string, { titulo: string; created_at: string; chunks: number }>()
    for (const e of entries || []) {
        if (!docsMap.has(e.titulo)) {
            docsMap.set(e.titulo, { titulo: e.titulo, created_at: e.created_at, chunks: 1 })
        } else {
            docsMap.get(e.titulo)!.chunks++
        }
    }
    const docs = Array.from(docsMap.values())
    const totalChunks = entries?.length || 0

    return (
        <AdminLayout organizationId={id}>
            <div className="h-full flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-bold text-slate-900">Knowledge Manager</h1>
                                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                    {materia.nombre}
                                </span>
                            </div>
                            <p className="text-slate-500 mt-0.5 text-sm">
                                {materia.carrera?.nombre} · {docs.length} documentos · {totalChunks} chunks indexados
                            </p>
                        </div>
                        <Link
                            href={`/admin/organizations/${id}/${carrera_id}/materias/${materia_id}/config`}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Settings2 className="w-4 h-4" />
                            Configuración del Bot
                        </Link>
                    </div>
                </div>

                {/* 2-col layout */}
                <div className="flex-1 overflow-hidden flex">

                    {/* Left column */}
                    <div className="w-1/2 border-r border-slate-200 overflow-y-auto bg-slate-50 h-full">
                        <div className="p-6 space-y-6">

                            {/* Upload / Write */}
                            <div className="bg-white rounded-xl border border-slate-200 p-5">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                                        <FileText className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-slate-900 text-sm">Agregar contenido</h2>
                                        <p className="text-xs text-slate-500">Subí archivos o escribí el contenido directamente</p>
                                    </div>
                                </div>
                                <IngestForm materiaId={materia.materia_id} />
                            </div>

                            {/* Knowledge base list */}
                            <div className="bg-white rounded-xl border border-slate-200 p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="font-semibold text-slate-900 text-sm">Base de conocimiento</h2>
                                        <p className="text-xs text-slate-500">{docs.length} documento{docs.length !== 1 ? 's' : ''} indexado{docs.length !== 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                                <KnowledgeList docs={docs} materiaId={materia.materia_id} />
                            </div>

                        </div>
                    </div>

                    {/* Right: live preview */}
                    <div className="w-1/2 bg-white flex flex-col overflow-hidden h-full">
                        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex items-center gap-3 flex-shrink-0">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                <Eye className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 text-sm">Vista Previa en Vivo</h3>
                                <p className="text-xs text-slate-500">Probá el chatbot con el contenido indexado</p>
                            </div>
                        </div>
                        <div className="flex-1 min-h-0 overflow-hidden">
                            <ChatInterface
                                materiaId={materia.materia_id}
                                materiaNombre={materia.nombre}
                                botNombre={materia.config_bot?.nombre_bot}
                                orgNombre={(materia.organization as { nombre?: string } | null)?.nombre}
                                orgLogoUrl={(materia.organization as { logo_url?: string } | null)?.logo_url}
                                carreraNombre={(materia.carrera as { nombre?: string } | null)?.nombre}
                                theme={materia.config_bot?.theme}
                                hideHeader
                                welcomeMessage={resolveWelcomeMessage(
                                    materia.config_bot?.welcome_message,
                                    materia.config_bot?.nombre_bot || `Asistente de ${materia.nombre}`,
                                    materia.nombre,
                                )}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}
