import { Shield, BookOpen, Zap, Network, GraduationCap } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { HomeHeader } from './home-header'
import { HomeChatForm } from './home-chat-form'
import dynamic from 'next/dynamic'

const RippleGrid = dynamic(() => import('@/components/ripple-grid'), { ssr: false })

async function getAuthState(): Promise<{ isLoggedIn: boolean; dashboardUrl: string }> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return { isLoggedIn: false, dashboardUrl: '/login' }

        const { data: userData } = await supabase
            .from('app_user')
            .select('rol, org_id')
            .eq('user_id', user.id)
            .single()

        if (!userData) return { isLoggedIn: false, dashboardUrl: '/login' }

        if (userData.rol === 'superadmin') {
            return { isLoggedIn: true, dashboardUrl: '/admin/organizations' }
        }

        if (userData.rol === 'admin' || userData.rol === 'profesor') {
            return { isLoggedIn: true, dashboardUrl: `/admin/organizations/${userData.org_id}/dashboard` }
        }

        return { isLoggedIn: true, dashboardUrl: '/admin' }
    } catch {
        return { isLoggedIn: false, dashboardUrl: '/login' }
    }
}

export default async function Home() {
    const { isLoggedIn, dashboardUrl } = await getAuthState()

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-white">

            <HomeHeader isLoggedIn={isLoggedIn} dashboardUrl={dashboardUrl} />

            <main className="flex-1">
                {/* Hero con RippleGrid de fondo */}
                <div className="relative">
                    {/* RippleGrid — fondo absoluto, cubre toda la sección hero */}
                    <div className="absolute inset-0 pointer-events-none">
                        <RippleGrid
                            enableRainbow={false}
                            gridColor="#22d3ee"
                            rippleIntensity={0.04}
                            gridSize={10}
                            gridThickness={18}
                            fadeDistance={1.6}
                            vignetteStrength={2.5}
                            glowIntensity={0.08}
                            opacity={0.35}
                            mouseInteraction={true}
                            mouseInteractionRadius={1.2}
                        />
                    </div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-36">
                    <div className="text-center max-w-3xl mx-auto space-y-8">

                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950 text-cyan-400 text-sm font-medium border border-cyan-900">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
                            </span>
                            AI Knowledge Hub for Education
                        </div>

                        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
                            Asistentes de IA{' '}
                            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
                                contextuales
                            </span>{' '}
                            para tu universidad
                        </h1>

                        <p className="text-xl text-slate-400 leading-relaxed">
                            Conectá el conocimiento de tus materias con modelos de lenguaje avanzados.
                            Respondés dudas de alumnos 24/7, basándote exclusivamente en tu material académico.
                        </p>

                        <HomeChatForm />

                        <div className="pt-4 flex justify-center gap-6 text-sm text-slate-500">
                            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-slate-600" /> Acceso seguro</span>
                            <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-slate-600" /> Fuentes verificadas</span>
                            <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-slate-600" /> Respuesta instantánea</span>
                        </div>
                    </div>
                </div>
                </div>{/* end hero relative wrapper */}

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 border-t border-slate-800 pt-16">
                    <p className="text-center text-xs font-semibold text-slate-500 uppercase tracking-widest mb-12">Infraestructura de IA para instituciones educativas</p>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 hover:border-blue-800 transition-colors group">
                            <div className="w-11 h-11 bg-blue-950 rounded-xl flex items-center justify-center mb-5 text-blue-400 group-hover:bg-blue-900 transition-colors">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2 text-white">RAG por Materia</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">Cada asistente responde exclusivamente con el material bibliográfico cargado por el docente. Sin alucinaciones fuera de contexto.</p>
                        </div>
                        <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 hover:border-cyan-800 transition-colors group">
                            <div className="w-11 h-11 bg-cyan-950 rounded-xl flex items-center justify-center mb-5 text-cyan-400 group-hover:bg-cyan-900 transition-colors">
                                <GraduationCap className="w-5 h-5" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2 text-white">Multi-Institución</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">Arquitectura multi-tenant. Cada universidad tiene su espacio aislado con carreras, materias y usuarios independientes.</p>
                        </div>
                        <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 hover:border-violet-800 transition-colors group">
                            <div className="w-11 h-11 bg-violet-950 rounded-xl flex items-center justify-center mb-5 text-violet-400 group-hover:bg-violet-900 transition-colors">
                                <Network className="w-5 h-5" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2 text-white">Integración LMS</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">Embebé cualquier asistente en Moodle, Notion o cualquier plataforma vía iframe. Los alumnos acceden sin crear cuenta.</p>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="border-t border-slate-800 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-600 text-xs">
                    <div className="flex items-center gap-2">
                        <Network className="w-4 h-4 text-slate-700" />
                        <span className="font-medium text-slate-500">Codisea Nexus</span>
                    </div>
                    <p>&copy; {new Date().getFullYear()} Codisea. Todos los derechos reservados.</p>
                    <p className="text-slate-700">nexus.codisea.dev</p>
                </div>
            </footer>
        </div>
    )
}
