import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminLayout } from '@/components/admin-layout'
import { TrendingUp, TrendingDown, DollarSign, Zap, MessageSquare, Database, Activity } from 'lucide-react'
import { calculateCost } from '@/lib/llm'

export default async function AdminDashboard() {
    const supabase = await createClient()

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    const { data: userData } = await supabase
        .from('app_user')
        .select('rol, org_id')
        .eq('user_id', user.id)
        .single()

    if (!userData || !['admin', 'superadmin'].includes(userData.rol)) {
        return (
            <div className="p-8 text-center text-red-600">
                <h1>Acceso Denegado</h1>
                <p>No tienes permisos de administrador.</p>
            </div>
        )
    }

    // Redirect SuperAdmin to Organizations List
    if (userData.rol === 'superadmin') {
        redirect('/admin/organizations')
    }

    const org_id = userData.org_id

    // 2. Fetch Comprehensive Metrics
    const { data: sessions } = await supabase
        .from('chat_session')
        .select('tokens_input, tokens_output, modelo_utilizado, created_at, costo_estimado')
        .eq('org_id', org_id)
        .order('created_at', { ascending: false })
        .limit(100)

    const { count: entriesCount } = await supabase
        .from('knowledge_entry')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', org_id)

    const { count: materiasCount } = await supabase
        .from('materia')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', org_id)

    // Calculate stats
    const totalTokens = sessions?.reduce((acc, s) => acc + (s.tokens_input || 0) + (s.tokens_output || 0), 0) || 0
    const totalCost = sessions?.reduce((acc, s) => acc + (s.costo_estimado || 0), 0) || 0
    const totalSessions = sessions?.length || 0

    // Calculate trend (compare with previous period - mock for now)
    const recentSessions = sessions?.filter(s => {
        const date = new Date(s.created_at)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return date > weekAgo
    }).length || 0

    const tokenTrend = totalTokens > 0 ? '+12%' : '0%' // Mock
    const costTrend = totalCost > 0 ? '+8%' : '0%'

    return (
        <AdminLayout organizationId={org_id}>
            <div className="p-8 space-y-8 overflow-y-auto h-full">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Panel de Administración</h1>
                    <p className="text-slate-500 mt-1">Resumen de actividad y métricas de tu organización</p>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total Tokens */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                                <Zap className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                                <TrendingUp className="w-4 h-4 text-emerald-600" />
                                <span className="font-medium text-emerald-600">{tokenTrend}</span>
                            </div>
                        </div>
                        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">Tokens Consumidos</h3>
                        <p className="text-3xl font-bold text-slate-900 mt-2">{totalTokens.toLocaleString()}</p>
                        <p className="text-xs text-slate-400 mt-1">Últimos 100 chats</p>
                    </div>

                    {/* Total Cost */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                                <TrendingUp className="w-4 h-4 text-emerald-600" />
                                <span className="font-medium text-emerald-600">{costTrend}</span>
                            </div>
                        </div>
                        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">Costo Total</h3>
                        <p className="text-3xl font-bold text-slate-900 mt-2">${totalCost.toFixed(4)}</p>
                        <p className="text-xs text-slate-400 mt-1">USD estimado</p>
                    </div>

                    {/* Sessions */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center">
                                <MessageSquare className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                                <Activity className="w-4 h-4 text-slate-400" />
                                <span className="font-medium text-slate-600">{recentSessions} esta semana</span>
                            </div>
                        </div>
                        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">Sesiones Totales</h3>
                        <p className="text-3xl font-bold text-slate-900 mt-2">{totalSessions}</p>
                        <p className="text-xs text-slate-400 mt-1">Conversaciones únicas</p>
                    </div>

                    {/* Knowledge Entries */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                                <Database className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                                <span className="font-medium text-slate-600">{materiasCount || 0} materias</span>
                            </div>
                        </div>
                        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">Documentos Indexados</h3>
                        <p className="text-3xl font-bold text-slate-900 mt-2">{entriesCount || 0}</p>
                        <p className="text-xs text-slate-400 mt-1">Chunks en base de conocimiento</p>
                    </div>
                </div>

                {/* Recent Activity Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                        <h3 className="font-semibold text-slate-800">Actividad Reciente</h3>
                        <p className="text-sm text-slate-500 mt-1">Últimas 100 sesiones de chat</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Modelo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tokens</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Costo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {sessions?.map((session, i) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                                <span className="font-medium text-slate-900 text-sm">{session.modelo_utilizado || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {new Date(session.created_at).toLocaleString('es-AR', {
                                                dateStyle: 'short',
                                                timeStyle: 'short'
                                            })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-slate-900">
                                                {((session.tokens_input || 0) + (session.tokens_output || 0)).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-slate-900">
                                                ${(session.costo_estimado || 0).toFixed(6)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {(!sessions || sessions.length === 0) && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                            No hay actividad registrada.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}
