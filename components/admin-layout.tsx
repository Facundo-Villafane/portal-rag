import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from './admin-sidebar'
import { redirect } from 'next/navigation'

interface AdminLayoutProps {
    children: React.ReactNode
    organizationId?: string
    mode?: 'platform' | 'organization'
}

export async function AdminLayout({ children, organizationId, mode }: AdminLayoutProps) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userData } = await supabase
        .from('app_user')
        .select('rol, org_id')
        .eq('user_id', user.id)
        .single()

    if (!userData || !['admin', 'superadmin', 'profesor'].includes(userData.rol)) {
        redirect('/login')
    }

    // Determine effective org ID and mode
    const effectiveOrgId = organizationId || (userData.rol !== 'superadmin' ? userData.org_id : undefined)
    const effectiveMode = mode || (effectiveOrgId ? 'organization' : 'platform')

    let organizationName: string | undefined
    let organizationLogo: string | undefined
    if (effectiveOrgId) {
        const { data: org } = await supabase
            .from('organization')
            .select('nombre, logo_url')
            .eq('org_id', effectiveOrgId)
            .single()
        organizationName = org?.nombre
        organizationLogo = org?.logo_url ?? undefined
    }

    return (
        <div className='flex h-screen overflow-hidden bg-slate-50'>
            <AdminSidebar
                mode={effectiveMode}
                organizationId={effectiveOrgId}
                organizationName={organizationName}
                organizationLogo={organizationLogo}
                userRole={userData.rol as 'superadmin' | 'admin' | 'profesor'}
                userName={user.user_metadata?.full_name}
                userEmail={user.email}
            />
            <main className='flex-1 overflow-hidden'>
                {children}
            </main>
        </div>
    )
}
