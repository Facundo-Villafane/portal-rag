'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Building2,
    GraduationCap,
    Users,
    ChevronLeft,
    ChevronRight,
    ArrowLeft,
    Bot,
} from 'lucide-react'
import { useState, useEffect } from 'react'

interface SidebarProps {
    mode: 'platform' | 'organization'
    organizationId?: string
    organizationName?: string
    organizationLogo?: string
    userRole: 'superadmin' | 'admin' | 'profesor'
    userName?: string
    userEmail?: string
}

export function AdminSidebar({
    mode,
    organizationId,
    organizationName,
    organizationLogo,
    userRole,
    userName,
    userEmail
}: SidebarProps) {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)

    useEffect(() => {
        const stored = localStorage.getItem('sidebar-collapsed')
        if (stored === 'true') setCollapsed(true)
    }, [])

    const toggle = () => {
        const next = !collapsed
        setCollapsed(next)
        localStorage.setItem('sidebar-collapsed', String(next))
    }

    const platformNav = [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'Universidades', href: '/admin/organizations', icon: Building2 },
    ]

    const orgNav = organizationId ? [
        { name: 'Dashboard', href: '/admin/organizations/' + organizationId + '/dashboard', icon: LayoutDashboard },
        { name: 'Carreras', href: '/admin/organizations/' + organizationId + '/carreras', icon: GraduationCap },
        { name: 'Usuarios', href: '/admin/organizations/' + organizationId + '/users', icon: Users },
    ] : []

    const navItems = mode === 'platform' ? platformNav : orgNav

    const initials = (userName || userEmail || 'U').charAt(0).toUpperCase()

    const isOrgMode = mode === 'organization'
    const showOrgLogo = isOrgMode && !!organizationLogo

    return (
        <div className={cn(
            'flex flex-col h-full bg-slate-900 text-white border-r border-slate-800 transition-all duration-300 flex-shrink-0',
            collapsed ? 'w-16' : 'w-64'
        )}>
            {/* Header */}
            <div className={cn(
                'flex items-center border-b border-slate-800 h-16 flex-shrink-0',
                collapsed ? 'justify-center' : 'gap-3 px-4'
            )}>
                {showOrgLogo ? (
                    <div className='w-9 h-9 rounded-lg overflow-hidden bg-white flex items-center justify-center flex-shrink-0 shadow-lg'>
                        <img
                            src={organizationLogo}
                            alt={organizationName || 'Logo'}
                            className='w-full h-full object-contain'
                        />
                    </div>
                ) : (
                    <div className='w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0'>
                        <Bot className='w-5 h-5 text-white' />
                    </div>
                )}
                {!collapsed && (
                    <div className='overflow-hidden'>
                        <p className='font-bold text-sm leading-tight truncate'>
                            {isOrgMode && organizationName ? organizationName : 'Codisea Nexus'}
                        </p>
                        <p className='text-xs text-slate-400 truncate'>
                            {isOrgMode ? 'Portal Académico' : 'AI Knowledge Hub'}
                        </p>
                    </div>
                )}
            </div>

            {/* Back to universities link (org mode, superadmin) */}
            {isOrgMode && !collapsed && userRole === 'superadmin' && (
                <div className='px-4 py-2.5 border-b border-slate-800'>
                    <Link href='/admin/organizations' className='flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors'>
                        <ArrowLeft className='w-3 h-3' />
                        Volver a Universidades
                    </Link>
                </div>
            )}

            {isOrgMode && collapsed && userRole === 'superadmin' && (
                <div className='py-2 flex justify-center border-b border-slate-800'>
                    <Link href='/admin/organizations' title='Volver a Universidades' className='w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors'>
                        <ArrowLeft className='w-4 h-4' />
                    </Link>
                </div>
            )}

            <nav className='flex-1 px-2 py-4 space-y-1 overflow-y-auto'>
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/admin' && item.href !== '/admin/organizations' && pathname.startsWith(item.href + '/'))
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            title={collapsed ? item.name : undefined}
                            className={cn(
                                'flex items-center rounded-lg transition-all',
                                collapsed ? 'justify-center w-10 h-10 mx-auto' : 'gap-3 px-4 py-3',
                                isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            )}
                        >
                            <item.icon className='w-5 h-5 flex-shrink-0' />
                            {!collapsed && <span className='font-medium text-sm'>{item.name}</span>}
                        </Link>
                    )
                })}
            </nav>

            <div className='border-t border-slate-800 p-3 space-y-1 flex-shrink-0'>
                <div className={cn('flex items-center', collapsed ? 'justify-center' : 'gap-3 px-1 py-1')}>
                    <div title={collapsed ? (userName || userEmail || '') : undefined} className='w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold'>
                        {initials}
                    </div>
                    {!collapsed && (
                        <div className='flex-1 overflow-hidden'>
                            <p className='text-xs font-medium truncate'>{userName || userEmail}</p>
                            <p className='text-xs text-slate-400 capitalize'>{userRole}</p>
                        </div>
                    )}
                </div>
                <button
                    onClick={toggle}
                    title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
                    className={cn(
                        'flex items-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs w-full',
                        collapsed ? 'justify-center h-8' : 'gap-2 px-3 py-2'
                    )}
                >
                    {collapsed
                        ? <ChevronRight className='w-4 h-4' />
                        : <><ChevronLeft className='w-4 h-4' /><span>Colapsar</span></>
                    }
                </button>
            </div>
        </div>
    )
}
