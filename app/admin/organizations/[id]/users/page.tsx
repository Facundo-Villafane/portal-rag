import { getUsers } from '@/lib/actions/users'
import { AdminLayout } from '@/components/admin-layout'
import { PageHeader } from '@/components/page-header'
import { UserList } from './user-list'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function UsersPage({ params }: PageProps) {
    const { id } = await params
    const users = await getUsers(id)

    const supabase = await createClient()
    const { data: org } = await supabase.from('organization').select('nombre').eq('org_id', id).single()

    return (
        <AdminLayout organizationId={id}>
            <div className="p-8 overflow-y-auto h-full">
                <PageHeader
                    title="Usuarios"
                    description="Gestión del equipo de la organización"
                    breadcrumbs={[
                        { label: org?.nombre || 'Universidad', href: `/admin/organizations/${id}/dashboard` },
                        { label: 'Usuarios' }
                    ]}
                    action={
                        <Link
                            href={`/admin/organizations/${id}/users/new`}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Invitar Usuario
                        </Link>
                    }
                />
                <UserList initialUsers={users} />
            </div>
        </AdminLayout>
    )
}
