import { AdminLayout } from '@/components/admin-layout'
import { PageHeader } from '@/components/page-header'
import { InviteForm } from './invite-form'
import { createClient } from '@/lib/supabase/server'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function InviteUserPage({ params }: PageProps) {
    const { id } = await params

    const supabase = await createClient()
    const { data: org } = await supabase.from('organization').select('nombre').eq('org_id', id).single()

    return (
        <AdminLayout organizationId={id}>
            <div className="p-8 max-w-2xl mx-auto overflow-y-auto h-full">
                <PageHeader
                    title="Invitar Usuario"
                    description="Envía una invitación por email para unirte a la organización."
                    breadcrumbs={[
                        { label: org?.nombre || 'Universidad', href: `/admin/organizations/${id}/dashboard` },
                        { label: 'Usuarios', href: `/admin/organizations/${id}/users` },
                        { label: 'Invitar Usuario' }
                    ]}
                />
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                    <InviteForm orgId={id} />
                </div>
            </div>
        </AdminLayout>
    )
}
