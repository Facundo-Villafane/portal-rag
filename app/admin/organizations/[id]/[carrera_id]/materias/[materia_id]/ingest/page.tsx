import { createClient } from '@/lib/supabase/server'
import { AdminLayout } from '@/components/admin-layout'
import { notFound } from 'next/navigation'
import { IngestPageClient } from './ingest-page-client'

interface PageProps {
    params: Promise<{ id: string; carrera_id: string; materia_id: string }>
}

export default async function IngestPage({ params }: PageProps) {
    const { id, carrera_id, materia_id } = await params
    const supabase = await createClient()

    const [{ data: materia }, { data: { user } }] = await Promise.all([
        supabase
            .from('materia')
            .select('*, carrera:carrera_id(nombre), organization:org_id(nombre, logo_url, config_global)')
            .eq('materia_id', materia_id)
            .single(),
        supabase.auth.getUser(),
    ])

    if (!materia) notFound()

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
            const org = materia.organization as { config_global?: { profesores_config_avanzada?: boolean } } | null
            canEditAdvanced = org?.config_global?.profesores_config_avanzada === true
        }
    }

    const { data: entries } = await supabase
        .from('knowledge_entry')
        .select('titulo, created_at')
        .eq('materia_id', materia_id)
        .order('created_at', { ascending: false })

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

    const org = materia.organization as { nombre?: string; logo_url?: string } | null
    const carrera = materia.carrera as { nombre?: string } | null

    return (
        <AdminLayout organizationId={id}>
            <IngestPageClient
                materia={{
                    materia_id: materia.materia_id,
                    org_id: materia.org_id,
                    carrera_id: materia.carrera_id,
                    nombre: materia.nombre,
                    custom_prompt: materia.custom_prompt,
                    modelo_seleccionado: materia.modelo_seleccionado,
                    config_bot: materia.config_bot,
                }}
                docs={docs}
                totalChunks={totalChunks}
                canEditAdvanced={canEditAdvanced}
                orgNombre={org?.nombre}
                orgLogoUrl={org?.logo_url}
                carreraNombre={carrera?.nombre}
            />
        </AdminLayout>
    )
}
