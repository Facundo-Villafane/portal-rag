import { AdminLayout } from '@/components/admin-layout'
import { PageHeader } from '@/components/page-header'
import { NewCarreraForm } from './new-carrera-form'
import { createClient } from '@/lib/supabase/server'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function NewCarreraPage({ params }: PageProps) {
    const { id } = await params

    const supabase = await createClient()
    const { data: org } = await supabase.from('organization').select('nombre').eq('org_id', id).single()

    return (
        <AdminLayout organizationId={id}>
            <div className="p-8 max-w-2xl mx-auto overflow-y-auto h-full">
                <PageHeader
                    title="Nueva Carrera"
                    description="Registra una nueva carrera en la organizacion."
                    breadcrumbs={[
                        { label: org?.nombre || 'Universidad', href: `/admin/organizations/${id}/dashboard` },
                        { label: 'Carreras', href: `/admin/organizations/${id}/carreras` },
                        { label: 'Nueva Carrera' }
                    ]}
                />
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                    <NewCarreraForm orgId={id} />
                </div>
            </div>
        </AdminLayout>
    )
}
