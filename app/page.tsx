import { ChatInterface } from '@/components/chat-interface'
import { COURSE_CONFIG } from '@/lib/course-config'
import { BookOpen, Bot, Clock3, MessageSquare, Plus, Settings } from 'lucide-react'

const navItems = [
    { label: 'Chat actual', icon: MessageSquare, active: true },
    { label: 'Historial', icon: Clock3 },
    { label: 'Materiales', icon: BookOpen },
    { label: 'Ajustes', icon: Settings },
]

export default async function Home() {
    return (
        <main className="h-screen bg-[#f8f7ff] text-slate-950">
            <div className="flex h-full">
                <aside className="hidden w-64 shrink-0 border-r border-[#dfe3f4] bg-[#eef2ff] px-5 py-7 lg:flex lg:flex-col">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/20">
                            <Bot className="h-5 w-5" />
                        </div>
                        <div className="leading-tight">
                            <p className="text-xl font-extrabold tracking-tight text-blue-700">Study Buddy</p>
                            <p className="text-[11px] font-medium text-slate-500">Your Intellectual Partner</p>
                        </div>
                    </div>

                    <button className="mt-9 flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-700/20 transition hover:bg-blue-600">
                        <Plus className="h-4 w-4" />
                        Nuevo chat
                    </button>

                    <nav className="mt-9 space-y-2">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            return (
                                <button
                                    key={item.label}
                                    className={[
                                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition',
                                        item.active
                                            ? 'bg-[#dfe6ff] text-blue-700'
                                            : 'text-slate-700 hover:bg-white/60 hover:text-blue-700',
                                    ].join(' ')}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </button>
                            )
                        })}
                    </nav>

                    <div className="mt-auto border-t border-[#d8ddf0] pt-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                                A
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-slate-900">Alex Rivera</p>
                                <p className="truncate text-xs text-slate-500">Management Student</p>
                            </div>
                        </div>
                    </div>
                </aside>

                <section className="min-w-0 flex-1">
                    <ChatInterface
                        materiaId={COURSE_CONFIG.id}
                        materiaNombre={COURSE_CONFIG.nombreMateria}
                        botNombre={COURSE_CONFIG.nombreBot}
                        welcomeMessage={COURSE_CONFIG.welcomeMessage}
                        carreraNombre={COURSE_CONFIG.nombreCarrera}
                        orgNombre={COURSE_CONFIG.nombreInstitucion}
                        theme={COURSE_CONFIG.theme}
                    />
                </section>
            </div>
        </main>
    )
}
