'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Loader2, Copy, Check, Download, Trash2, CornerDownLeft, Paperclip } from 'lucide-react'
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
const TYPEWRITER_CHARS_PER_TICK = 4
const TYPEWRITER_DELAY_MS = 14

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function BillrAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
    const sizeClass = {
        sm: 'h-7 w-7',
        md: 'h-9 w-9',
        lg: 'h-16 w-16',
    }[size]

    return (
        <div className={cn('relative shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-blue-100 shadow-sm shadow-blue-700/10', sizeClass)}>
            <Image
                src="/billr-avatar.png"
                alt="Billr"
                fill
                sizes={size === 'lg' ? '64px' : size === 'md' ? '36px' : '28px'}
                className="object-cover"
                priority={size === 'lg'}
            />
        </div>
    )
}

export function ChatInterface({
    materiaId,
    materiaNombre,
    botNombre,
    welcomeMessage,
    hideHeader,
    theme: themeId,
}: ChatInterfaceProps) {
    const t = getTheme(themeId)
    const displayName = botNombre || 'Billr'
    const courseTitle = materiaNombre || 'Billetaje y Reservas'
    const quickPrompts = ['Resumir Unidad 2', 'Practica de examen', 'Bibliografia sugerida']

    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isRevealing, setIsRevealing] = useState(false)
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
    }, [messages, isLoading, isRevealing])

    const handleCopy = useCallback(async (text: string, index: number) => {
        await navigator.clipboard.writeText(text)
        setCopiedIndex(index)
        setTimeout(() => setCopiedIndex(null), 2000)
    }, [])

    const handleExport = useCallback(() => {
        const lines: string[] = [
            `Conversacion con ${displayName}`,
            `Fecha: ${new Date().toLocaleString('es-AR')}`,
            '-'.repeat(60),
            '',
        ]
        messages.forEach(m => {
            lines.push(m.role === 'user' ? 'Tu:' : `${displayName}:`)
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
        if (!text.trim() || isLoading || isRevealing) return
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

            const assistantMessage = await response.text()
            const replyTime = new Date().toISOString()
            setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: replyTime }])

            setIsLoading(false)
            setIsRevealing(true)
            for (let i = TYPEWRITER_CHARS_PER_TICK; i <= assistantMessage.length + TYPEWRITER_CHARS_PER_TICK; i += TYPEWRITER_CHARS_PER_TICK) {
                const visibleText = assistantMessage.slice(0, i)
                setMessages(prev => {
                    const msgs = [...prev]
                    msgs[msgs.length - 1] = { role: 'assistant', content: visibleText, timestamp: replyTime }
                    return msgs
                })
                if (i < assistantMessage.length) await wait(TYPEWRITER_DELAY_MS)
            }
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Lo siento, ocurrio un error al procesar tu pregunta.',
                timestamp: new Date().toISOString(),
            }])
        } finally {
            setIsLoading(false)
            setIsRevealing(false)
        }
    }, [isLoading, isRevealing, materiaId])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        sendMessage(input)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value)
        e.target.style.height = 'auto'
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
    }

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
        strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-semibold text-slate-950">{children}</strong>,
        ul: ({ children }: { children?: React.ReactNode }) => <ul className="my-3 grid gap-1.5 pl-4 sm:grid-cols-2">{children}</ul>,
        ol: ({ children }: { children?: React.ReactNode }) => <ol className="my-3 list-decimal space-y-1 pl-5">{children}</ol>,
        li: ({ children }: { children?: React.ReactNode }) => <li className="text-sm leading-relaxed text-slate-800">{children}</li>,
        p: ({ children }: { children?: React.ReactNode }) => <p className="mb-2 text-sm leading-relaxed text-slate-900 last:mb-0">{children}</p>,
        code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
            const isBlock = className?.includes('language-')
            return isBlock
                ? <code className="my-2 block overflow-x-auto rounded-lg bg-slate-100 px-3 py-2 font-mono text-xs">{children}</code>
                : <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">{children}</code>
        },
        h1: ({ children }: { children?: React.ReactNode }) => <h1 className="mb-1 mt-3 text-base font-bold">{children}</h1>,
        h2: ({ children }: { children?: React.ReactNode }) => <h2 className="mb-1 mt-3 text-sm font-bold">{children}</h2>,
        h3: ({ children }: { children?: React.ReactNode }) => <h3 className="mb-1 mt-2 text-sm font-semibold">{children}</h3>,
        blockquote: ({ children }: { children?: React.ReactNode }) => (
            <blockquote className="my-3 rounded-lg border-l-4 border-blue-300 bg-blue-50/60 px-4 py-3 text-sm italic text-slate-700">{children}</blockquote>
        ),
        hr: () => <hr className="my-3 border-slate-200" />,
    }

    return (
        <div className="flex h-full flex-col bg-[#fbf9ff]">
            {!hideHeader && (
                <header className="flex-shrink-0 bg-[#fbf9ff]">
                    <div className="mx-auto max-w-5xl px-5 sm:px-7">
                        <div className="flex items-center justify-between py-5">
                            <div className="flex items-center gap-3">
                                <BillrAvatar size="md" />
                                <h1 className="text-xl font-extrabold leading-tight tracking-tight text-slate-950">{courseTitle}</h1>
                            </div>
                            {messages.length > 0 && (
                                <div className="flex items-center gap-1">
                                    <button onClick={handleExport} title="Exportar" className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-white hover:text-blue-700">
                                        <Download className="h-4 w-4" />
                                    </button>
                                    <button onClick={handleClearChat} title="Borrar conversacion" className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-white hover:text-red-500">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="mx-auto max-w-5xl space-y-7 px-5 py-6 sm:px-7">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center pb-4 pt-8 text-center">
                            <div className="mb-4">
                                <BillrAvatar size="lg" />
                            </div>
                            <p className="mb-1 text-sm font-semibold text-slate-800">{displayName}</p>
                            <p className="max-w-xs text-sm leading-relaxed text-slate-500">
                                {welcomeMessage || `Hola, soy ${displayName}. Puedo ayudarte con el material de ${courseTitle}. Que queres consultar?`}
                            </p>
                            <div className="mt-5 flex flex-wrap justify-center gap-2">
                                {['Cuales son los temas principales?', 'Cuando es el primer parcial?', 'Como se evalua este curso?'].map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => sendMessage(s)}
                                        className="rounded-full border border-[#d8ddf0] bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-blue-200 hover:bg-white"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <div key={i} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                            {msg.role === 'user' ? (
                                <div className="flex max-w-[78%] flex-col items-end gap-1">
                                    {msg.timestamp && (
                                        <span className="px-1 text-[10px] font-medium text-slate-400">Vos - {formatTime(msg.timestamp)}</span>
                                    )}
                                    <div className="rounded-2xl rounded-br-md bg-blue-600 px-5 py-3 text-white shadow-lg shadow-blue-600/20">
                                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="group flex min-w-0 max-w-[760px] flex-1 gap-2">
                                    <BillrAvatar size="sm" />
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-1.5 text-[11px] font-extrabold text-blue-700">{displayName}</div>
                                        <div className="rounded-2xl border border-[#dfe3f4] bg-white/90 px-5 py-4 text-slate-900 shadow-sm shadow-slate-200/60">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                rehypePlugins={[rehypeSanitize]}
                                                components={markdownComponents}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                        {msg.content && (
                                            <div className="mt-1.5 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                                {msg.timestamp && <span className="text-[10px] text-slate-400">{formatTime(msg.timestamp)}</span>}
                                                <button
                                                    onClick={() => handleCopy(msg.content, i)}
                                                    className={cn(
                                                        'flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] transition-colors',
                                                        copiedIndex === i
                                                            ? 'bg-emerald-50 text-emerald-600'
                                                            : 'text-slate-400 hover:bg-white hover:text-slate-600',
                                                    )}
                                                >
                                                    {copiedIndex === i
                                                        ? <><Check className="h-3 w-3" /> Copiado</>
                                                        : <><Copy className="h-3 w-3" /> Copiar</>
                                                    }
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {isLoading && !isRevealing && (
                        <div className="flex gap-3">
                            <BillrAvatar size="sm" />
                            <div className="flex items-center gap-1 rounded-2xl border border-[#dfe3f4] bg-white px-4 py-3 shadow-sm">
                                {[0, 150, 300].map((delay, i) => (
                                    <div
                                        key={i}
                                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300"
                                        style={{ animationDelay: `${delay}ms` }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="flex-shrink-0 bg-[#fbf9ff] px-5 pb-6 pt-2 sm:px-7">
                <div className="mx-auto max-w-5xl">
                    {messages.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-2">
                            {quickPrompts.map((prompt) => (
                                <button
                                    key={prompt}
                                    onClick={() => sendMessage(prompt)}
                                    disabled={isLoading || isRevealing}
                                    className="rounded-full border border-[#cfd6eb] bg-white/70 px-4 py-1 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="relative flex items-end gap-3 rounded-full border border-[#e3e6f3] bg-white px-5 py-3 shadow-xl shadow-slate-200/80 transition-colors focus-within:border-blue-200">
                        <Paperclip className="mb-1 h-4 w-4 shrink-0 text-slate-400" />
                        <textarea
                            ref={inputRef}
                            rows={1}
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Escribi tu pregunta..."
                            disabled={isLoading || isRevealing}
                            className="max-h-[120px] flex-1 resize-none bg-transparent text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 focus:outline-none disabled:opacity-50"
                            style={{ height: '24px' }}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || isRevealing || !input.trim()}
                            className={cn(
                                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all',
                                input.trim() && !isLoading && !isRevealing
                                    ? 'bg-blue-700 text-white shadow-md shadow-blue-700/20 hover:bg-blue-600'
                                    : 'cursor-not-allowed bg-slate-200 text-slate-400',
                            )}
                        >
                            {isLoading
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <Send className="h-4 w-4" />
                            }
                        </button>
                    </form>
                    <div className="mt-2 flex items-center justify-center gap-3 text-[10px] text-slate-300">
                        <span>Basado en el material del curso. Verifica informacion importante.</span>
                        <span className="flex items-center gap-1">
                            <CornerDownLeft className="h-2.5 w-2.5" /> Enter para enviar
                        </span>
                    </div>
                    {activeModel && (
                        <p className="mt-0.5 text-center font-mono text-[10px] text-slate-300">{activeModel}</p>
                    )}
                </div>
            </div>
        </div>
    )
}
