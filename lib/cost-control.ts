import type { SupabaseClient } from '@supabase/supabase-js'

export async function checkLimits(org_id: string, supabase?: SupabaseClient): Promise<{ allowed: boolean; reason?: string }> {
    if (!supabase) {
        const { createClient } = await import('./supabase/server')
        supabase = await createClient()
    }

    // Get Org Config
    const { data: org, error } = await supabase
        .from('organization')
        .select('config_global')
        .eq('org_id', org_id)
        .single()

    if (error || !org) {
        console.error('[cost-control] org not found:', error)
        // Fail open — don't block chat if org lookup fails
        return { allowed: true }
    }

    const config = org.config_global as any
    // Defaults if not set
    const limitTokens = config.limite_tokens_mensual || 100000
    const limitMessages = config.limite_mensajes_mensual || 1000

    // Calculate usage for current month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    // Note: For high scale, this aggregation should be a materialized view or incremented counter.
    // For < 50 students / low volume, runtime count is fine.
    const { data: usage, error: usageError } = await supabase
        .from('chat_session')
        .select('tokens_input, tokens_output')
        .eq('org_id', org_id)
        .gte('created_at', startOfMonth.toISOString())

    if (usageError) {
        console.error('Error checking usage:', usageError)
        return { allowed: true } // Fail open for now
    }

    const totalTokens = usage.reduce((acc, curr) => acc + (curr.tokens_input || 0) + (curr.tokens_output || 0), 0)
    const totalMessages = usage.length

    console.log(`[cost-control] org=${org_id} tokens=${totalTokens}/${limitTokens} messages=${totalMessages}/${limitMessages}`)

    if (totalTokens >= limitTokens) return { allowed: false, reason: 'Monthly token limit exceeded' }
    if (totalMessages >= limitMessages) return { allowed: false, reason: 'Monthly message limit exceeded' }

    return { allowed: true }
}
