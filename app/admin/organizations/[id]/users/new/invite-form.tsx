'use client'

import { inviteUser } from '@/lib/actions/users'
import { useFormStatus } from 'react-dom'
import { Loader2, Mail, Shield } from 'lucide-react'
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
            {pending ? 'Enviando...' : 'Enviar Invitación'}
        </button>
    )
}

export function InviteForm({ orgId }: { orgId: string }) {
    const [state, formAction] = useActionState(inviteUser, initialState)

    return (
        <form action={formAction} className="space-y-6">
            <input type="hidden" name="org_id" value={orgId} />

            {state.message && (
                <div className={`p-4 rounded-lg text-sm ${state.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {state.message}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        name="email"
                        type="email"
                        required
                        placeholder="colaborador@universidad.edu"
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                </div>
                {state.error?.email && <p className="text-red-500 text-xs mt-1">{state.error.email}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rol Asignado</label>
                <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <select
                        name="rol"
                        required
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white appearance-none"
                        defaultValue="profesor"
                    >
                        <option value="profesor">Profesor (Gestionar Materias)</option>
                        <option value="admin">Administrador (Gestionar Organización)</option>
                    </select>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                    Los administradores tienen acceso total a la organización. Los profesores solo gestionan sus materias asignadas.
                </p>
                {state.error?.rol && <p className="text-red-500 text-xs mt-1">{state.error.rol}</p>}
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
                <Link href={`/admin/organizations/${orgId}/users`} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Cancelar</Link>
                <SubmitButton />
            </div>
        </form>
    )
}
