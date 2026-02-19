'use client'

import { createCarrera } from '@/lib/actions/carreras'
import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const initialState = { message: '', error: undefined as any, success: false, carreraId: undefined as string | undefined }

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <button type="submit" disabled={pending} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-sm transition-colors shadow-sm">
            {pending && <Loader2 className="w-4 h-4 animate-spin" />}
            {pending ? 'Guardando...' : 'Crear Carrera'}
        </button>
    )
}

export function NewCarreraForm({ orgId }: { orgId: string }) {
    const router = useRouter()
    const [state, formAction] = useActionState(createCarrera, initialState)

    useEffect(() => {
        if (state.success && state.carreraId) {
            router.push(`/admin/organizations/${orgId}/${state.carreraId}/materias`)
        }
    }, [state])

    return (
        <form action={formAction} className="space-y-6">
            <input type="hidden" name="org_id" value={orgId} />
            {state.message && !state.success && (
                <div className="p-4 rounded-lg text-sm bg-red-50 text-red-700">
                    {state.message}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre de la Carrera</label>
                <input
                    name="nombre"
                    type="text"
                    required
                    placeholder="Ej: Ingeniería en Sistemas"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
                {state.error?.nombre && <p className="text-red-500 text-xs mt-1">{state.error.nombre}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Código / Identificador</label>
                <input
                    name="codigo"
                    type="text"
                    required
                    placeholder="Ej: ISI, ING-SIS, CS"
                    maxLength={20}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-mono uppercase"
                    onChange={(e) => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9\-]/g, '') }}
                />
                <p className="text-xs text-slate-500 mt-1.5">Identificador corto usado internamente. Solo mayúsculas, números y guiones.</p>
                {state.error?.codigo && <p className="text-red-500 text-xs mt-1">{state.error.codigo}</p>}
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
                <Link href={`/admin/organizations/${orgId}/carreras`} className="px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">Cancelar</Link>
                <SubmitButton />
            </div>
        </form>
    )
}
