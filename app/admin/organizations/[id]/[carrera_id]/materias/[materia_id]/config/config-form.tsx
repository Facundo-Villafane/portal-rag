'use client'

import { useActionState, useState, useId } from 'react'
import { saveMateriaConfig } from '@/lib/actions/materias'
import { Check, Loader2, Lock } from 'lucide-react'
import { CHAT_THEMES } from '@/lib/chat-themes'

interface ConfigFormProps {
    canEditAdvanced: boolean
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

export function ConfigForm({ materia, canEditAdvanced }: ConfigFormProps) {
    const [state, formAction, isPending] = useActionState(saveMateriaConfig, null)
    const tempId = useId()

    const [nombreBot, setNombreBot] = useState(materia.config_bot?.nombre_bot ?? '')
    const [customPrompt, setCustomPrompt] = useState(materia.custom_prompt ?? '')
    const [welcomeMessage, setWelcomeMessage] = useState(
        materia.config_bot?.welcome_message ?? `¡Hola! Soy {nombre_bot}. ¿En qué puedo ayudarte con ${materia.nombre}?`
    )
    const [modelo, setModelo] = useState(materia.modelo_seleccionado ?? DEFAULT_MODEL)
    const [temperatura, setTemperatura] = useState(materia.config_bot?.temperatura ?? 0.3)
    const [theme, setTheme] = useState(materia.config_bot?.theme ?? 'blue')

    return (
        <form action={formAction} className="space-y-6">
            <input type="hidden" name="materia_id" value={materia.materia_id} />
            <input type="hidden" name="org_id" value={materia.org_id} />
            <input type="hidden" name="carrera_id" value={materia.carrera_id} />
            <input type="hidden" name="theme" value={theme} />

            {/* Feedback */}
            {state && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
                    state.success
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                    {state.success && <Check className="w-4 h-4 flex-shrink-0" />}
                    {state.message}
                </div>
            )}

            {/* ── SECCIÓN BÁSICA (siempre visible) ── */}
            <div className="space-y-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Configuración básica</p>

                {/* Nombre del bot */}
                <div>
                    <div className="flex items-baseline justify-between mb-1.5">
                        <label className="text-sm font-medium text-slate-700">
                            Nombre del asistente
                        </label>
                        <span className={`text-xs tabular-nums ${nombreBot.length >= 54 ? 'text-amber-600 font-medium' : 'text-slate-400'}`}>
                            {nombreBot.length}/60
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">
                        Cómo se llama el bot en el prompt. Si está vacío se usa "Asistente de {materia.nombre}".
                    </p>
                    <input
                        type="text"
                        name="nombre_bot"
                        value={nombreBot}
                        onChange={e => setNombreBot(e.target.value)}
                        maxLength={60}
                        placeholder={`Ej: Asistente de ${materia.nombre}`}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Mensaje de bienvenida */}
                <div>
                    <div className="flex items-baseline justify-between mb-1.5">
                        <label className="text-sm font-medium text-slate-700">
                            Mensaje de bienvenida
                        </label>
                        <span className={`text-xs tabular-nums ${welcomeMessage.length >= 180 ? 'text-amber-600 font-medium' : 'text-slate-400'}`}>
                            {welcomeMessage.length}/200
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">
                        Usá <code className="bg-slate-100 px-1 rounded font-mono">{'{nombre_bot}'}</code> para insertar el nombre del asistente automáticamente.
                    </p>
                    <textarea
                        name="welcome_message"
                        rows={2}
                        value={welcomeMessage}
                        onChange={e => setWelcomeMessage(e.target.value)}
                        maxLength={200}
                        placeholder={`Ej: ¡Hola! Soy {nombre_bot}. ¿En qué puedo ayudarte con ${materia.nombre}?`}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                </div>
            </div>

            {/* ── TEMA VISUAL ── */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-1">Tema visual</p>
                <p className="text-xs text-slate-500">Color principal del chatbot. Se aplica al avatar, burbujas y acentos.</p>
                <div className="grid grid-cols-3 gap-2">
                    {Object.values(CHAT_THEMES).map(t => {
                        const isSelected = theme === t.id
                        return (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setTheme(t.id)}
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-xs font-medium transition-all ${
                                    isSelected
                                        ? 'border-blue-500 bg-blue-50 text-blue-800'
                                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                }`}
                            >
                                <span className={`w-4 h-4 rounded-full bg-gradient-to-br flex-shrink-0 ${t.avatarBg}`} />
                                {t.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* ── SECCIÓN AVANZADA ── */}
            {canEditAdvanced ? (
                <div className="space-y-5 pt-2 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-1">Configuración avanzada</p>

                    {/* Sistema Prompt */}
                    <div>
                        <div className="flex items-baseline justify-between mb-1.5">
                            <label className="text-sm font-medium text-slate-700">
                                Sistema Prompt personalizado
                            </label>
                            <span className={`text-xs tabular-nums ${customPrompt.length >= 1800 ? 'text-amber-600 font-medium' : 'text-slate-400'}`}>
                                {customPrompt.length}/2000
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mb-2">
                            Instrucciones de comportamiento. Si está vacío se usa el prompt educativo predeterminado.
                        </p>
                        <textarea
                            name="custom_prompt"
                            rows={8}
                            value={customPrompt}
                            onChange={e => setCustomPrompt(e.target.value)}
                            maxLength={2000}
                            placeholder="Ej: Responde siempre en español, usa ejemplos prácticos y prioriza el material oficial."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono"
                        />
                    </div>

                    {/* Modelo */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Modelo de lenguaje
                        </label>
                        <select
                            name="modelo_seleccionado"
                            value={modelo}
                            onChange={e => setModelo(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Temperatura: <span className="font-mono text-blue-600">{temperatura}</span>
                        </label>
                        <p className="text-xs text-slate-500 mb-2">
                            Valores bajos (0.1–0.3) dan respuestas más precisas. Valores altos (0.7–1.0) más creativas.
                        </p>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400 w-12">Factual</span>
                            <input
                                type="range"
                                name="temperatura"
                                min="0"
                                max="1"
                                step="0.05"
                                value={temperatura}
                                onChange={e => setTemperatura(parseFloat(e.target.value))}
                                className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <span className="text-xs text-slate-400 w-12 text-right">Creativo</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex items-start gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500">
                    <Lock className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-400" />
                    <span>Las opciones avanzadas (prompt del sistema, modelo y temperatura) están disponibles solo para administradores. Si necesitás modificarlas, contactá al administrador de tu institución.</span>
                </div>
            )}

            <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors"
            >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {isPending ? 'Guardando...' : 'Guardar configuración'}
            </button>
        </form>
    )
}
