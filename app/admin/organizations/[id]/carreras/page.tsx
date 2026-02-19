import { getCarreras } from '@/lib/actions/carreras'
import { AdminLayout } from '@/components/admin-layout'
import { PageHeader } from '@/components/page-header'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { CarreraList } from './carrera-list'
import { createClient } from '@/lib/supabase/server'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function CarrerasPage({ params }: PageProps) {
    const { id } = await params
    const carreras = await getCarreras(id)

    const supabase = await createClient()
    const { data: org } = await supabase.from('organization').select('nombre').eq('org_id', id).single()

    return (
        <AdminLayout organizationId={id}>
            <div className="p-8 overflow-y-auto h-full">
                <PageHeader
                    title="Carreras"
                    description="Gestiona las carreras académicas de la organización"
                    breadcrumbs={[
                        { label: org?.nombre || 'Universidad', href: `/admin/organizations/${id}/dashboard` },
                        { label: 'Carreras' }
                    ]}
                    action={
                        <Link
                            href={`/admin/organizations/${id}/carreras/new`}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Nueva Carrera
                        </Link>
                    }
                />
                <CarreraList initialCarreras={carreras} orgId={id} />
            </div>
        </AdminLayout>
    )
}
