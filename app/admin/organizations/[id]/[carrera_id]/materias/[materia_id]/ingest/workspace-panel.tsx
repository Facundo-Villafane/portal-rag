'use client'

import { useState, useCallback } from 'react'
import { Upload, BookOpen, Settings2, Code2, Palette } from 'lucide-react'
import { IngestForm } from './ingest-form'
import { KnowledgeList } from './knowledge-list'
import { ConfigForm } from '../config/config-form'
import { ThemePicker } from '../config/theme-picker'
import { EmbedSnippet } from '../config/embed-snippet'

type Tab = 'upload' | 'knowledge' | 'config' | 'embed'

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

interface WorkspacePanelProps {
    materia: MateriaForConfig
    docs: Doc[]
    totalChunks: number
    canEditAdvanced: boolean
    onThemeChange: (theme: string) => void   // lifted up to page → ChatInterface
}

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'upload',    label: 'Agregar contenido',    icon: Upload },
    { id: 'knowledge', label: 'Base de conocimiento', icon: BookOpen },
    { id: 'config',    label: 'Configuración',         icon: Settings2 },
    { id: 'embed',     label: 'Embed / iframe',        icon: Code2 },
]

export function WorkspacePanel({ materia, docs, totalChunks, canEditAdvanced, onThemeChange }: WorkspacePanelProps) {
    const [activeTab, setActiveTab] = useState<Tab>('upload')

    return (
        <div className="flex flex-col h-full">
            {/* Tab bar */}
            <div className="flex-shrink-0 border-b border-slate-200 bg-white">
                <nav className="flex" aria-label="Workspace tabs">
                    {TABS.map(tab => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                    isActive
                                        ? 'border-blue-600 text-blue-700 bg-blue-50/40'
                                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                }`}
                            >
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        )
                    })}
                </nav>
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-y-auto bg-slate-50">

                {activeTab === 'upload' && (
                    <div className="p-5">
                        <SectionHeader icon={Upload} title="Agregar contenido" subtitle="Subí archivos o escribí el contenido directamente" color="blue" />
                        <div className="mt-4">
                            <IngestForm materiaId={materia.materia_id} />
                        </div>
                    </div>
                )}

                {activeTab === 'knowledge' && (
                    <div className="p-5">
                        <SectionHeader icon={BookOpen} title="Base de conocimiento" subtitle={`${docs.length} documento${docs.length !== 1 ? 's' : ''} · ${totalChunks} chunk${totalChunks !== 1 ? 's' : ''} indexados`} color="indigo" />
                        <div className="mt-4">
                            <KnowledgeList docs={docs} materiaId={materia.materia_id} />
                        </div>
                    </div>
                )}

                {activeTab === 'config' && (
                    <div className="p-5 space-y-4">

                        {/* ── Tema visual — apartado propio ── */}
                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <SectionHeader icon={Palette} title="Color del chatbot" subtitle="Se aplica al avatar y burbujas. El preview actualiza en tiempo real." color="violet" />
                            <div className="mt-3">
                                <ThemePicker materia={materia} onThemeChange={onThemeChange} />
                            </div>
                        </div>

                        {/* ── Resto de configuración ── */}
                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <SectionHeader icon={Settings2} title="Configuración del bot" subtitle="Nombre, mensaje de bienvenida y opciones avanzadas" color="slate" />
                            <div className="mt-4">
                                <ConfigForm
                                    canEditAdvanced={canEditAdvanced}
                                    materia={materia}
                                    onThemeChange={onThemeChange}
                                />
                            </div>
                        </div>

                    </div>
                )}

                {activeTab === 'embed' && (
                    <div className="p-5">
                        <SectionHeader icon={Code2} title="Embed / iframe" subtitle="Integrá el chatbot en Moodle u otra plataforma" color="emerald" />
                        <div className="mt-4">
                            <EmbedSnippet materiaId={materia.materia_id} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// ── Small helper ──────────────────────────────────────────────────────────────

const colorMap = {
    blue:    'bg-blue-50 text-blue-600',
    indigo:  'bg-indigo-50 text-indigo-600',
    violet:  'bg-violet-50 text-violet-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    slate:   'bg-slate-100 text-slate-600',
} as const

function SectionHeader({
    icon: Icon,
    title,
    subtitle,
    color,
}: {
    icon: React.ElementType
    title: string
    subtitle: string
    color: keyof typeof colorMap
}) {
    return (
        <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
                <Icon className="w-4 h-4" />
            </div>
            <div>
                <h2 className="font-semibold text-slate-900 text-sm">{title}</h2>
                <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
        </div>
    )
}
