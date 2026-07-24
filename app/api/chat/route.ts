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
        const result = await generateWithFallback({
            modelName,
            fallbackModelName: COURSE_CONFIG.fallbackModel,
            systemPrompt,
            pregunta,
        })

        return new Response(result.text, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'X-Content-Type-Options': 'nosniff',
                'X-Model-Used': result.modelName,
                'X-RateLimit-Remaining': String(Math.min(sessionLimit.remaining, ipLimit.remaining)),
            },
        })
    } catch (err) {
        console.error('[chat] model error:', err)

        if (isProviderRateLimit(err)) {
            return new Response(
                'Billr esta con el cupo diario del modelo casi completo. Proba de nuevo mas tarde; asi evitamos gastar llamadas en intentos que Groq va a rechazar.',
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'text/plain; charset=utf-8',
                        'X-Content-Type-Options': 'nosniff',
                    },
                }
            )
        }

        return new Response(
            'Lo siento, ocurrio un error al generar la respuesta. Proba de nuevo en un momento.',
            {
                status: 500,
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'X-Content-Type-Options': 'nosniff',
                },
            }
        )
    }
}

async function generateWithFallback({
    modelName,
    fallbackModelName,
    systemPrompt,
    pregunta,
}: {
    modelName: string
    fallbackModelName?: string
    systemPrompt: string
    pregunta: string
}) {
    try {
        const model = await getModel(modelName)
        const result = await generateText({
            model,
            system: systemPrompt,
            messages: [{ role: 'user', content: pregunta }],
            temperature: COURSE_CONFIG.temperature,
            maxOutputTokens: COURSE_CONFIG.limits.maxOutputTokens,
        })

        return { text: result.text, modelName }
    } catch (error) {
        if (!fallbackModelName || fallbackModelName === modelName || !isProviderRateLimit(error)) {
            throw error
        }

        console.warn(`[chat] ${modelName} rate-limited, retrying with ${fallbackModelName}`)
        const fallbackModel = await getModel(fallbackModelName)
        const fallbackResult = await generateText({
            model: fallbackModel,
            system: systemPrompt,
            messages: [{ role: 'user', content: pregunta }],
            temperature: COURSE_CONFIG.temperature,
            maxOutputTokens: COURSE_CONFIG.limits.maxOutputTokens,
        })

        return { text: fallbackResult.text, modelName: fallbackModelName }
    }
}

function isProviderRateLimit(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error)

    return /rate limit|tokens per day|TPD|too many requests|429/i.test(message)
}
