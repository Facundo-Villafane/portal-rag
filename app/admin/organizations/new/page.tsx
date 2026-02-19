import { AdminLayout } from '@/components/admin-layout'
import { PageHeader } from '@/components/page-header'
import { NewOrganizationForm } from './new-org-form'

export default async function NewOrganizationPage() {
    return (
        <AdminLayout mode="platform">
            <div className="p-8 max-w-2xl mx-auto overflow-y-auto h-full">
                <PageHeader
                    title="Nueva Universidad"
                    description="Registra una nueva universidad o entidad en el sistema."
                    breadcrumbs={[
                        { label: 'Plataforma' },
                        { label: 'Universidades', href: '/admin/organizations' },
                        { label: 'Nueva Universidad' }
                    ]}
                />
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                    <NewOrganizationForm />
                </div>
            </div>
        </AdminLayout>
    )
}
