'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Network, Loader2 } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) throw error
            router.push('/admin')
            router.refresh()
        } catch (err: any) {
            setError(err.message || 'Error al iniciar sesión')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
            <div className="max-w-md w-full space-y-8">

                {/* Brand */}
                <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-8">
                        <div className="relative w-10 h-10 flex-shrink-0">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-cyan-400 to-violet-600 rounded-xl" />
                            <div className="relative w-full h-full flex items-center justify-center">
                                <Network className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <div className="leading-tight text-left">
                            <span className="font-bold text-lg text-white tracking-tight">Codisea </span>
                            <span className="font-bold text-lg bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent tracking-tight">Nexus</span>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-white">Iniciar sesión</h2>
                    <p className="mt-2 text-sm text-slate-500">
                        Acceso al panel de administración
                    </p>
                </div>

                {/* Form */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
                    <form className="space-y-5" onSubmit={handleLogin}>
                        {error && (
                            <div className="bg-red-950 text-red-400 border border-red-900 p-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email-address" className="block text-xs font-medium text-slate-400 mb-1.5">
                                    Correo electrónico
                                </label>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                                    placeholder="usuario@universidad.edu"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-xs font-medium text-slate-400 mb-1.5">
                                    Contraseña
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center py-3 px-4 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Ingresar'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-xs text-slate-600">
                    Sin cuenta? Contactá al administrador del sistema.
                </p>
            </div>
        </div>
    )
}
