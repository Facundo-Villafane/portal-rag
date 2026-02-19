'use client'

import { createOrganization } from '@/lib/actions/organizations'
import { useFormStatus } from 'react-dom'
import { Loader2, Upload, X } from 'lucide-react'
import Link from 'next/link'
import { useActionState, useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const initialState = { message: '', error: undefined as any, success: false, orgId: undefined as string | undefined }

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <button type="submit" disabled={pending} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-sm transition-colors shadow-sm">
            {pending && <Loader2 className="w-4 h-4 animate-spin" />}
            {pending ? 'Creando...' : 'Crear Universidad'}
        </button>
    )
}

export function NewOrganizationForm() {
    const router = useRouter()
    const [state, formAction] = useActionState(createOrganization, initialState)
    const [logoUrl, setLogoUrl] = useState('')

    useEffect(() => {
        if (state.success && state.orgId) {
            router.push(`/admin/organizations/${state.orgId}/dashboard`)
        }
    }, [state])
    const [preview, setPreview] = useState('')
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setUploadError('')
        setUploading(true)

        // Local preview
        const objectUrl = URL.createObjectURL(file)
        setPreview(objectUrl)

        try {
            const fd = new FormData()
            fd.append('file', file)
            const res = await fetch('/api/upload-logo', { method: 'POST', body: fd })
            const json = await res.json()
            if (!res.ok) {
                setUploadError(json.error || 'Error al subir el logo')
                setPreview('')
                setLogoUrl('')
            } else {
                setLogoUrl(json.url)
            }
        } catch {
            setUploadError('Error de red al subir el logo')
            setPreview('')
            setLogoUrl('')
        } finally {
            setUploading(false)
        }
    }

    function clearLogo() {
        setPreview('')
        setLogoUrl('')
        setUploadError('')
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    return (
        <form action={formAction} className="space-y-6">
            {state.message && (
                <div className={`p-4 rounded-lg text-sm ${state.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {state.message}
                </div>
            )}

            {/* Hidden field carries the uploaded URL to the server action */}
            <input type="hidden" name="logo_url" value={logoUrl} />

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre de la Universidad</label>
                <input name="nombre" type="text" required placeholder="Ej: Universidad Tecnologica Nacional" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm" />
                {state.error?.nombre && <p className="text-red-500 text-xs mt-1">{state.error.nombre}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Logo de la Universidad</label>
                <div className="flex items-center gap-4">
                    {preview ? (
                        <div className="relative w-16 h-16 rounded-xl border border-slate-200 overflow-hidden bg-white flex-shrink-0 flex items-center justify-center shadow-sm">
                            <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                            <button
                                type="button"
                                onClick={clearLogo}
                                className="absolute top-0.5 right-0.5 w-5 h-5 bg-slate-800/70 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                            >
                                <X className="w-3 h-3 text-white" />
                            </button>
                        </div>
                    ) : (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors flex-shrink-0"
                        >
                            {uploading
                                ? <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                                : <Upload className="w-5 h-5 text-slate-400" />
                            }
                        </div>
                    )}
                    <div className="flex-1">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                        >
                            {uploading ? 'Subiendo...' : preview ? 'Cambiar imagen' : 'Seleccionar imagen'}
                        </button>
                        <p className="text-xs text-slate-500 mt-0.5">PNG, JPG, SVG o WebP. Máx 2MB.</p>
                        {uploadError && <p className="text-red-500 text-xs mt-1">{uploadError}</p>}
                    </div>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Proveedor LLM por defecto</label>
                <select name="llm_provider" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white text-sm">
                    <option value="groq">Groq (Rapido / Economico)</option>
                    <option value="openai">OpenAI (GPT-4 / 3.5)</option>
                </select>
                <p className="text-xs text-slate-500 mt-1.5">Motor de inteligencia por defecto para todas las materias de esta universidad.</p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
                <Link href="/admin/organizations" className="px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">Cancelar</Link>
                <SubmitButton />
            </div>
        </form>
    )
}
