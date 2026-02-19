'use client'

import Link from 'next/link'
import { Network, LayoutDashboard, LogIn } from 'lucide-react'

interface HomeHeaderProps {
    isLoggedIn: boolean
    dashboardUrl: string
}

export function HomeHeader({ isLoggedIn, dashboardUrl }: HomeHeaderProps) {
    return (
        <header className="border-b border-slate-800 sticky top-0 z-10 bg-slate-950/80 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative w-9 h-9 flex-shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-cyan-400 to-violet-600 rounded-lg" />
                        <div className="relative w-full h-full flex items-center justify-center">
                            <Network className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <div className="leading-tight">
                        <span className="font-bold text-base text-white tracking-tight">Codisea </span>
                        <span className="font-bold text-base bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent tracking-tight">Nexus</span>
                    </div>
                </div>
                <nav className="hidden md:flex items-center gap-6">
                    {isLoggedIn ? (
                        <Link
                            href={dashboardUrl}
                            className="flex items-center gap-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg transition-colors"
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Ir al dashboard
                        </Link>
                    ) : (
                        <Link
                            href="/login"
                            className="flex items-center gap-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg transition-colors"
                        >
                            <LogIn className="w-4 h-4" />
                            Iniciar sesión
                        </Link>
                    )}
                </nav>
                {/* Mobile */}
                <div className="flex md:hidden">
                    {isLoggedIn ? (
                        <Link href={dashboardUrl} className="flex items-center gap-1.5 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
                            <LayoutDashboard className="w-4 h-4" />
                            Dashboard
                        </Link>
                    ) : (
                        <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                            Iniciar sesión
                        </Link>
                    )}
                </div>
            </div>
        </header>
    )
}
