'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Bot, User, Loader2, Sparkles, Copy, Check, Download, Trash2, CornerDownLeft } from 'lucide-react'
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
    timestamp?: string
}

const SESSION_KEY = (materiaId: string) => `chat_messages_${materiaId}`

export function ChatInterface({
    materiaId,
    materiaNombre,
    botNombre,
    welcomeMessage,
    hideHeader,
    orgNombre,
    orgLogoUrl,
    carreraNombre,
    theme: themeId,
}: ChatInterfaceProps) {
    const t = getTheme(themeId)
    const displayName = botNombre || `Asistente de ${materiaNombre || 'la materia'}`

    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
    const [activeModel, setActiveModel] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        try {
            const saved = sessionStorage.getItem(SESSION_KEY(materiaId))
            if (saved) setMessages(JSON.parse(saved))
        } catch { /* ignore */ }
    }, [materiaId])

    useEffect(() => {
        if (messages.length === 0) return
        try { sessionStorage.setItem(SESSION_KEY(materiaId), JSON.stringify(messages)) } catch { /* ignore */ }
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
    }, [messages, displayName])

    const handleClearChat = useCallback(() => {
        setMessages([])
        try { sessionStorage.removeItem(SESSION_KEY(materiaId)) } catch { /* ignore */ }
    }, [materiaId])

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || isLoading) return
        const now = new Date().toISOString()
        setMessages(prev => [...prev, { role: 'user', content: text, timestamp: now }])
        setInput('')
        setIsLoading(true)

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    materia_id: materiaId,
                    pregunta: text,
                    session_id: localStorage.getItem('session_id') || undefined,
                }),
            })
            if (!response.ok) throw new Error('Error en la respuesta')
            if (!localStorage.getItem('session_id')) localStorage.setItem('session_id', crypto.randomUUID())

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
                    assistantMessage += decoder.decode(value)
                    setMessages(prev => {
                        const msgs = [...prev]
                        msgs[msgs.length - 1] = { role: 'assistant', content: assistantMessage, timestamp: replyTime }
                        return msgs
                    })
                }
            }
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Lo siento, ocurrió un error al procesar tu pregunta.',
                timestamp: new Date().toISOString(),
            }])
        } finally {
            setIsLoading(false)
        }
    }, [isLoading, materiaId])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        sendMessage(input)
    }

    // Auto-grow textarea
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value)
        e.target.style.height = 'auto'
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
    }

    // Submit on Enter (Shift+Enter = new line)
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage(input)
        }
    }

    const formatTime = (iso?: string) => {
        if (!iso) return ''
        return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    }

    const markdownComponents = {
        a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className={`underline font-medium ${t.linkColor}`}>{children}</a>
        ),
        strong: ({ children }: { children?: React.ReactNode }) => (
            <strong className="font-semibold text-slate-900">{children}</strong>
        ),
        ul: ({ children }: { children?: React.ReactNode }) => (
            <ul className="list-disc list-outside pl-4 space-y-0.5 my-2">{children}</ul>
        ),
        ol: ({ children }: { children?: React.ReactNode }) => (
            <ol className="list-decimal list-outside pl-4 space-y-0.5 my-2">{children}</ol>
        ),
        li: ({ children }: { children?: React.ReactNode }) => (
            <li className="text-sm leading-relaxed">{children}</li>
        ),
        p: ({ children }: { children?: React.ReactNode }) => (
            <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>
        ),
        code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
            const isBlock = className?.includes('language-')
            return isBlock
                ? <code className="block bg-slate-100 rounded-lg px-3 py-2 text-xs font-mono my-2 overflow-x-auto">{children}</code>
                : <code className="bg-slate-100 rounded px-1.5 py-0.5 text-xs font-mono">{children}</code>
        },
        h1: ({ children }: { children?: React.ReactNode }) => <h1 className="text-base font-bold mt-3 mb-1">{children}</h1>,
        h2: ({ children }: { children?: React.ReactNode }) => <h2 className="text-sm font-bold mt-3 mb-1">{children}</h2>,
        h3: ({ children }: { children?: React.ReactNode }) => <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>,
        blockquote: ({ children }: { children?: React.ReactNode }) => (
            <blockquote className={`border-l-3 border-l-4 pl-3 italic text-slate-600 my-2 ${t.linkColor.split(' ')[0].replace('text-', 'border-')}`}>{children}</blockquote>
        ),
        hr: () => <hr className="border-slate-200 my-3" />,
    }

    return (
        <div className="flex flex-col h-full bg-white">

            {/* ── Header ── */}
            {!hideHeader && (
                <div className={`flex-shrink-0 border-b border-slate-200 bg-white`}>
                    <div className="max-w-3xl mx-auto px-4 sm:px-6">
                        {/* Breadcrumb */}
                        {(orgNombre || carreraNombre || materiaNombre) && (
                            <div className="flex items-center gap-2 py-2 border-b border-slate-100">
                                {orgLogoUrl ? (
                                    <Image src={orgLogoUrl} alt={orgNombre || 'Logo'} width={18} height={18} className="rounded object-contain flex-shrink-0 opacity-70" />
                                ) : (
                                    <Sparkles className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                )}
                                <nav className="flex items-center gap-1 text-xs text-slate-400 min-w-0">
                                    {orgNombre && <span className="truncate">{orgNombre}</span>}
                                    {carreraNombre && <><span className="text-slate-200">/</span><span className="truncate">{carreraNombre}</span></>}
                                    {materiaNombre && <><span className="text-slate-200">/</span><span className="truncate font-medium text-slate-600">{materiaNombre}</span></>}
                                </nav>
                            </div>
                        )}
                        {/* Bot name + actions */}
                        <div className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${t.avatarBg} flex items-center justify-center shadow-sm flex-shrink-0`}>
                                    <Bot className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
                                </div>
                                <div>
                                    <h1 className="text-sm font-semibold text-slate-900 leading-tight">{displayName}</h1>
                                    <p className="text-xs text-slate-400">Asistente académico · Basado en el material del curso</p>
                                </div>
                            </div>
                            {messages.length > 0 && (
                                <div className="flex items-center gap-1">
                                    <button onClick={handleExport} title="Exportar" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                                        <Download className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={handleClearChat} title="Borrar conversación" className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Messages ── */}
            <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">

                    {/* Empty state */}
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center pt-6 pb-4 text-center">
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${t.avatarBg} flex items-center justify-center shadow-md mb-4`}>
                                <Bot className="w-7 h-7 text-white" />
                            </div>
                            <p className="text-sm font-medium text-slate-700 mb-1">{displayName}</p>
                            <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                                {welcomeMessage || `Hola, puedo ayudarte con el material de ${materiaNombre || 'la materia'}. ¿Qué querés consultar?`}
                            </p>

                            {/* Suggestion chips */}
                            <div className="mt-5 flex flex-wrap justify-center gap-2">
                                {[
                                    '¿Cuáles son los temas principales?',
                                    '¿Podés explicar un concepto clave?',
                                    '¿Cómo se evalúa este curso?',
                                ].map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(s)}
                                        className={cn(
                                            'px-3 py-1.5 rounded-full text-xs border transition-colors',
                                            'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                                        )}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Message list */}
                    {messages.map((msg, i) => (
                        <div key={i} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                            {msg.role === 'assistant' && (
                                <div className={`flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br ${t.avatarBg} flex items-center justify-center self-start mt-0.5 shadow-sm`}>
                                    <Bot className="w-3.5 h-3.5 text-white" />
                                </div>
                            )}

                            {msg.role === 'user' ? (
                                <div className="max-w-[78%] flex flex-col items-end gap-1">
                                    <div className={`rounded-2xl rounded-br-sm px-4 py-2.5 bg-gradient-to-br ${t.userBubbleBg} ${t.userBubbleText} shadow-sm`}>
                                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                    </div>
                                    {msg.timestamp && (
                                        <span className="text-[10px] text-slate-400 px-1">{formatTime(msg.timestamp)}</span>
                                    )}
                                </div>
                            ) : (
                                <div className="flex-1 min-w-0 group">
                                    <div className="text-slate-800 prose-sm">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            rehypePlugins={[rehypeSanitize]}
                                            components={markdownComponents}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                    {msg.content && (
                                        <div className="mt-1.5 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {msg.timestamp && <span className="text-[10px] text-slate-400">{formatTime(msg.timestamp)}</span>}
                                            <button
                                                onClick={() => handleCopy(msg.content, i)}
                                                className={cn(
                                                    'flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] transition-colors',
                                                    copiedIndex === i
                                                        ? 'text-emerald-600 bg-emerald-50'
                                                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100',
                                                )}
                                            >
                                                {copiedIndex === i
                                                    ? <><Check className="w-3 h-3" /> Copiado</>
                                                    : <><Copy className="w-3 h-3" /> Copiar</>
                                                }
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {msg.role === 'user' && (
                                <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center self-start mt-0.5">
                                    <User className="w-3.5 h-3.5 text-slate-500" />
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Typing indicator */}
                    {isLoading && (
                        <div className="flex gap-3">
                            <div className={`flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br ${t.avatarBg} flex items-center justify-center self-start mt-0.5 shadow-sm`}>
                                <Bot className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div className="flex items-center gap-1 py-2">
                                {[0, 150, 300].map((delay, i) => (
                                    <div
                                        key={i}
                                        className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"
                                        style={{ animationDelay: `${delay}ms` }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* ── Input ── */}
            <div className="flex-shrink-0 border-t border-slate-100 bg-white px-4 py-3 sm:px-6">
                <div className="max-w-3xl mx-auto">
                    <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 focus-within:border-slate-300 focus-within:bg-white transition-colors shadow-sm">
                        <textarea
                            ref={inputRef}
                            rows={1}
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Escribí tu pregunta..."
                            disabled={isLoading}
                            className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none resize-none leading-relaxed max-h-[120px] disabled:opacity-50"
                            style={{ height: '24px' }}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className={cn(
                                'flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all',
                                input.trim() && !isLoading
                                    ? `bg-gradient-to-br ${t.userBubbleBg} text-white shadow-sm hover:shadow-md`
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed',
                            )}
                        >
                            {isLoading
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Send className="w-3.5 h-3.5" />
                            }
                        </button>
                    </form>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 px-1">
                        <span>Basado en el material del curso. Verificá información importante.</span>
                        <span className="flex items-center gap-1 text-slate-300">
                            <CornerDownLeft className="w-2.5 h-2.5" /> Enter para enviar
                        </span>
                    </div>
                    {activeModel && (
                        <p className="mt-0.5 text-center text-[10px] text-slate-300 font-mono">{activeModel}</p>
                    )}
                </div>
            </div>
        </div>
    )
}
