import { createServiceClient } from '@/lib/supabase/server'
import { EmbedLayout } from './embed-layout'

interface PageProps {
    params: Promise<{ materia_id: string }>
}

function resolveWelcomeMessage(template: string | undefined, nombreBot: string, nombreMateria: string): string {
    const base = template || `¡Hola! Soy {nombre_bot}. ¿En qué puedo ayudarte con ${nombreMateria}?`
    return base.replace(/{nombre_bot}/g, nombreBot)
}

export default async function EmbedPage({ params }: PageProps) {
    const { materia_id } = await params
    const supabase = createServiceClient()

    const { data: materia } = await supabase
        .from('materia')
        .select('materia_id, nombre, config_bot, modelo_seleccionado, organization:org_id(nombre, logo_url), carrera:carrera_id(nombre)')
        .eq('materia_id', materia_id)
        .single()

    const welcomeMessage = materia
        ? resolveWelcomeMessage(
            materia.config_bot?.welcome_message,
            materia.config_bot?.nombre_bot || `Asistente de ${materia.nombre}`,
            materia.nombre,
        )
        : undefined

    const org = materia?.organization as { nombre?: string; logo_url?: string } | null
    const carrera = materia?.carrera as { nombre?: string } | null

    return (
        <div className="h-screen w-full overflow-hidden">
            <EmbedLayout
                materiaId={materia_id}
                materiaNombre={materia?.nombre}
                botNombre={materia?.config_bot?.nombre_bot}
                welcomeMessage={welcomeMessage}
                orgNombre={org?.nombre}
                orgLogoUrl={org?.logo_url}
                carreraNombre={carrera?.nombre}
                theme={materia?.config_bot?.theme}
            />
        </div>
    )
}
