'use client'

import { useState, useTransition } from 'react'
import { addOrgKey, toggleOrgKey, deleteOrgKey } from '@/lib/actions/llm-keys'
import { KeyRound, Plus, Trash2, Loader2, Eye, EyeOff, Check, X, AlertCircle } from 'lucide-react'

export interface OrgKey {
    key_id:     string
    provider:   'groq' | 'openai' | 'anthropic'
    label:      string
    key_last4:  string
    is_active:  boolean
    created_at: string
}

interface Props {
    orgId:       string
    initialKeys: OrgKey[]
}

const PROVIDER_LABELS: Record<string, string> = {
    groq:      'Groq',
    openai:    'OpenAI',
    anthropic: 'Anthropic',
}

const PROVIDER_COLORS: Record<string, string> = {
    groq:      'bg-emerald-100 text-emerald-700',
    openai:    'bg-blue-100 text-blue-700',
    anthropic: 'bg-orange-100 text-orange-700',
}

export function LlmKeysPanel({ orgId, initialKeys }: Props) {
    const [keys, setKeys]                 = useState<OrgKey[]>(initialKeys)
    const [showForm, setShowForm]         = useState(false)
    const [showKeyText, setShowKeyText]   = useState(false)
    const [error, setError]               = useState<string | null>(null)
    const [successMsg, setSuccessMsg]     = useState<string | null>(null)
    const [isPending, startTransition]    = useTransition()
    const [deletingId, setDeletingId]     = useState<string | null>(null)

    // Form state
    const [provider, setProvider] = useState<'groq' | 'openai' | 'anthropic'>('groq')
    const [label, setLabel]       = useState('')
    const [apiKey, setApiKey]     = useState('')

    function resetForm() {
        setProvider('groq')
        setLabel('')
        setApiKey('')
        setShowKeyText(false)
        setShowForm(false)
        setError(null)
    }

    function handleAdd() {
        setError(null)
        setSuccessMsg(null)
        startTransition(async () => {
            const result = await addOrgKey(orgId, provider, label, apiKey)
            if (!result.success) {
                setError(result.message)
            } else {
                // Optimistic append
                setKeys(prev => [...prev, {
                    key_id:     crypto.randomUUID(),
                    provider,
                    label:      label.trim(),
                    key_last4:  apiKey.slice(-4),
                    is_active:  true,
                    created_at: new Date().toISOString(),
                }])
                setSuccessMsg('Clave agregada correctamente.')
                resetForm()
            }
        })
    }

    function handleToggle(keyId: string, current: boolean) {
        startTransition(async () => {
            const result = await toggleOrgKey(keyId, orgId, !current)
            if (result.success) {
                setKeys(prev => prev.map(k =>
                    k.key_id === keyId ? { ...k, is_active: !current } : k
                ))
            }
        })
    }

    function handleDelete(keyId: string) {
        setDeletingId(keyId)
    }

    function confirmDelete(keyId: string) {
        startTransition(async () => {
            const result = await deleteOrgKey(keyId, orgId)
            if (result.success) {
                setKeys(prev => prev.filter(k => k.key_id !== keyId))
            } else {
                setError(result.message)
            }
            setDeletingId(null)
        })
    }

    return (
        <div className="space-y-4">
            {/* Key list */}
            {keys.length === 0 ? (
                <p className="text-sm text-slate-500 py-1">
                    Sin claves configuradas. Se usará la clave global del servidor como fallback.
                </p>
            ) : (
                <div className="divide-y divide-slate-100">
                    {keys.map(key => {
                        const isConfirmingDelete = deletingId === key.key_id
                        return (
                            <div key={key.key_id} className={`flex items-center justify-between py-3 gap-4 ${isConfirmingDelete ? 'bg-red-50 -mx-1 px-1 rounded-lg' : ''}`}>
                                <div className="flex items-center gap-3 min-w-0">
                                    <KeyRound className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-slate-800 truncate">{key.label}</p>
                                        <p className="text-xs text-slate-400 font-mono">...{key.key_last4}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${PROVIDER_COLORS[key.provider] ?? 'bg-slate-100 text-slate-600'}`}>
                                        {PROVIDER_LABELS[key.provider] ?? key.provider}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {isConfirmingDelete ? (
                                        <>
                                            <span className="text-xs text-red-600 font-medium">¿Eliminar?</span>
                                            <button
                                                onClick={() => confirmDelete(key.key_id)}
                                                disabled={isPending}
                                                className="px-2 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                                            >
                                                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                                Sí, eliminar
                                            </button>
                                            <button
                                                onClick={() => setDeletingId(null)}
                                                className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                                            >
                                                Cancelar
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            {/* Active toggle */}
                                            <label className="relative cursor-pointer" title={key.is_active ? 'Desactivar' : 'Activar'}>
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={key.is_active}
                                                    disabled={isPending}
                                                    onChange={() => handleToggle(key.key_id, key.is_active)}
                                                />
                                                <div className="w-9 h-5 bg-slate-200 peer-checked:bg-blue-600 rounded-full transition-colors peer-disabled:opacity-60" />
                                                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                                            </label>
                                            <button
                                                onClick={() => handleDelete(key.key_id)}
                                                disabled={isPending}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                title="Eliminar clave"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Feedback */}
            {error && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {error}
                    <button onClick={() => setError(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
                </div>
            )}
            {successMsg && (
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700">
                    <Check className="w-3.5 h-3.5 flex-shrink-0" />
                    {successMsg}
                    <button onClick={() => setSuccessMsg(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
                </div>
            )}

            {/* Add form */}
            {showForm ? (
                <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
                    <p className="text-sm font-semibold text-slate-700">Nueva clave de API</p>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-slate-600 mb-1 block">Proveedor</label>
                            <select
                                value={provider}
                                onChange={e => setProvider(e.target.value as typeof provider)}
                                className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="groq">Groq</option>
                                <option value="openai">OpenAI</option>
                                <option value="anthropic">Anthropic</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 mb-1 block">Nombre / etiqueta</label>
                            <input
                                type="text"
                                placeholder="ej: Key principal Groq"
                                value={label}
                                onChange={e => setLabel(e.target.value)}
                                className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-slate-600 mb-1 block">API Key</label>
                        <div className="relative">
                            <input
                                type={showKeyText ? 'text' : 'password'}
                                placeholder="gsk_..."
                                value={apiKey}
                                onChange={e => setApiKey(e.target.value)}
                                className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                onClick={() => setShowKeyText(v => !v)}
                            >
                                {showKeyText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                            Se cifra con AES-256-GCM antes de guardarse. Nunca se almacena en texto plano.
                        </p>
                    </div>

                    <div className="flex gap-2 pt-1">
                        <button
                            onClick={handleAdd}
                            disabled={isPending || !label.trim() || !apiKey.trim()}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                        >
                            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            Guardar clave
                        </button>
                        <button
                            onClick={resetForm}
                            disabled={isPending}
                            className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => { setError(null); setSuccessMsg(null); setShowForm(true) }}
                    className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 hover:border-slate-400 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Agregar clave
                </button>
            )}
        </div>
    )
}
