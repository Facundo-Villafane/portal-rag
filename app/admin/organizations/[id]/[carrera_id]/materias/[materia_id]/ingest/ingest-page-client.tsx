'use client'

import { useState, useMemo } from 'react'
import { Eye } from 'lucide-react'
import { ChatInterface } from '@/components/chat-interface'
import { WorkspacePanel } from './workspace-panel'

interface Doc {
    titulo: string
    created_at: string
    chunks: number
}

interface MateriaForConfig {
    materia_id: string
    org_id: string
    carrera_id: string
    nombre: string
    custom_prompt: string | null
    modelo_seleccionado: string | null
    config_bot: { temperatura?: number; welcome_message?: string; nombre_bot?: string; theme?: string } | null
}

interface Props {
    materia: MateriaForConfig
    docs: Doc[]
    totalChunks: number
    canEditAdvanced: boolean
    orgNombre?: string
    orgLogoUrl?: string
    carreraNombre?: string
}

function resolveWelcomeMessage(template: string | undefined, nombreBot: string, nombreMateria: string): string {
    const base = template || `¡Hola! Soy {nombre_bot}. ¿En qué puedo ayudarte con ${nombreMateria}?`
    return base.replace(/{nombre_bot}/g, nombreBot)
}

export function IngestPageClient({
    materia,
    docs,
    totalChunks,
    canEditAdvanced,
    orgNombre,
    orgLogoUrl,
    carreraNombre,
}: Props) {
    // Live theme state — updated immediately on color click, before saving
    const [liveTheme, setLiveTheme] = useState(materia.config_bot?.theme ?? 'blue')

    const welcomeMessage = useMemo(() => resolveWelcomeMessage(
        materia.config_bot?.welcome_message,
        materia.config_bot?.nombre_bot || `Asistente de ${materia.nombre}`,
        materia.nombre,
    ), [materia])

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold text-slate-900">Knowledge Manager</h1>
                    <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {materia.nombre}
                    </span>
                </div>
                <p className="text-slate-500 mt-0.5 text-sm">
                    {carreraNombre} · {docs.length} documento{docs.length !== 1 ? 's' : ''} · {totalChunks} chunk{totalChunks !== 1 ? 's' : ''} indexados
                </p>
            </div>

            {/* 2-col workspace */}
            <div className="flex-1 overflow-hidden flex">

                {/* Left: tabbed workspace */}
                <div className="w-1/2 border-r border-slate-200 flex flex-col overflow-hidden h-full">
                    <WorkspacePanel
                        materia={materia}
                        docs={docs}
                        totalChunks={totalChunks}
                        canEditAdvanced={canEditAdvanced}
                        onThemeChange={setLiveTheme}
                    />
                </div>

                {/* Right: always-visible live preview */}
                <div className="w-1/2 bg-white flex flex-col overflow-hidden h-full">
                    <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex items-center gap-3 flex-shrink-0">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                            <Eye className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 text-sm">Vista Previa en Vivo</h3>
                            <p className="text-xs text-slate-500">Los cambios de color se ven aquí antes de guardar</p>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <ChatInterface
                            materiaId={materia.materia_id}
                            materiaNombre={materia.nombre}
                            botNombre={materia.config_bot?.nombre_bot}
                            orgNombre={orgNombre}
                            orgLogoUrl={orgLogoUrl}
                            carreraNombre={carreraNombre}
                            theme={liveTheme}
                            hideHeader
                            welcomeMessage={welcomeMessage}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
