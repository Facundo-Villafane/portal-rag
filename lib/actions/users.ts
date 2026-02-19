'use server'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const InviteUserSchema = z.object({
    email: z.string().email('Email inválido'),
    rol: z.enum(['admin', 'profesor'], {
        message: 'Rol inválido. Debe ser "admin" o "profesor"'
    }),
})

export async function inviteUser(prevState: any, formData: FormData) {
    // 1. Validate Input
    const validatedFields = InviteUserSchema.safeParse({
        email: formData.get('email'),
        rol: formData.get('rol'),
    })

    if (!validatedFields.success) {
        return {
            error: validatedFields.error.flatten().fieldErrors,
            message: 'Datos inválidos',
        }
    }

    const { email, rol } = validatedFields.data
    const org_id = formData.get('org_id') as string

    if (!org_id) return { message: 'Falta ID de organización' }

    // 2. Auth Check (Must be Admin/SuperAdmin of this Org)
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { message: 'No autenticado' }

    const { data: currentUserData } = await supabase
        .from('app_user')
        .select('rol, org_id')
        .eq('user_id', user.id)
        .single()

    if (!currentUserData || currentUserData.org_id !== org_id) {
        return { message: 'No tienes permiso para gestionar usuarios de esta organización' }
    }

    if (currentUserData.rol !== 'superadmin' && currentUserData.rol !== 'admin') {
        return { message: 'Solo administradores pueden invitar usuarios' }
    }

    // 3. Create Admin Client for Invitation
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )

    // 4. Invite User
    const { data: authData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: {
            org_id: org_id,
            rol: rol // Optional metadata
        }
        // redirectTo: '...' // Optional
    })

    if (inviteError) {
        return { message: 'Error al invitar: ' + inviteError.message }
    }

    // 5. Sync with app_user public table
    // We need to insert the user into app_user manually if triggers aren't set up.
    // The user_id is in authData.user.id
    if (authData.user) {
        const { error: insertError } = await supabaseAdmin
            .from('app_user')
            .insert({
                user_id: authData.user.id,
                org_id: org_id,
                rol: rol
            })

        if (insertError) {
            console.error('Error inserting app_user:', insertError)
            // Rollback auth user? Or just return warning?
            // Ideally rollback, but for now we warn.
            return { message: 'Usuario invitado, pero hubo un error al asignar perfil: ' + insertError.message }
        }
    }

    revalidatePath(`/admin/organizations/${org_id}/users`)
    return { message: 'Invitación enviada correctamente', success: true }
}

export async function getUsers(org_id: string) {
    const supabase = await createServerClient()

    // Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Fetch users for this org
    const { data: users, error } = await supabase
        .from('app_user')
        .select('*') // We can join with auth.users if we had access, but RLS prevents. 
        // Usually we need a secure function or admin client to get emails.
        // For now, let's see what we can get.
        .eq('org_id', org_id)
        .order('created_at', { ascending: false })

    if (error) return []

    // To get emails, we might need to use the admin client or a view.
    // Standard approach: app_user only has ID. We need a way to show emails.
    // Option A: Store email in app_user (duplication but easy).
    // Option B: Fetch emails via Admin API (slow for lists).
    // Option C: Secure View.

    // Let's try to fetch emails via Admin API for this list since it's likely small.
    // OR BETTER: Store email in app_user during invite/signup for display purposes.
    // For now, I'll return the users and we might miss emails in the UI unless I fetch them.
    // Let's iterate and fetch user data from Admin API? No, too slow.
    // I will modify the invite to store email in app_user if possible, or just add an email column to app_user.
    // Or I can use `supabaseAdmin.auth.admin.listUsers()` and filter? No.

    // QUICK FIX: Add email to app_user schema? Or just fetch specific users.
    // Let's use a workaround: Fetch all users from auth.users using admin client (pagination might be needed)
    // and map them. This is okay for small scale.

    // IMPROVEMENT: Let's create `getAppUsersWithDetails` server action that uses Admin Client.
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })

    const usersWithEmail = users.map(u => {
        const authUser = authUsers.users.find(au => au.id === u.user_id)
        return {
            ...u,
            email: authUser?.email,
            last_sign_in_at: authUser?.last_sign_in_at
        }
    })

    return usersWithEmail
}
