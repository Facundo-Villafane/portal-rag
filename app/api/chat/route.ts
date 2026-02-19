import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { retrieveContext, constructSystemPrompt } from '@/lib/rag'
import { getModel, calculateCost } from '@/lib/llm'
import { streamText } from 'ai'
import { z } from 'zod'

export const maxDuration = 30

const chatSchema = z.object({
    materia_id: z.string().uuid(),
    pregunta: z.string().min(1).max(2000),
    session_id: z.string().optional(),
})

export async function POST(req: NextRequest) {
    // 1. Validation
    let json
    try {
        json = await req.json()
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const valResult = chatSchema.safeParse(json)
    if (!valResult.success) {
        return NextResponse.json({ error: 'Invalid input', details: valResult.error }, { status: 400 })
    }

    const { materia_id, pregunta, session_id } = valResult.data

    const supabase = createServiceClient()

    // 2. Get Materia Config (including carrera and org for prompt context)
    const { data: materia, error: materiaError } = await supabase
        .from('materia')
        .select('*, organization:org_id(*), carrera:carrera_id(nombre)')
        .eq('materia_id', materia_id)
        .single()

    if (materiaError || !materia) {
        console.error('[chat] materia not found:', materiaError)
        return NextResponse.json({ error: 'Materia not found' }, { status: 404 })
    }

    const org_id = materia.org_id
    const configGlobal = materia.organization?.config_global || {}

    // 2.5 Validate authorized domains
    const referer = req.headers.get('referer')
    const dominiosAutorizados = configGlobal.dominios_autorizados || []

    if (dominiosAutorizados.length > 0 && referer) {
        try {
            const refererDomain = new URL(referer).hostname
            const isAuthorized = dominiosAutorizados.some((domain: string) =>
                refererDomain === domain || refererDomain.endsWith(`.${domain}`)
            )
            if (!isAuthorized) {
                return NextResponse.json({ error: 'Unauthorized domain' }, { status: 403 })
            }
        } catch {
            // invalid referer URL — allow
        }
    }

    // 3. Check Limits
    const { checkLimits } = await import('@/lib/cost-control')
    const limitCheck = await checkLimits(org_id, supabase)
    if (!limitCheck.allowed) {
        return NextResponse.json({
            error: 'Limit exceeded',
            message: 'Se ha alcanzado el límite de uso mensual. Contacte al administrador.'
        }, { status: 429 })
    }

    // 4. Retrieve Context
    const retrieverConfig = materia.retriever_config || {}
    const topK = retrieverConfig.top_k || 8
    const threshold = retrieverConfig.score_threshold || 0.25

    const context = await retrieveContext(pregunta, materia_id, org_id, topK, threshold, supabase)
    console.log(`[chat] retrieved ${context.length} context items for "${pregunta.slice(0, 50)}"`)

    // 5. Build prompt — pass materia context so default template can be resolved
    const promptCtx = {
        nombre_materia: materia.nombre,
        nombre_carrera: materia.carrera?.nombre || 'la carrera',
        nombre_institucion: materia.organization?.nombre || 'la institución',
        nombre_bot: materia.config_bot?.nombre_bot || `Asistente de ${materia.nombre}`,
    }
    const systemPrompt = constructSystemPrompt(context, materia.custom_prompt, promptCtx)

    // 6. Select Model — validate against known models, fallback to default
    const VALID_MODELS = [
        'llama-3.3-70b-versatile', 'llama-3.1-8b-instant',
        'meta-llama/llama-4-maverick-17b-128e-instruct', 'meta-llama/llama-4-scout-17b-16e-instruct',
        'qwen/qwen3-32b',
        'gpt-4o-mini', 'gpt-4o',
        'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307',
    ]
    const rawModel = materia.modelo_seleccionado || ''
    const modelName = VALID_MODELS.includes(rawModel) ? rawModel : 'llama-3.3-70b-versatile'
    console.log(`[chat] using model: ${modelName}${rawModel !== modelName ? ` (fallback from "${rawModel}")` : ''}`)

    try {
        const model = await getModel(modelName, org_id)

        // 7. Stream as plain text — pipe textStream directly to response
        const result = streamText({
            model,
            system: systemPrompt,
            messages: [{ role: 'user', content: pregunta }],
            temperature: materia.config_bot?.temperatura ?? 0.3,
            onFinish: async (event) => {
                try {
                    const usage = event.usage as { promptTokens?: number; completionTokens?: number }
                    const tokensIn = usage.promptTokens || 0
                    const tokensOut = usage.completionTokens || 0
                    const cost = calculateCost(modelName, tokensIn, tokensOut)
                    await supabase.from('chat_session').insert({
                        org_id,
                        materia_id,
                        alumno_id: session_id || 'anonymous',
                        modelo_utilizado: modelName,
                        tokens_input: tokensIn,
                        tokens_output: tokensOut,
                        costo_estimado: cost
                    })
                } catch (err) {
                    console.error('[chat] failed to log session:', err)
                }
            }
        })

        // Use textStream (plain text, no AI SDK protocol framing)
        const encoder = new TextEncoder()
        const readable = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of result.textStream) {
                        controller.enqueue(encoder.encode(chunk))
                    }
                } catch (err) {
                    console.error('[chat] stream error:', err)
                    controller.enqueue(encoder.encode('\n[Error generando respuesta]'))
                } finally {
                    controller.close()
                }
            }
        })

        return new Response(readable, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'X-Content-Type-Options': 'nosniff',
                'X-Model-Used': modelName,
            }
        })
    } catch (err) {
        console.error('[chat] model error:', err)
        return NextResponse.json({
            error: 'Error al generar respuesta',
            details: err instanceof Error ? err.message : 'Unknown error'
        }, { status: 500 })
    }
}
