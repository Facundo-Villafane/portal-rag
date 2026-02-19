'use client'

import { useState, useEffect } from 'react'
import { Code2, Copy, Check, ExternalLink, X, Monitor } from 'lucide-react'

export function EmbedSnippet({ materiaId }: { materiaId: string }) {
    const [copied, setCopied] = useState(false)
    const [showPreview, setShowPreview] = useState(false)
    const [origin, setOrigin] = useState('')

    useEffect(() => {
        setOrigin(window.location.origin)
    }, [])

    // Close modal on Escape
    useEffect(() => {
        if (!showPreview) return
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowPreview(false) }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [showPreview])

    const embedUrl = `${origin}/embed/${materiaId}`
    const snippet = `<iframe\n  src="${embedUrl}"\n  width="100%"\n  height="600"\n  frameborder="0"\n  allow="clipboard-write"\n  style="border-radius: 12px; border: 1px solid #e2e8f0;"\n></iframe>`

    function copy() {
        navigator.clipboard.writeText(snippet)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <>
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                        <Code2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-slate-900">Integración vía iframe</h2>
                        <p className="text-xs text-slate-500">Pegá este código en Moodle u otra plataforma para embeber el chatbot</p>
                    </div>
                </div>

                {/* Primary action — preview button */}
                <button
                    onClick={() => setShowPreview(true)}
                    className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-medium text-sm transition-all shadow-md hover:shadow-lg"
                >
                    <Monitor className="w-5 h-5" />
                    Vista previa del chatbot embebido
                </button>

                {/* Code snippet */}
                <div>
                    <p className="text-xs font-medium text-slate-500 mb-2">Código para copiar en Moodle</p>
                    <div className="relative">
                        <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 text-xs font-mono overflow-x-auto whitespace-pre leading-relaxed">
                            {snippet}
                        </pre>
                        <button
                            onClick={copy}
                            className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md text-xs font-medium transition-colors"
                        >
                            {copied
                                ? <><Check className="w-3.5 h-3.5 text-emerald-400" />Copiado</>
                                : <><Copy className="w-3.5 h-3.5" />Copiar</>
                            }
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Ajustá el <code className="bg-slate-100 px-1 rounded">height</code> según el espacio en tu plataforma</span>
                    <a
                        href={embedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                    >
                        <ExternalLink className="w-3 h-3" />
                        Abrir en pestaña
                    </a>
                </div>
            </div>

            {/* Preview modal */}
            {showPreview && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={(e) => { if (e.target === e.currentTarget) setShowPreview(false) }}
                >
                    <div className="relative w-full max-w-2xl h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                        {/* Modal header */}
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 flex-shrink-0">
                            <div className="flex items-center gap-2.5">
                                <Monitor className="w-4 h-4 text-emerald-600" />
                                <span className="font-medium text-slate-800 text-sm">Vista previa — como lo ve el alumno</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={embedUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    Nueva pestaña
                                </a>
                                <button
                                    onClick={copy}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                                >
                                    {copied
                                        ? <><Check className="w-3.5 h-3.5" />Copiado</>
                                        : <><Copy className="w-3.5 h-3.5" />Copiar código</>
                                    }
                                </button>
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* iframe */}
                        <div className="flex-1 min-h-0 bg-slate-100 p-3">
                            <iframe
                                src={embedUrl}
                                className="w-full h-full rounded-xl border border-slate-200 bg-white"
                                title="Vista previa del chatbot"
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
