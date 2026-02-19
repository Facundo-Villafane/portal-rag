import { createClient } from '@/lib/supabase/server'
import { AdminLayout } from '@/components/admin-layout'
import { notFound } from 'next/navigation'
import { ConfigForm } from './config-form'
import { ArrowLeft, Bot, Code2 } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
    params: Promise<{ id: string; carrera_id: string; materia_id: string }>
}

export default async function BotConfigPage({ params }: PageProps) {
    const { id, carrera_id, materia_id } = await params
    const supabase = await createClient()

    const [{ data: materia }, { data: { user } }] = await Promise.all([
        supabase.from('materia').select('*, carrera:carrera_id(nombre)').eq('materia_id', materia_id).single(),
        supabase.auth.getUser(),
    ])

    if (!materia) notFound()

    // Determine if caller can edit advanced settings
    let canEditAdvanced = false
    if (user) {
        const { data: userData } = await supabase
            .from('app_user')
            .select('rol')
            .eq('user_id', user.id)
            .single()

        if (userData?.rol === 'admin' || userData?.rol === 'superadmin') {
            canEditAdvanced = true
        } else if (userData?.rol === 'profesor') {
            const { data: org } = await supabase
                .from('organization')
                .select('config_global')
                .eq('org_id', materia.org_id)
                .single()
            canEditAdvanced = org?.config_global?.profesores_config_avanzada === true
        }
    }

    const carrera = materia.carrera as { nombre?: string } | null

    return (
        <AdminLayout organizationId={id}>
            <div className="h-full flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/admin/organizations/${id}/${carrera_id}/materias/${materia_id}/ingest`}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Volver al Knowledge Manager"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-bold text-slate-900">Configuración del Bot</h1>
                                <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                                    {materia.nombre}
                                </span>
                            </div>
                            <p className="text-slate-500 mt-0.5 text-sm">
                                {carrera?.nombre} · Personaliza el comportamiento y apariencia del asistente
                            </p>
                        </div>
                        {/* Link to embed page */}
                        <Link
                            href={`/admin/organizations/${id}/${carrera_id}/materias/${materia_id}/embed`}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium transition-colors border border-emerald-200"
                        >
                            <Code2 className="w-4 h-4" />
                            Integración iframe
                        </Link>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-slate-50">
                    <div className="max-w-2xl mx-auto p-6">
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-slate-900">Parámetros del asistente</h2>
                                    <p className="text-xs text-slate-500">Los cambios se aplican inmediatamente al guardar</p>
                                </div>
                            </div>
                            <ConfigForm
                                canEditAdvanced={canEditAdvanced}
                                materia={{
                                    materia_id: materia.materia_id,
                                    org_id: materia.org_id,
                                    carrera_id: materia.carrera_id,
                                    nombre: materia.nombre,
                                    custom_prompt: materia.custom_prompt,
                                    modelo_seleccionado: materia.modelo_seleccionado,
                                    config_bot: materia.config_bot,
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}
