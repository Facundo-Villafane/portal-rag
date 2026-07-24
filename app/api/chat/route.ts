import { NextRequest, NextResponse } from 'next/server'
import { retrieveContext, constructSystemPrompt } from '@/lib/rag'
import { getModel } from '@/lib/llm'
import { COURSE_CONFIG } from '@/lib/course-config'
import { checkDailyLimit, getChatLimitConfig, getClientIp } from '@/lib/rate-limit'
import { generateText } from 'ai'
import { z } from 'zod'

export const maxDuration = 30

const chatSchema = z.object({
    materia_id: z.string().optional(),
    pregunta: z.string().min(1).max(2000),
    session_id: z.string().optional(),
})

export async function OPTIONS() {
    return new Response(null, { status: 204 })
}

export async function POST(req: NextRequest) {
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

    const { pregunta, session_id } = valResult.data
    const clientIp = getClientIp(req)
    const limits = getChatLimitConfig()
    const sessionLimit = checkDailyLimit(`session:${session_id || clientIp}`, limits.perSessionDaily)
    const ipLimit = checkDailyLimit(`ip:${clientIp}`, limits.perIpDaily)

    if (!sessionLimit.allowed || !ipLimit.allowed) {
        const activeLimit = !sessionLimit.allowed ? sessionLimit : ipLimit

        return new Response(
            `Llegaste al limite diario de consultas de Billr. Para cuidar el cupo del curso, volve a intentar ${activeLimit.resetLabel}.`,
            {
                status: 429,
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'X-RateLimit-Limit': String(activeLimit.limit),
                    'X-RateLimit-Remaining': String(activeLimit.remaining),
                },
            }
        )
    }

    const { topK, scoreThreshold } = COURSE_CONFIG.retriever
    const context = await retrieveContext(pregunta, COURSE_CONFIG.id, 'local', topK, scoreThreshold)

    const systemPrompt = constructSystemPrompt(context, null, {
        nombre_materia: COURSE_CONFIG.nombreMateria,
        nombre_carrera: COURSE_CONFIG.nombreCarrera,
        nombre_institucion: COURSE_CONFIG.nombreInstitucion,
        nombre_bot: COURSE_CONFIG.nombreBot,
    })

    const modelName = COURSE_CONFIG.model

    try {
        const model = await getModel(modelName)
        const result = await generateText({
            model,
            system: systemPrompt,
            messages: [{ role: 'user', content: pregunta }],
            temperature: COURSE_CONFIG.temperature,
            maxOutputTokens: COURSE_CONFIG.limits.maxOutputTokens,
        })

        return new Response(result.text, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'X-Content-Type-Options': 'nosniff',
                'X-Model-Used': modelName,
                'X-RateLimit-Remaining': String(Math.min(sessionLimit.remaining, ipLimit.remaining)),
            },
        })
    } catch (err) {
        console.error('[chat] model error:', err)
        return NextResponse.json({
            error: 'Error al generar respuesta',
            details: err instanceof Error ? err.message : 'Unknown error',
        }, { status: 500 })
    }
}
