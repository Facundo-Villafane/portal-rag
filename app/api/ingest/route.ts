import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chunkText } from '@/lib/chunking'
import { generateEmbeddings } from '@/lib/embeddings'
import { revalidatePath } from 'next/cache'

async function extractTextFromFile(file: File): Promise<string> {
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const buffer = Buffer.from(await file.arrayBuffer())
        // Require the inner lib directly to bypass webpack's module namespace wrapping
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse: (buf: Buffer) => Promise<{ text: string }> = require('pdf-parse/lib/pdf-parse.js')
        const parsed = await pdfParse(buffer)
        if (!parsed.text?.trim()) throw new Error('El PDF no tiene texto extraíble (puede ser una imagen escaneada)')
        return parsed.text
    }
    // txt / md
    return await file.text()
}

export async function GET(req: NextRequest) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { data: userData } = await supabase
        .from('app_user')
        .select('rol, org_id')
        .eq('user_id', user.id)
        .single()

    if (!userData || !['admin', 'superadmin', 'profesor'].includes(userData.rol)) {
        return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const materia_id = searchParams.get('materia_id')
    const titulo = searchParams.get('titulo')

    if (!materia_id || !titulo) {
        return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    // Verify org ownership
    const { data: materia } = await supabase
        .from('materia')
        .select('org_id')
        .eq('materia_id', materia_id)
        .single()

    if (!materia) return NextResponse.json({ error: 'Materia no encontrada' }, { status: 404 })
    if (userData.rol !== 'superadmin' && materia.org_id !== userData.org_id) {
        return NextResponse.json({ error: 'Sin permisos para esta materia' }, { status: 403 })
    }

    // Fetch all chunks for this document, ordered by chunk_index
    const { data: entries, error } = await supabase
        .from('knowledge_entry')
        .select('contenido, metadata')
        .eq('materia_id', materia_id)
        .eq('titulo', titulo)
        .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Sort by chunk_index from metadata if available, then join
    const sorted = (entries || []).sort((a, b) => {
        const ai = (a.metadata as { chunk_index?: number })?.chunk_index ?? 0
        const bi = (b.metadata as { chunk_index?: number })?.chunk_index ?? 0
        return ai - bi
    })
    const contenido = sorted.map(e => e.contenido).join('\n\n')

    return NextResponse.json({ contenido })
}

export async function POST(req: NextRequest) {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: userData } = await supabase
        .from('app_user')
        .select('rol, org_id')
        .eq('user_id', user.id)
        .single()

    if (!userData || !['admin', 'superadmin', 'profesor'].includes(userData.rol)) {
        return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const contentType = req.headers.get('content-type') || ''
    let materia_id: string
    let titulo: string
    let contenido: string

    try {
        if (contentType.includes('multipart/form-data')) {
            const formData = await req.formData()
            materia_id = formData.get('materia_id') as string
            titulo = formData.get('titulo') as string
            const file = formData.get('file') as File | null

            if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })
            if (!materia_id) return NextResponse.json({ error: 'Falta materia_id' }, { status: 400 })
            if (!titulo) return NextResponse.json({ error: 'Falta título' }, { status: 400 })

            contenido = await extractTextFromFile(file)
        } else {
            // JSON path (text templates)
            const json = await req.json()
            materia_id = json.materia_id
            titulo = json.titulo
            contenido = json.contenido
        }
    } catch (e) {
        console.error('[ingest] parse error:', e)
        return NextResponse.json({
            error: e instanceof Error ? e.message : 'Error procesando el archivo'
        }, { status: 400 })
    }

    if (!materia_id || !titulo || !contenido?.trim()) {
        return NextResponse.json({ error: 'Faltan campos requeridos (materia_id, titulo, contenido)' }, { status: 400 })
    }

    const { data: materia } = await supabase
        .from('materia')
        .select('org_id')
        .eq('materia_id', materia_id)
        .single()

    if (!materia) return NextResponse.json({ error: 'Materia no encontrada' }, { status: 404 })

    if (userData.rol !== 'superadmin' && materia.org_id !== userData.org_id) {
        return NextResponse.json({ error: 'Sin permisos para esta materia' }, { status: 403 })
    }

    try {
        const chunks = chunkText(contenido)
        const embeddings = await generateEmbeddings(chunks)

        const entries = chunks.map((chunk, i) => ({
            org_id: materia.org_id,
            materia_id,
            titulo,
            contenido: chunk,
            vector_embedding: embeddings[i],
            metadata: { source_title: titulo, chunk_index: i },
            tokens_estimados: Math.ceil(chunk.length / 4),
        }))

        const { error: insertError } = await supabase.from('knowledge_entry').insert(entries)

        if (insertError) {
            console.error('[ingest] insert error:', insertError)
            return NextResponse.json({ error: 'Error al guardar en base de datos', details: insertError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, chunks_created: chunks.length })
    } catch (error) {
        console.error('[ingest] processing error:', error)
        return NextResponse.json({
            error: 'Error al procesar el contenido',
            details: error instanceof Error ? error.message : 'Unknown'
        }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { data: userData } = await supabase
        .from('app_user')
        .select('rol, org_id')
        .eq('user_id', user.id)
        .single()

    if (!userData || !['admin', 'superadmin', 'profesor'].includes(userData.rol)) {
        return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const { materia_id, titulo } = await req.json()

    if (!materia_id || !titulo) {
        return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    // Verify org ownership (same check as POST)
    const { data: materia } = await supabase
        .from('materia')
        .select('org_id, carrera_id')
        .eq('materia_id', materia_id)
        .single()

    if (!materia) return NextResponse.json({ error: 'Materia no encontrada' }, { status: 404 })

    if (userData.rol !== 'superadmin' && materia.org_id !== userData.org_id) {
        return NextResponse.json({ error: 'Sin permisos para esta materia' }, { status: 403 })
    }

    const { error, count } = await supabase
        .from('knowledge_entry')
        .delete({ count: 'exact' })
        .eq('materia_id', materia_id)
        .eq('titulo', titulo)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (count === 0) return NextResponse.json({ error: 'Documento no encontrado o ya eliminado' }, { status: 404 })

    // Invalidate the ingest page cache so router.refresh() sees fresh data
    revalidatePath(`/admin/organizations/${materia.org_id}`, 'layout')

    return NextResponse.json({ success: true, deleted: count })
}
