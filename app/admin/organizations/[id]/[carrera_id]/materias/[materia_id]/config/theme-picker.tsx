'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { saveMateriaConfig } from '@/lib/actions/materias'
import { CHAT_THEMES } from '@/lib/chat-themes'
import { Check, Loader2, AlertCircle } from 'lucide-react'

interface ThemePickerProps {
    materia: {
        materia_id: string
        org_id: string
        carrera_id: string
        nombre: string
        custom_prompt: string | null
        modelo_seleccionado: string | null
        config_bot: { temperatura?: number; welcome_message?: string; nombre_bot?: string; theme?: string } | null
    }
    onThemeChange?: (theme: string) => void   // fires immediately on click → live preview
}

export function ThemePicker({ materia, onThemeChange }: ThemePickerProps) {
    const [state, formAction, isPending] = useActionState(saveMateriaConfig, null)
    const initTheme = materia.config_bot?.theme ?? 'blue'
    const [theme, setTheme] = useState(initTheme)

    const isDirty = theme !== initTheme

    function handleClick(id: string) {
        setTheme(id)
        onThemeChange?.(id)   // live preview update — no save yet
    }

    return (
        <form action={formAction} className="space-y-3">
            {/* Hidden fields required by saveMateriaConfig */}
            <input type="hidden" name="materia_id"          value={materia.materia_id} />
            <input type="hidden" name="org_id"              value={materia.org_id} />
            <input type="hidden" name="carrera_id"          value={materia.carrera_id} />
            <input type="hidden" name="theme"               value={theme} />
            {/* Pass through current values so save doesn't reset other fields */}
            <input type="hidden" name="nombre_bot"          value={materia.config_bot?.nombre_bot ?? ''} />
            <input type="hidden" name="welcome_message"     value={materia.config_bot?.welcome_message ?? ''} />
            <input type="hidden" name="custom_prompt"       value={materia.custom_prompt ?? ''} />
            <input type="hidden" name="modelo_seleccionado" value={materia.modelo_seleccionado ?? ''} />
            <input type="hidden" name="temperatura"         value={String(materia.config_bot?.temperatura ?? 0.3)} />

            {/* Color swatches — circles only, no labels */}
            <div className="flex items-center gap-2 flex-wrap">
                {Object.values(CHAT_THEMES).map(t => {
                    const isSelected = theme === t.id
                    return (
                        <button
                            key={t.id}
                            type="button"
                            title={t.label}
                            onClick={() => handleClick(t.id)}
                            className={`w-8 h-8 rounded-full bg-gradient-to-br ${t.avatarBg} flex items-center justify-center transition-all ${
                                isSelected
                                    ? 'ring-2 ring-offset-2 ring-slate-400 scale-110'
                                    : 'opacity-60 hover:opacity-90 hover:scale-105'
                            }`}
                        >
                            {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                        </button>
                    )
                })}
            </div>

            {/* Feedback + save */}
            {state && (
                <p className={`text-xs flex items-center gap-1 ${state.success ? 'text-emerald-600' : 'text-red-600'}`}>
                    {state.success ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {state.message}
                </p>
            )}

            {isDirty && !state?.success && (
                <p className="text-xs text-amber-600 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    Color sin guardar
                </p>
            )}

            <button
                type="submit"
                disabled={isPending || !isDirty}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isPending
                        ? 'bg-blue-400 text-white cursor-not-allowed'
                        : isDirty
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm ring-2 ring-blue-300 ring-offset-1'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
            >
                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                {isPending ? 'Guardando...' : isDirty ? 'Guardar color' : 'Sin cambios'}
            </button>
        </form>
    )
}
