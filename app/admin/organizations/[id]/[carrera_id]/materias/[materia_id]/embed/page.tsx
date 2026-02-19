import { createClient } from '@/lib/supabase/server'
import { AdminLayout } from '@/components/admin-layout'
import { notFound } from 'next/navigation'
import { EmbedSnippet } from '../config/embed-snippet'
import { ArrowLeft, Code2 } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
    params: Promise<{ id: string; carrera_id: string; materia_id: string }>
}

export default async function EmbedPage({ params }: PageProps) {
    const { id, carrera_id, materia_id } = await params
    const supabase = await createClient()

    const { data: materia } = await supabase
        .from('materia')
        .select('nombre, carrera:carrera_id(nombre)')
        .eq('materia_id', materia_id)
        .single()

    if (!materia) notFound()

    const carrera = materia.carrera as { nombre?: string } | null

    return (
        <AdminLayout organizationId={id}>
            <div className="h-full flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/admin/organizations/${id}/${carrera_id}/materias/${materia_id}/config`}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Volver a Configuración"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-bold text-slate-900">Integración iframe</h1>
                                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">
                                    {materia.nombre}
                                </span>
                            </div>
                            <p className="text-slate-500 mt-0.5 text-sm">
                                {carrera?.nombre} · Embebé el chatbot en Moodle u otras plataformas
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-slate-50">
                    <div className="max-w-2xl mx-auto p-6 space-y-6">

                        {/* Info card */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
                            <Code2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-800">
                                <p className="font-medium mb-1">¿Cómo funciona?</p>
                                <p className="text-blue-700 leading-relaxed">
                                    Copiá el código iframe y pegalo en cualquier plataforma que soporte HTML
                                    (Moodle, Notion, WordPress, etc.). Los alumnos pueden chatear sin necesidad
                                    de tener una cuenta — el acceso es público.
                                </p>
                            </div>
                        </div>

                        <EmbedSnippet materiaId={materia_id} />
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}
