'use client'

import { useActionState, useState } from 'react'
import { saveMateriaConfig } from '@/lib/actions/materias'
import { Check, Loader2, Lock, AlertCircle } from 'lucide-react'

interface ConfigFormProps {
    canEditAdvanced: boolean
    onThemeChange?: (theme: string) => void   // notify parent of live theme changes
    materia: {
        materia_id: string
        org_id: string
        carrera_id: string
        nombre: string
        custom_prompt: string | null
        modelo_seleccionado: string | null
        config_bot: { temperatura?: number; welcome_message?: string; nombre_bot?: string; theme?: string } | null
    }
}

const MODELOS = [
    { group: 'Groq (Recomendado)', models: [
        { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile — preciso, 280 t/s' },
        { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant — muy rápido, 560 t/s' },
        { value: 'meta-llama/llama-4-maverick-17b-128e-instruct', label: 'Llama 4 Maverick 17B — 600 t/s (preview)' },
        { value: 'meta-llama/llama-4-scout-17b-16e-instruct', label: 'Llama 4 Scout 17B — 750 t/s (preview)' },
        { value: 'qwen/qwen3-32b', label: 'Qwen3 32B — 400 t/s (preview)' },
    ]},
    { group: 'OpenAI', models: [
        { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
        { value: 'gpt-4o', label: 'GPT-4o' },
    ]},
]

const DEFAULT_MODEL = 'llama-3.3-70b-versatile'

export function ConfigForm({ materia, canEditAdvanced, onThemeChange }: ConfigFormProps) {
    const [state, formAction, isPending] = useActionState(saveMateriaConfig, null)

    // ── Initial values (for dirty detection) ──────────────────────────────────
    const initNombreBot     = materia.config_bot?.nombre_bot ?? ''
    const initWelcome       = materia.config_bot?.welcome_message ?? `¡Hola! Soy {nombre_bot}. ¿En qué puedo ayudarte con ${materia.nombre}?`
    const initPrompt        = materia.custom_prompt ?? ''
    const initModelo        = materia.modelo_seleccionado ?? DEFAULT_MODEL
    const initTemperatura   = materia.config_bot?.temperatura ?? 0.3
    const initTheme         = materia.config_bot?.theme ?? 'blue'

    const [nombreBot,     setNombreBot]     = useState(initNombreBot)
    const [welcomeMessage,setWelcomeMessage]= useState(initWelcome)
    const [customPrompt,  setCustomPrompt]  = useState(initPrompt)
    const [modelo,        setModelo]        = useState(initModelo)
    const [temperatura,   setTemperatura]   = useState(initTemperatura)
    const [theme,         setTheme]         = useState(initTheme)  // kept in sync for hidden input

    // Dirty: any field changed from initial values
    const isDirty =
        nombreBot     !== initNombreBot   ||
        welcomeMessage!== initWelcome     ||
        customPrompt  !== initPrompt      ||
        modelo        !== initModelo      ||
        temperatura   !== initTemperatura ||
        theme         !== initTheme

    // Called by ThemePicker (in parent WorkspacePanel) via onThemeChange
    // Also driven internally when config-form is used standalone (/config page)
    function handleThemeChange(id: string) {
        setTheme(id)
        onThemeChange?.(id)
    }

    return (
        <form action={formAction} className="space-y-5">
            <input type="hidden" name="materia_id"          value={materia.materia_id} />
            <input type="hidden" name="org_id"              value={materia.org_id} />
            <input type="hidden" name="carrera_id"          value={materia.carrera_id} />
            <input type="hidden" name="theme"               value={theme} />

            {/* Feedback banner */}
            {state && (
                <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm ${
                    state.success
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                    {state.success ? <Check className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                    {state.message}
                </div>
            )}

            {/* ── Básica ── */}
            <div className="space-y-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Configuración básica</p>

                {/* Nombre del bot */}
                <div>
                    <div className="flex items-baseline justify-between mb-1">
                        <label className="text-sm font-medium text-slate-700">Nombre del asistente</label>
                        <span className={`text-xs tabular-nums ${nombreBot.length >= 54 ? 'text-amber-500' : 'text-slate-400'}`}>
                            {nombreBot.length}/60
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-1.5">Si está vacío se usa "Asistente de {materia.nombre}".</p>
                    <input
                        type="text"
                        name="nombre_bot"
                        value={nombreBot}
                        onChange={e => setNombreBot(e.target.value)}
                        maxLength={60}
                        placeholder={`Ej: Asistente de ${materia.nombre}`}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Mensaje de bienvenida */}
                <div>
                    <div className="flex items-baseline justify-between mb-1">
                        <label className="text-sm font-medium text-slate-700">Mensaje de bienvenida</label>
                        <span className={`text-xs tabular-nums ${welcomeMessage.length >= 180 ? 'text-amber-500' : 'text-slate-400'}`}>
                            {welcomeMessage.length}/200
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-1.5">
                        Usá <code className="bg-slate-100 px-1 rounded font-mono text-[11px]">{'{nombre_bot}'}</code> para el nombre del asistente.
                    </p>
                    <textarea
                        name="welcome_message"
                        rows={2}
                        value={welcomeMessage}
                        onChange={e => setWelcomeMessage(e.target.value)}
                        maxLength={200}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                </div>
            </div>

            {/* ── Avanzada ── */}
            {canEditAdvanced ? (
                <div className="space-y-4 pt-3 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Configuración avanzada</p>

                    {/* Sistema Prompt */}
                    <div>
                        <div className="flex items-baseline justify-between mb-1">
                            <label className="text-sm font-medium text-slate-700">Sistema Prompt</label>
                            <span className={`text-xs tabular-nums ${customPrompt.length >= 1800 ? 'text-amber-500' : 'text-slate-400'}`}>
                                {customPrompt.length}/2000
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mb-1.5">Instrucciones de comportamiento. Vacío = prompt educativo predeterminado.</p>
                        <textarea
                            name="custom_prompt"
                            rows={7}
                            value={customPrompt}
                            onChange={e => setCustomPrompt(e.target.value)}
                            maxLength={2000}
                            placeholder="Ej: Responde siempre en español, usa ejemplos prácticos y prioriza el material oficial."
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono"
                        />
                    </div>

                    {/* Modelo */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Modelo de lenguaje</label>
                        <select
                            name="modelo_seleccionado"
                            value={modelo}
                            onChange={e => setModelo(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {MODELOS.map(g => (
                                <optgroup key={g.group} label={g.group}>
                                    {g.models.map(m => (
                                        <option key={m.value} value={m.value}>{m.label}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>

                    {/* Temperatura */}
                    <div>
                        <div className="flex items-baseline justify-between mb-1">
                            <label className="text-sm font-medium text-slate-700">Temperatura</label>
                            <span className="text-sm font-mono text-blue-600">{temperatura}</span>
                        </div>
                        <p className="text-xs text-slate-400 mb-2">Bajo (0.1–0.3) = preciso · Alto (0.7–1.0) = creativo</p>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400 w-10">Factual</span>
                            <input
                                type="range"
                                name="temperatura"
                                min="0" max="1" step="0.05"
                                value={temperatura}
                                onChange={e => setTemperatura(parseFloat(e.target.value))}
                                className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <span className="text-xs text-slate-400 w-10 text-right">Creativo</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex items-start gap-3 px-3 py-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 pt-3 border-t border-slate-100 mt-3">
                    <Lock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-400" />
                    <span>Las opciones avanzadas (prompt, modelo y temperatura) están disponibles solo para administradores.</span>
                </div>
            )}

            {/* ── Save button — pulsing when dirty ── */}
            <div className="pt-1">
                {isDirty && !state?.success && (
                    <p className="text-xs text-amber-600 flex items-center gap-1.5 mb-2">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        Hay cambios sin guardar
                    </p>
                )}
                <button
                    type="submit"
                    disabled={isPending}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all ${
                        isPending
                            ? 'bg-blue-400 text-white cursor-not-allowed opacity-70'
                            : isDirty
                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200 ring-2 ring-blue-300 ring-offset-1'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {isPending ? 'Guardando...' : isDirty ? 'Guardar cambios' : 'Sin cambios'}
                </button>
            </div>
        </form>
    )
}
