'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Bot, User, Loader2, Sparkles, Copy, Check, Download, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import { getTheme } from '@/lib/chat-themes'

interface ChatInterfaceProps {
    materiaId: string
    materiaNombre?: string
    botNombre?: string
    welcomeMessage?: string
    hideHeader?: boolean
    // Branding
    orgNombre?: string
    orgLogoUrl?: string
    carreraNombre?: string
    theme?: string
}

interface Message {
    role: 'user' | 'assistant'
    content: string
    timestamp?: string   // ISO string, set when message is finalized
}

const SESSION_KEY = (materiaId: string) => `chat_messages_${materiaId}`

export function ChatInterface({ materiaId, materiaNombre, botNombre, welcomeMessage, hideHeader, orgNombre, orgLogoUrl, carreraNombre, theme: themeId }: ChatInterfaceProps) {
    const t = getTheme(themeId)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
    const [activeModel, setActiveModel] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Restore messages from sessionStorage on mount
    useEffect(() => {
        try {
            const saved = sessionStorage.getItem(SESSION_KEY(materiaId))
            if (saved) setMessages(JSON.parse(saved))
        } catch { /* ignore */ }
    }, [materiaId])

    // Persist messages to sessionStorage on every change
    useEffect(() => {
        if (messages.length === 0) return
        try {
            sessionStorage.setItem(SESSION_KEY(materiaId), JSON.stringify(messages))
        } catch { /* ignore */ }
    }, [messages, materiaId])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleCopy = useCallback(async (text: string, index: number) => {
        await navigator.clipboard.writeText(text)
        setCopiedIndex(index)
        setTimeout(() => setCopiedIndex(null), 2000)
    }, [])

    const handleExport = useCallback(() => {
        const displayName = botNombre || materiaNombre || 'Asistente Educativo'
        const lines: string[] = [
            `Conversación con ${displayName}`,
            `Fecha: ${new Date().toLocaleString('es-AR')}`,
            '─'.repeat(60),
            '',
        ]
        messages.forEach(m => {
            lines.push(m.role === 'user' ? 'Tú:' : `${displayName}:`)
            lines.push(m.content)
            lines.push('')
        })
        const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `chat-${displayName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.txt`
        a.click()
        URL.revokeObjectURL(url)
    }, [messages, botNombre, materiaNombre])

    const handleClearChat = useCallback(() => {
        setMessages([])
        try { sessionStorage.removeItem(SESSION_KEY(materiaId)) } catch { /* ignore */ }
    }, [materiaId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return

        const now = new Date().toISOString()
        const userMessage: Message = { role: 'user', content: input, timestamp: now }
        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsLoading(true)

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    materia_id: materiaId,
                    pregunta: input,
                    session_id: localStorage.getItem('session_id') || undefined
                })
            })

            if (!response.ok) {
                throw new Error('Error en la respuesta')
            }

            if (!localStorage.getItem('session_id')) {
                localStorage.setItem('session_id', crypto.randomUUID())
            }

            // Capture model from response header
            const modelUsed = response.headers.get('X-Model-Used')
            if (modelUsed) setActiveModel(modelUsed)

            const reader = response.body?.getReader()
            const decoder = new TextDecoder()
            let assistantMessage = ''
            const replyTime = new Date().toISOString()

            setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: replyTime }])

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    const chunk = decoder.decode(value)
                    assistantMessage += chunk

                    setMessages(prev => {
                        const newMessages = [...prev]
                        newMessages[newMessages.length - 1] = {
                            role: 'assistant',
                            content: assistantMessage,
                            timestamp: replyTime,
                        }
                        return newMessages
                    })
                }
            }
        } catch (error) {
            console.error('Error:', error)
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Lo siento, ocurrió un error al procesar tu pregunta.',
                timestamp: new Date().toISOString(),
            }])
        } finally {
            setIsLoading(false)
        }
    }

    const formatTime = (iso?: string) => {
        if (!iso) return ''
        return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    }

    const markdownComponents = {
        a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`underline font-medium ${t.linkColor}`}
            >
                {children}
            </a>
        ),
        strong: ({ children }: { children?: React.ReactNode }) => (
            <strong className="font-semibold text-slate-900">{children}</strong>
        ),
        ul: ({ children }: { children?: React.ReactNode }) => (
            <ul className="list-disc list-outside pl-4 space-y-1 my-2">{children}</ul>
        ),
        ol: ({ children }: { children?: React.ReactNode }) => (
            <ol className="list-decimal list-outside pl-4 space-y-1 my-2">{children}</ol>
        ),
        li: ({ children }: { children?: React.ReactNode }) => (
            <li className="text-sm leading-relaxed">{children}</li>
        ),
        p: ({ children }: { children?: React.ReactNode }) => (
            <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>
        ),
        code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
            const isBlock = className?.includes('language-')
            return isBlock ? (
                <code className="block bg-slate-100 rounded-lg px-3 py-2 text-xs font-mono my-2 overflow-x-auto">{children}</code>
            ) : (
                <code className="bg-slate-100 rounded px-1.5 py-0.5 text-xs font-mono">{children}</code>
            )
        },
        h1: ({ children }: { children?: React.ReactNode }) => <h1 className="text-base font-bold mt-3 mb-1">{children}</h1>,
        h2: ({ children }: { children?: React.ReactNode }) => <h2 className="text-sm font-bold mt-3 mb-1">{children}</h2>,
        h3: ({ children }: { children?: React.ReactNode }) => <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>,
        blockquote: ({ children }: { children?: React.ReactNode }) => (
            <blockquote className="border-l-4 border-blue-300 pl-3 italic text-slate-600 my-2">{children}</blockquote>
        ),
        hr: () => <hr className="border-slate-200 my-3" />,
    }

    return (
        <div className={`flex flex-col h-full bg-gradient-to-b ${t.pageBg}`}>
            {/* Header */}
            {!hideHeader && (
                <div className="bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                        {/* Branding bar — org logo + breadcrumb */}
                        {(orgNombre || orgLogoUrl || carreraNombre || materiaNombre) && (
                            <div className="flex items-center gap-2 py-2.5 border-b border-slate-100">
                                {orgLogoUrl ? (
                                    <Image
                                        src={orgLogoUrl}
                                        alt={orgNombre || 'Logo'}
                                        width={24}
                                        height={24}
                                        className="rounded object-contain flex-shrink-0"
                                    />
                                ) : (
                                    <div className="w-6 h-6 rounded bg-slate-200 flex items-center justify-center flex-shrink-0">
                                        <Sparkles className="w-3 h-3 text-slate-500" />
                                    </div>
                                )}
                                <nav className="flex items-center gap-1.5 text-xs text-slate-500 min-w-0">
                                    {orgNombre && <span className="font-medium truncate">{orgNombre}</span>}
                                    {carreraNombre && (
                                        <>
                                            <span className="text-slate-300 flex-shrink-0">/</span>
                                            <span className="truncate">{carreraNombre}</span>
                                        </>
                                    )}
                                    {materiaNombre && (
                                        <>
                                            <span className="text-slate-300 flex-shrink-0">/</span>
                                            <span className="truncate font-medium text-slate-700">{materiaNombre}</span>
                                        </>
                                    )}
                                </nav>
                            </div>
                        )}

                        {/* Main header row — bot name + actions */}
                        <div className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-3">
                                <div className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${t.avatarBg} shadow-md flex-shrink-0`}>
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-base font-bold text-slate-900 leading-tight">
                                        {botNombre || materiaNombre || 'Asistente Educativo'}
                                    </h1>
                                    <p className="text-xs text-slate-400 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" />
                                        Impulsado por IA
                                    </p>
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-1">
                                {messages.length > 0 && (
                                    <>
                                        <button
                                            onClick={handleExport}
                                            title="Exportar conversación"
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">Exportar</span>
                                        </button>
                                        <button
                                            onClick={handleClearChat}
                                            title="Borrar conversación"
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">Borrar</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                    {messages.length === 0 && (
                        <div className="text-center py-12">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 mb-6">
                                <Bot className="w-10 h-10 text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-8">
                                {welcomeMessage || 'Puedo ayudarte a responder preguntas sobre el material del curso. ¿En qué puedo asistirte hoy?'}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                                {[
                                    '¿Cuáles son los temas principales del curso?',
                                    '¿Podrías explicar el concepto de...?',
                                    '¿Qué materiales de estudio están disponibles?',
                                    '¿Cómo se evalúa este curso?',
                                ].map((suggestion, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setInput(suggestion)}
                                        className="text-left p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-sm text-slate-700 hover:text-blue-900"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((message, i) => (
                        <div
                            key={i}
                            className={cn(
                                'flex gap-3 mb-6',
                                message.role === 'user' ? 'justify-end' : 'justify-start'
                            )}
                        >
                            {message.role === 'user' ? (
                                /* User: bubble */
                                <>
                                    <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm bg-gradient-to-br ${t.userBubbleBg} ${t.userBubbleText}`}>
                                        <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                                    </div>
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center self-end">
                                        <User className="w-4 h-4 text-slate-600" />
                                    </div>
                                </>
                            ) : (
                                /* Assistant: no bubble, with copy button on hover */
                                <div className="flex gap-3 w-full group">
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br ${t.avatarBg} flex items-center justify-center shadow-sm self-start mt-0.5`}>
                                        <Bot className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        {(botNombre || materiaNombre) && (
                                            <p className="text-xs font-semibold text-slate-500 mb-1">{botNombre || materiaNombre}</p>
                                        )}
                                        <div className="text-slate-800">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                rehypePlugins={[rehypeSanitize]}
                                                components={markdownComponents}
                                            >
                                                {message.content}
                                            </ReactMarkdown>
                                        </div>
                                        {/* Hora + copiar — visibles en hover */}
                                        {message.content && (
                                            <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {message.timestamp && (
                                                    <span className="text-xs text-slate-400">{formatTime(message.timestamp)}</span>
                                                )}
                                                <button
                                                    onClick={() => handleCopy(message.content, i)}
                                                    title="Copiar respuesta"
                                                    className={cn(
                                                        'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors',
                                                        copiedIndex === i
                                                            ? 'text-emerald-600 bg-emerald-50'
                                                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                                                    )}
                                                >
                                                    {copiedIndex === i ? (
                                                        <><Check className="w-3.5 h-3.5" /> Copiado</>
                                                    ) : (
                                                        <><Copy className="w-3.5 h-3.5" /> Copiar</>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-3 mb-6">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br ${t.avatarBg} flex items-center justify-center shadow-sm`}>
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex items-center gap-1 pt-2">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input */}
            <div className="border-t border-slate-200 bg-white shadow-lg">
                <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
                    <form onSubmit={handleSubmit} className="flex gap-3">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Escribe tu pregunta aquí..."
                            disabled={isLoading}
                            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${t.userBubbleBg} text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg`}
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </button>
                    </form>
                    <div className="mt-3 flex items-center justify-center gap-3 text-xs text-slate-400">
                        <span>Las respuestas se basan en el material del curso. Verifica información importante.</span>
                        {activeModel && (
                            <>
                                <span>·</span>
                                <span className="font-mono">{activeModel}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
