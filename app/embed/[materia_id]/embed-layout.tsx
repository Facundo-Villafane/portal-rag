'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Bot, User, Loader2, Copy, Check, Trash2, Download } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import { getTheme } from '@/lib/chat-themes'

interface Message {
    role: 'user' | 'assistant'
    content: string
    timestamp?: string
}

const SESSION_KEY = (id: string) => `embed_chat_${id}`

interface EmbedLayoutProps {
    materiaId: string
    materiaNombre?: string
    botNombre?: string
    welcomeMessage?: string
    orgNombre?: string
    orgLogoUrl?: string
    carreraNombre?: string
    theme?: string
}

export function EmbedLayout({
    materiaId,
    materiaNombre,
    botNombre,
    welcomeMessage,
    orgNombre,
    orgLogoUrl,
    carreraNombre,
    theme: themeId,
}: EmbedLayoutProps) {
    const t = getTheme(themeId)
    const displayName = botNombre || `Asistente de ${materiaNombre || 'la materia'}`

    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
    const [activeModel, setActiveModel] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

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
    }, [messages, isLoading])

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
                    session_id: localStorage.getItem(`embed_session_${materiaId}`) || undefined,
                }),
            })
            if (!response.ok) throw new Error('Error')
            if (!localStorage.getItem(`embed_session_${materiaId}`)) {
                localStorage.setItem(`embed_session_${materiaId}`, crypto.randomUUID())
            }
            const modelUsed = response.headers.get('X-Model-Used')
            if (modelUsed) setActiveModel(modelUsed)

            const reader = response.body?.getReader()
            const decoder = new TextDecoder()
            let assistantMsg = ''
            const replyTime = new Date().toISOString()
            setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: replyTime }])

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break
                    assistantMsg += decoder.decode(value)
                    setMessages(prev => {
                        const msgs = [...prev]
                        msgs[msgs.length - 1] = { role: 'assistant', content: assistantMsg, timestamp: replyTime }
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

    const handleCopy = useCallback(async (text: string, index: number) => {
        await navigator.clipboard.writeText(text)
        setCopiedIndex(index)
        setTimeout(() => setCopiedIndex(null), 2000)
    }, [])

    const handleClearChat = useCallback(() => {
        setMessages([])
        try { sessionStorage.removeItem(SESSION_KEY(materiaId)) } catch { /* ignore */ }
    }, [materiaId])

    const handleExport = useCallback(() => {
        const lines = [
            `Conversación con ${displayName}`,
            `Exportado el ${new Date().toLocaleString('es-AR')}`,
            '─'.repeat(40),
            '',
            ...messages.map(m => {
                const who = m.role === 'user' ? 'Vos' : displayName
                const time = m.timestamp ? ` [${formatTime(m.timestamp)}]` : ''
                return `${who}${time}:\n${m.content}\n`
            }),
        ]
        const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `chat-${displayName.replace(/\s+/g, '-').toLowerCase()}.txt`
        a.click()
        URL.revokeObjectURL(url)
    }, [messages, displayName])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage(input)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value)
        e.target.style.height = 'auto'
        e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'
    }

    const formatTime = (iso?: string) => {
        if (!iso) return ''
        return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    }

    const markdownComponents = {
        a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className={`underline font-medium ${t.linkColor}`}>{children}</a>
        ),
        strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-semibold text-slate-900">{children}</strong>,
        ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc list-outside pl-4 space-y-0.5 my-2">{children}</ul>,
        ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal list-outside pl-4 space-y-0.5 my-2">{children}</ol>,
        li: ({ children }: { children?: React.ReactNode }) => <li className="text-sm leading-relaxed">{children}</li>,
        p: ({ children }: { children?: React.ReactNode }) => <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>,
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
            <blockquote className="border-l-4 border-slate-300 pl-3 italic text-slate-600 my-2">{children}</blockquote>
        ),
        hr: () => <hr className="border-slate-200 my-3" />,
    }

    return (
        <div className="flex flex-col h-full bg-white">

            {/* Header */}
            <div className="flex-shrink-0 border-b border-slate-100 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {orgLogoUrl ? (
                        <Image src={orgLogoUrl} alt={orgNombre || 'Logo'} width={36} height={36} className="rounded-lg object-contain flex-shrink-0" />
                    ) : (
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.avatarBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                    )}
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 leading-tight truncate">{displayName}</p>
                        {(orgNombre || materiaNombre) && (
                            <p className="text-xs text-slate-400 leading-tight truncate mt-0.5">
                                {[orgNombre, carreraNombre, materiaNombre].filter(Boolean).join(' · ')}
                            </p>
                        )}
                    </div>
                </div>
                {messages.length > 0 && (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleExport}
                            title="Exportar conversación"
                            className="p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
                        >
                            <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={handleClearChat}
                            title="Borrar conversación"
                            className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="px-4 py-4 space-y-4">

                    {/* Empty state */}
                    {messages.length === 0 && !isLoading && (
                        <div className="flex flex-col items-center pt-6 pb-2 text-center">
                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${t.avatarBg} flex items-center justify-center shadow-sm mb-3`}>
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                            <p className="text-sm text-slate-600 font-medium mb-1">{displayName}</p>
                            <p className="text-xs text-slate-400 max-w-[220px] leading-relaxed">
                                {welcomeMessage || `Hola, podés consultarme sobre el contenido de ${materiaNombre || 'la materia'}.`}
                            </p>
                        </div>
                    )}

                    {/* Message list */}
                    {messages.map((msg, i) => (
                        <div key={i} className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>

                            {msg.role === 'assistant' && (
                                <div className={`flex-shrink-0 w-6 h-6 rounded-md bg-gradient-to-br ${t.avatarBg} flex items-center justify-center self-start mt-0.5 shadow-sm`}>
                                    <Bot className="w-3 h-3 text-white" />
                                </div>
                            )}

                            {msg.role === 'user' ? (
                                <div className="max-w-[78%] flex flex-col items-end gap-0.5">
                                    <div className={`rounded-2xl rounded-br-sm px-3.5 py-2.5 bg-gradient-to-br ${t.userBubbleBg} ${t.userBubbleText} shadow-sm`}>
                                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                    </div>
                                    {msg.timestamp && (
                                        <span className="text-[10px] text-slate-400 px-1">{formatTime(msg.timestamp)}</span>
                                    )}
                                </div>
                            ) : (
                                <div className="flex-1 min-w-0 group">
                                    <div className="text-slate-800">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            rehypePlugins={[rehypeSanitize]}
                                            components={markdownComponents}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                    {msg.content && (
                                        <div className="mt-1 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {msg.timestamp && <span className="text-[10px] text-slate-400">{formatTime(msg.timestamp)}</span>}
                                            <button
                                                onClick={() => handleCopy(msg.content, i)}
                                                className={cn(
                                                    'flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors',
                                                    copiedIndex === i ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100',
                                                )}
                                            >
                                                {copiedIndex === i
                                                    ? <><Check className="w-2.5 h-2.5" />Copiado</>
                                                    : <><Copy className="w-2.5 h-2.5" />Copiar</>
                                                }
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {msg.role === 'user' && (
                                <div className="flex-shrink-0 w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center self-start mt-0.5">
                                    <User className="w-3 h-3 text-slate-500" />
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Typing indicator */}
                    {isLoading && (
                        <div className="flex gap-2">
                            <div className={`flex-shrink-0 w-6 h-6 rounded-md bg-gradient-to-br ${t.avatarBg} flex items-center justify-center self-start shadow-sm`}>
                                <Bot className="w-3 h-3 text-white" />
                            </div>
                            <div className="flex items-center gap-1 py-2">
                                {[0, 150, 300].map((delay, i) => (
                                    <div key={i} className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                                ))}
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input */}
            <div className="flex-shrink-0 border-t border-slate-100 bg-white px-3 py-2.5">
                <form
                    onSubmit={e => { e.preventDefault(); sendMessage(input) }}
                    className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-slate-300 focus-within:bg-white transition-colors shadow-sm"
                >
                    <textarea
                        rows={1}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Escribí tu pregunta..."
                        disabled={isLoading}
                        className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none resize-none leading-relaxed max-h-[100px] disabled:opacity-50"
                        style={{ height: '22px' }}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className={cn(
                            'flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all',
                            input.trim() && !isLoading
                                ? `bg-gradient-to-br ${t.userBubbleBg} text-white shadow-sm hover:shadow-md`
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed',
                        )}
                    >
                        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    </button>
                </form>
                <p className="mt-1.5 text-center text-[10px] text-slate-400">
                    Basado en el material del curso · IA puede cometer errores
                    {activeModel && <> · <span className="font-mono">{activeModel}</span></>}
                </p>
            </div>
        </div>
    )
}
