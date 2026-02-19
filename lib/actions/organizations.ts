'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const OrganizationSchema = z.object({
    nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    llm_provider: z.enum(['groq', 'openai']).default('groq'),
    logo_url: z.string().url('URL de logo inválida').optional().or(z.literal('')),
})

export async function getOrganizations() {
    const supabase = await createClient()

    const { data: orgs, error } = await supabase
        .from('organization')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching organizations:', error)
        return []
    }

    return orgs
}

export async function createOrganization(prevState: any, formData: FormData) {
    const supabase = await createClient()

    // 1. Verify Super Admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { message: 'No autenticado' }

    const { data: requester } = await supabase
        .from('app_user')
        .select('rol')
        .eq('user_id', user.id)
        .single()

    if (requester?.rol !== 'superadmin') {
        return { message: 'No tienes permisos para crear organizaciones.' }
    }

    // 2. Validate Input
    const logoUrlRaw = formData.get('logo_url') as string
    const validatedFields = OrganizationSchema.safeParse({
        nombre: formData.get('nombre'),
        llm_provider: formData.get('llm_provider'),
        logo_url: logoUrlRaw || undefined,
    })

    if (!validatedFields.success) {
        return {
            error: validatedFields.error.flatten().fieldErrors,
            message: 'Datos inválidos',
        }
    }

    // 3. Insert Org
    const { data: newOrg, error } = await supabase
        .from('organization')
        .insert({
            nombre: validatedFields.data.nombre,
            llm_provider_default: validatedFields.data.llm_provider,
            logo_url: validatedFields.data.logo_url || null,
            config_global: { plan: 'standard' }
        })
        .select('org_id')
        .single()

    if (error || !newOrg) {
        return { message: 'Error al crear organización: ' + error?.message }
    }

    revalidatePath('/admin/organizations')
    return { message: 'Organización creada exitosamente', success: true, orgId: newOrg.org_id }
}

/**
 * Updates a single key in config_global without overwriting other keys.
 * Only admins and superadmins can call this.
 */
export async function updateOrgConfig(org_id: string, patch: Record<string, unknown>) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { message: 'No autenticado' }

    const { data: userData } = await supabase
        .from('app_user')
        .select('rol, org_id')
        .eq('user_id', user.id)
        .single()

    const isAdmin = userData?.rol === 'admin' || userData?.rol === 'superadmin'
    const ownsOrg = userData?.rol === 'superadmin' || userData?.org_id === org_id
    if (!isAdmin || !ownsOrg) return { message: 'Sin permisos para modificar esta organización' }

    // Fetch current config_global to merge
    const { data: org } = await supabase
        .from('organization')
        .select('config_global')
        .eq('org_id', org_id)
        .single()

    const newConfig = { ...(org?.config_global || {}), ...patch }

    const { error } = await supabase
        .from('organization')
        .update({ config_global: newConfig })
        .eq('org_id', org_id)

    if (error) return { message: 'Error al guardar: ' + error.message }

    revalidatePath(`/admin/organizations/${org_id}/dashboard`)
    return { success: true, message: 'Configuración actualizada' }
}
