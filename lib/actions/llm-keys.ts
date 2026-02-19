'use server'

import { createClient } from '@/lib/supabase/server'
import { encryptCredential, getLast4, validateApiKeyFormat } from '@/lib/encryption'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const AddKeySchema = z.object({
    orgId:    z.string().uuid(),
    provider: z.enum(['groq', 'openai', 'anthropic']),
    label:    z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(60),
    apiKey:   z.string().min(20, 'La API key parece demasiado corta'),
})

// ── Auth helper ────────────────────────────────────────────────────────────────

async function resolveCallerAccess(orgId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { supabase, allowed: false as const, reason: 'No autenticado' }

    const { data: userData } = await supabase
        .from('app_user')
        .select('rol, org_id')
        .eq('user_id', user.id)
        .single()

    const isSuperadmin = userData?.rol === 'superadmin'
    const isAdminOwner = userData?.rol === 'admin' && userData?.org_id === orgId

    if (!isSuperadmin && !isAdminOwner) {
        return { supabase, allowed: false as const, reason: 'Sin permisos para gestionar claves de esta organización' }
    }

    return { supabase, allowed: true as const, reason: '' }
}

// ── Actions ────────────────────────────────────────────────────────────────────

export async function addOrgKey(
    orgId: string,
    provider: 'groq' | 'openai' | 'anthropic',
    label: string,
    apiKey: string,
): Promise<{ success?: boolean; message: string }> {
    const { supabase, allowed, reason } = await resolveCallerAccess(orgId)
    if (!allowed) return { message: reason }

    const parsed = AddKeySchema.safeParse({ orgId, provider, label, apiKey })
    if (!parsed.success) {
        return { message: parsed.error.flatten().formErrors[0] ?? 'Datos inválidos' }
    }

    if (!validateApiKeyFormat(apiKey)) {
        return { message: 'La API key no tiene un formato válido (mínimo 20 caracteres, sin espacios)' }
    }

    let encryptedKey: string
    try {
        encryptedKey = encryptCredential(apiKey)
    } catch (err) {
        console.error('[addOrgKey] encryption failed:', err)
        return { message: 'Error al cifrar la clave. Verificá la variable MASTER_ENCRYPTION_KEY.' }
    }

    const { error } = await supabase.from('org_llm_key').insert({
        org_id:        orgId,
        provider,
        label:         label.trim(),
        encrypted_key: encryptedKey,
        key_last4:     getLast4(apiKey),
        is_active:     true,
    })

    if (error) {
        if (error.code === '23505') {
            return { message: `Ya existe una clave con el nombre "${label.trim()}" en esta organización.` }
        }
        return { message: 'Error al guardar la clave: ' + error.message }
    }

    revalidatePath(`/admin/organizations/${orgId}/dashboard`)
    return { success: true, message: 'Clave agregada exitosamente' }
}

export async function toggleOrgKey(
    keyId: string,
    orgId: string,
    isActive: boolean,
): Promise<{ success?: boolean; message: string }> {
    const { supabase, allowed, reason } = await resolveCallerAccess(orgId)
    if (!allowed) return { message: reason }

    const { error } = await supabase
        .from('org_llm_key')
        .update({ is_active: isActive })
        .eq('key_id', keyId)
        .eq('org_id', orgId)

    if (error) return { message: 'Error al actualizar: ' + error.message }

    revalidatePath(`/admin/organizations/${orgId}/dashboard`)
    return { success: true, message: '' }
}

export async function deleteOrgKey(
    keyId: string,
    orgId: string,
): Promise<{ success?: boolean; message: string }> {
    const { supabase, allowed, reason } = await resolveCallerAccess(orgId)
    if (!allowed) return { message: reason }

    const { error } = await supabase
        .from('org_llm_key')
        .delete()
        .eq('key_id', keyId)
        .eq('org_id', orgId)

    if (error) return { message: 'Error al eliminar: ' + error.message }

    revalidatePath(`/admin/organizations/${orgId}/dashboard`)
    return { success: true, message: 'Clave eliminada' }
}
