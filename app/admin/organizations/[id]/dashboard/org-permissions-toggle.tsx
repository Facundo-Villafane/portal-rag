'use client'

import { useTransition } from 'react'
import { updateOrgConfig } from '@/lib/actions/organizations'
import { Loader2 } from 'lucide-react'

interface Props {
    orgId: string
    profesoresConfigAvanzada: boolean
}

export function OrgPermissionsToggle({ orgId, profesoresConfigAvanzada }: Props) {
    const [isPending, startTransition] = useTransition()

    function handleToggle(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.checked
        startTransition(async () => {
            await updateOrgConfig(orgId, { profesores_config_avanzada: value })
        })
    }

    return (
        <label className="flex items-start gap-4 cursor-pointer group">
            <div className="relative mt-0.5 flex-shrink-0">
                <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={profesoresConfigAvanzada}
                    onChange={handleToggle}
                    disabled={isPending}
                />
                <div className="w-11 h-6 bg-slate-200 peer-checked:bg-blue-600 rounded-full transition-colors peer-disabled:opacity-60" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800">
                        Permitir config. avanzada a profesores
                    </span>
                    {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                    Cuando está activo, los profesores pueden modificar el prompt del sistema, el modelo de lenguaje y la temperatura del chatbot.
                    Por defecto solo pueden editar el nombre del asistente y el mensaje de bienvenida.
                </p>
            </div>
        </label>
    )
}
