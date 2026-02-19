import { AdminLayout } from '@/components/admin-layout'
import { PageHeader } from '@/components/page-header'
import { MateriaForm } from './materia-form'
import { createClient } from '@/lib/supabase/server'

interface PageProps {
    params: Promise<{ id: string; carrera_id: string }>
}

export default async function NewMateriaPage({ params }: PageProps) {
    const { id, carrera_id } = await params

    const supabase = await createClient()
    const [{ data: org }, { data: carrera }] = await Promise.all([
        supabase.from('organization').select('nombre').eq('org_id', id).single(),
        supabase.from('carrera').select('nombre').eq('carrera_id', carrera_id).single(),
    ])

    return (
        <AdminLayout organizationId={id}>
            <div className="p-8 max-w-2xl mx-auto overflow-y-auto h-full">
                <PageHeader
                    title="Nueva Materia"
                    description="Crea una nueva materia en esta carrera."
                    breadcrumbs={[
                        { label: org?.nombre || 'Universidad', href: `/admin/organizations/${id}/dashboard` },
                        { label: 'Carreras', href: `/admin/organizations/${id}/carreras` },
                        { label: carrera?.nombre || 'Carrera', href: `/admin/organizations/${id}/${carrera_id}/materias` },
                        { label: 'Nueva Materia' }
                    ]}
                />
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                    <MateriaForm orgId={id} carreraId={carrera_id} />
                </div>
            </div>
        </AdminLayout>
    )
}
