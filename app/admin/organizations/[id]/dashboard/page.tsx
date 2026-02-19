import { createClient } from '@/lib/supabase/server'
import { AdminLayout } from '@/components/admin-layout'
import Link from 'next/link'
import { GraduationCap, Users, FileText, BookOpen, ArrowUpRight, TrendingUp, ShieldCheck, KeyRound } from 'lucide-react'
import { OrgPermissionsToggle } from './org-permissions-toggle'
import { LlmKeysPanel, type OrgKey } from './llm-keys-panel'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function OrgDashboardPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()

    // Fetch user role + org config in parallel with stats
    const [
        { data: { user } },
        { count: carrerasCount },
        { count: materiasCount },
        { count: usersCount },
        { count: knowledgeCount },
        { data: recentCarreras },
        { data: org },
        { data: orgKeys },
    ] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('carrera').select('*', { count: 'exact', head: true }).eq('org_id', id),
        supabase.from('materia').select('*', { count: 'exact', head: true }).eq('org_id', id),
        supabase.from('app_user').select('*', { count: 'exact', head: true }).eq('org_id', id),
        supabase.from('knowledge_entry').select('*', { count: 'exact', head: true }).eq('org_id', id),
        supabase.from('carrera').select('carrera_id, nombre, created_at').eq('org_id', id).order('created_at', { ascending: false }).limit(5),
        supabase.from('organization').select('config_global').eq('org_id', id).single(),
        // encrypted_key is intentionally NOT selected — only safe display fields
        supabase.from('org_llm_key').select('key_id, provider, label, key_last4, is_active, created_at').eq('org_id', id).order('created_at', { ascending: true }),
    ])

    // Check if current user is admin/superadmin to show the permissions panel
    let isAdmin = false
    if (user) {
        const { data: userData } = await supabase
            .from('app_user')
            .select('rol')
            .eq('user_id', user.id)
            .single()
        isAdmin = userData?.rol === 'admin' || userData?.rol === 'superadmin'
    }

    const profesoresConfigAvanzada = org?.config_global?.profesores_config_avanzada === true

    return (
        <AdminLayout organizationId={id}>
            <div className="p-8 space-y-8 overflow-y-auto h-full">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-slate-500 mt-1">Resumen de actividad y estadísticas de la organización</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                                <GraduationCap className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Carreras</p>
                                <p className="text-2xl font-bold text-slate-900">{carrerasCount || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Materias</p>
                                <p className="text-2xl font-bold text-slate-900">{materiasCount || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
                                <Users className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Usuarios</p>
                                <p className="text-2xl font-bold text-slate-900">{usersCount || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                                <FileText className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Documentos</p>
                                <p className="text-2xl font-bold text-slate-900">{knowledgeCount || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Quick Actions */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                            Accesos Rápidos
                        </h3>
                        <div className="space-y-3">
                            <Link href={`/admin/organizations/${id}/carreras`} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 text-slate-600 border border-transparent hover:border-slate-200 transition-all group">
                                <div className="flex items-center gap-3">
                                    <GraduationCap className="w-5 h-5 text-blue-500" />
                                    <span className="font-medium">Gestionar Carreras</span>
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                            </Link>
                            <Link href={`/admin/organizations/${id}/users`} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 text-slate-600 border border-transparent hover:border-slate-200 transition-all group">
                                <div className="flex items-center gap-3">
                                    <Users className="w-5 h-5 text-indigo-500" />
                                    <span className="font-medium">Gestionar Usuarios</span>
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                            </Link>
                        </div>
                    </div>

                    {/* Recent Carreras */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-4">Carreras Recientes</h3>
                        <div className="space-y-3">
                            {recentCarreras && recentCarreras.length > 0 ? (
                                recentCarreras.map((carrera) => (
                                    <Link
                                        key={carrera.carrera_id}
                                        href={`/admin/organizations/${id}/${carrera.carrera_id}/materias`}
                                        className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all"
                                    >
                                        <div>
                                            <p className="font-medium text-slate-900">{carrera.nombre}</p>
                                            <p className="text-xs text-slate-500">
                                                Creada {new Date(carrera.created_at).toLocaleDateString('es-AR')}
                                            </p>
                                        </div>
                                        <ArrowUpRight className="w-4 h-4 text-slate-400" />
                                    </Link>
                                ))
                            ) : (
                                <p className="text-sm text-slate-500 text-center py-4">
                                    No hay carreras creadas aún
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Admin-only panels */}
                {isAdmin && (
                    <div className="space-y-6">
                        {/* Permissions panel */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-slate-500" />
                                Permisos de profesores
                            </h3>
                            <p className="text-sm text-slate-500 mb-5">
                                Controlá qué pueden modificar los profesores en la configuración del chatbot.
                            </p>
                            <OrgPermissionsToggle
                                orgId={id}
                                profesoresConfigAvanzada={profesoresConfigAvanzada}
                            />
                        </div>

                        {/* API Key pool */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
                                <KeyRound className="w-5 h-5 text-slate-500" />
                                Claves de API
                            </h3>
                            <p className="text-sm text-slate-500 mb-5">
                                Pool de claves por proveedor. Se distribuyen aleatoriamente entre las materias para evitar rate limits.
                                Si no hay claves configuradas se usa la clave global del servidor.
                            </p>
                            <LlmKeysPanel
                                orgId={id}
                                initialKeys={(orgKeys ?? []) as OrgKey[]}
                            />
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
