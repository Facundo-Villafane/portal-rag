import { NextRequest, NextResponse } from 'next/server'
import { retrieveContext, constructSystemPrompt } from '@/lib/rag'
import { getModel } from '@/lib/llm'
import { COURSE_CONFIG } from '@/lib/course-config'
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

    const { pregunta } = valResult.data
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
        })

        return new Response(result.text, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'X-Content-Type-Options': 'nosniff',
                'X-Model-Used': modelName,
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
