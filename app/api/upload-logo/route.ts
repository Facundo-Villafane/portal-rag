import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: userData } = await supabase
        .from('app_user')
        .select('rol')
        .eq('user_id', user.id)
        .single()

    if (userData?.rol !== 'superadmin') {
        return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
        return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })
    }

    // Validate type and size (max 2MB)
    const allowed = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
    if (!allowed.includes(file.type)) {
        return NextResponse.json({ error: 'Formato no permitido. Usar PNG, JPG, SVG o WebP.' }, { status: 400 })
    }
    if (file.size > 2 * 1024 * 1024) {
        return NextResponse.json({ error: 'El archivo supera el límite de 2MB.' }, { status: 400 })
    }

    const ext = file.name.split('.').pop() || 'png'
    const filename = `${user.id}-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filename, file, { contentType: file.type, upsert: false })

    if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filename)

    return NextResponse.json({ url: publicUrl })
}
