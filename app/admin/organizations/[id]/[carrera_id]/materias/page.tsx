import { getMaterias } from '@/lib/actions/materias'
import { AdminLayout } from '@/components/admin-layout'
import { PageHeader } from '@/components/page-header'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { MateriaList } from './materia-list'
import { createClient } from '@/lib/supabase/server'

interface PageProps {
    params: Promise<{ id: string; carrera_id: string }>
}

export default async function MateriasPage({ params }: PageProps) {
    const { id, carrera_id } = await params
    const materias = await getMaterias(carrera_id)

    const supabase = await createClient()
    const [{ data: org }, { data: carrera }] = await Promise.all([
        supabase.from('organization').select('nombre').eq('org_id', id).single(),
        supabase.from('carrera').select('nombre').eq('carrera_id', carrera_id).single(),
    ])

    return (
        <AdminLayout organizationId={id}>
            <div className="p-8 overflow-y-auto h-full">
                <PageHeader
                    title={carrera?.nombre || 'Materias'}
                    description="Gestión de materias y asistentes virtuales"
                    breadcrumbs={[
                        { label: org?.nombre || 'Universidad', href: `/admin/organizations/${id}/dashboard` },
                        { label: 'Carreras', href: `/admin/organizations/${id}/carreras` },
                        { label: carrera?.nombre || 'Carrera' }
                    ]}
                    action={
                        <Link
                            href={`/admin/organizations/${id}/${carrera_id}/materias/new`}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Nueva Materia
                        </Link>
                    }
                />
                <MateriaList initialMaterias={materias} orgId={id} carreraId={carrera_id} />
            </div>
        </AdminLayout>
    )
}
