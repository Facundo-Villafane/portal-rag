import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
    const supabase = await createClient()

    // 1. Auth Check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check role: must be superadmin or admin
    const { data: userData, error: roleError } = await supabase
        .from('app_user')
        .select('rol, org_id')
        .eq('user_id', user.id)
        .single()

    if (roleError || !userData) {
        return NextResponse.json({ error: 'User profile not found' }, { status: 403 })
    }

    if (!['admin', 'superadmin'].includes(userData.rol)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const org_id = userData.org_id

    // 2. Fetch Metrics
    // Total tokens accumulated
    // Most used models
    // Costs (if we had costs. currently dummy 0)

    const { data: sessions, error: sessionsError } = await supabase
        .from('chat_session')
        .select('tokens_input, tokens_output, modelo_utilizado')
        .eq('org_id', org_id)

    if (sessionsError) {
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const totalTokens = sessions.reduce((acc, s) => acc + (s.tokens_input || 0) + (s.tokens_output || 0), 0)
    const totalSessions = sessions.length

    // Model usage distribution
    const modelUsage: Record<string, number> = {}
    sessions.forEach(s => {
        const m = s.modelo_utilizado || 'unknown'
        modelUsage[m] = (modelUsage[m] || 0) + 1
    })

    // Knowledge entries count
    const { count: entriesCount, error: entriesError } = await supabase
        .from('knowledge_entry')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', org_id)

    return NextResponse.json({
        metrics: {
            total_tokens: totalTokens,
            total_sessions: totalSessions,
            entries_count: entriesCount || 0,
            model_usage: modelUsage
        }
    })
}
