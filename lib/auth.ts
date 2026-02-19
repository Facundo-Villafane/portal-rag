import { createClient } from './supabase/server'
import { redirect } from 'next/navigation'

export async function getSession() {
    const supabase = await createClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error || !session) return null
    return session
}

export async function getUser() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null
    return user
}

export async function getOrgId() {
    const user = await getUser()
    if (!user) return null

    const supabase = await createClient()
    const { data } = await supabase
        .from('app_user')
        .select('org_id')
        .eq('user_id', user.id)
        .single()

    return data?.org_id
}

export async function requireUser() {
    const user = await getUser()
    if (!user) {
        redirect('/login')
    }
    return user
}
