'use client'

import { createMateria } from '@/lib/actions/materias'
import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useActionState } from 'react'

const initialState = {
    message: '',
    error: undefined,
    success: false
}

function SubmitButton() {
    const { pending } = useFormStatus()

    return (
        <button
            type="submit"
            disabled={pending}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
            {pending && <Loader2 className="w-4 h-4 animate-spin" />}
            {pending ? 'Guardando...' : 'Crear Materia'}
        </button>
    )
}

export function MateriaForm({ orgId, carreraId }: { orgId: string, carreraId: string }) {
    const [state, formAction] = useActionState(createMateria, initialState)

    return (
        <form action={formAction} className="space-y-6">
            <input type="hidden" name="org_id" value={orgId} />
            <input type="hidden" name="carrera_id" value={carreraId} />

            {state.message && (
                <div className={`p-4 rounded-lg text-sm ${state.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {state.message}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Materia</label>
                <input
                    name="nombre"
                    type="text"
                    required
                    placeholder="Ej: Análisis Matemático I"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                {state.error?.nombre && <p className="text-red-500 text-xs mt-1">{state.error.nombre}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prompt Personalizado (Opcional)</label>
                <textarea
                    name="custom_prompt"
                    rows={4}
                    placeholder="Instrucciones específicas para el bot de esta materia (ej: 'Responde siempre con ejemplos formales')."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">Este prompt se añade a las instrucciones del sistema cuando el alumno consulta sobre esta materia.</p>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
                <Link href={`/admin/organizations/${orgId}/${carreraId}/materias`} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Cancelar</Link>
                <SubmitButton />
            </div>
        </form>
    )
}
