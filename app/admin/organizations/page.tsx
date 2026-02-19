import { getOrganizations } from '@/lib/actions/organizations'
import { AdminLayout } from '@/components/admin-layout'
import { PageHeader } from '@/components/page-header'
import { Plus, Building2, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function OrganizationsPage() {
    const orgs = await getOrganizations()
    const supabase = await createClient()

    // Fetch counts per org for the table
    const orgIds = orgs.map((o: any) => o.org_id)
    const countsMap: Record<string, { carreras: number; users: number }> = {}

    if (orgIds.length > 0) {
        const [carrerasRes, usersRes] = await Promise.all([
            supabase.from('carrera').select('org_id').in('org_id', orgIds),
            supabase.from('app_user').select('org_id').in('org_id', orgIds),
        ])
        for (const id of orgIds) {
            countsMap[id] = {
                carreras: carrerasRes.data?.filter((r: any) => r.org_id === id).length ?? 0,
                users: usersRes.data?.filter((r: any) => r.org_id === id).length ?? 0,
            }
        }
    }

    return (
        <AdminLayout mode="platform">
            <div className="p-8 overflow-y-auto h-full">
                <PageHeader
                    title="Universidades"
                    description="Gestion de clientes del sistema. Solo visible para Super Admin."
                    breadcrumbs={[{ label: 'Codisea Nexus' }, { label: 'Universidades' }]}
                    action={
                        <Link
                            href="/admin/organizations/new"
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Nueva Universidad
                        </Link>
                    }
                />

                {orgs.length === 0 ? (
                    <div className="bg-white rounded-xl border border-dashed border-slate-300 py-20 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Building2 className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="font-semibold text-slate-800 mb-1">No hay universidades registradas</h3>
                        <p className="text-sm text-slate-500 mb-6">Crea la primera universidad para comenzar</p>
                        <Link href="/admin/organizations/new" className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                            <Plus className="w-4 h-4" /> Nueva Universidad
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Universidad</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Carreras</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Usuarios</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Proveedor LLM</th>
                                    <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {orgs.map((org: any) => (
                                    <tr key={org.org_id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <Building2 className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 text-sm">{org.nombre}</p>
                                                    <p className="text-xs text-slate-400 font-mono">{org.org_id.slice(0, 8)}...</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                {org.config_global?.plan || 'Free'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                            {countsMap[org.org_id]?.carreras ?? 0}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                            {countsMap[org.org_id]?.users ?? 0}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-600 capitalize">{org.llm_provider_default || 'Groq'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/admin/organizations/${org.org_id}/dashboard`}
                                                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                                            >
                                                Gestionar
                                                <ArrowUpRight className="w-3.5 h-3.5" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
