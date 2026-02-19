'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const MateriaSchema = z.object({
    nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    carrera_id: z.string().uuid('Debe seleccionar una carrera válida'),
    custom_prompt: z.string().optional(),
})

export async function getMaterias(carrera_id: string) {
    const supabase = await createClient()

    // Get current user to check role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: userData } = await supabase
        .from('app_user')
        .select('rol, user_id')
        .eq('user_id', user.id)
        .single()

    let query = supabase
        .from('materia')
        .select(`
      *,
      carrera:carrera_id (
        nombre
      )
    `)
        .eq('carrera_id', carrera_id) // Filter by specific carrera
        .order('created_at', { ascending: false })

    // If professor, only show assigned subjects (extra safety)
    if (userData?.rol === 'profesor') {
        query = query.eq('profesor_id', user.id)
    }

    const { data: materias, error } = await query

    if (error) {
        console.error('Error fetching materias:', error)
        return []
    }

    return materias
}

export async function createMateria(prevState: any, formData: FormData) {
    const supabase = await createClient()
    const org_id = formData.get('org_id') as string

    const validatedFields = MateriaSchema.safeParse({
        nombre: formData.get('nombre'),
        carrera_id: formData.get('carrera_id'),
        custom_prompt: formData.get('custom_prompt'),
    })

    if (!validatedFields.success) {
        return {
            error: validatedFields.error.flatten().fieldErrors,
            message: 'Faltan campos requeridos o son inválidos',
        }
    }

    const { error } = await supabase.from('materia').insert({
        nombre: validatedFields.data.nombre,
        carrera_id: validatedFields.data.carrera_id,
        custom_prompt: validatedFields.data.custom_prompt,
        org_id: org_id,
        // Defaults
        modelo_seleccionado: 'llama-3.3-70b-versatile',
        config_bot: {},
        retriever_config: { top_k: 4 }
    })

    if (error) {
        return { message: 'Error al crear la materia: ' + error.message }
    }

    revalidatePath(`/admin/organizations/${org_id}/${validatedFields.data.carrera_id}/materias`)
    return { message: 'Materia creada exitosamente', success: true }
}

export async function saveMateriaConfig(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const materia_id = formData.get('materia_id') as string
    const org_id = formData.get('org_id') as string
    const carrera_id = formData.get('carrera_id') as string
    const welcome_message = (formData.get('welcome_message') as string) || ''
    const nombre_bot = (formData.get('nombre_bot') as string) || ''
    const theme = (formData.get('theme') as string) || 'blue'

    if (!materia_id) return { message: 'Falta materia_id' }

    // Determine caller's role and org permission level
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { message: 'No autenticado' }

    const { data: userData } = await supabase
        .from('app_user')
        .select('rol')
        .eq('user_id', user.id)
        .single()

    const isAdmin = userData?.rol === 'admin' || userData?.rol === 'superadmin'

    // Check if org allows professors to edit advanced config
    let canEditAdvanced = isAdmin
    if (!isAdmin && userData?.rol === 'profesor') {
        const { data: org } = await supabase
            .from('organization')
            .select('config_global')
            .eq('org_id', org_id)
            .single()
        canEditAdvanced = org?.config_global?.profesores_config_avanzada === true
    }

    // Build update payload — advanced fields only if authorized
    const updatePayload: Record<string, unknown> = {
        config_bot: {
            welcome_message,
            nombre_bot: nombre_bot || null,
            theme,
            ...(canEditAdvanced && {
                temperatura: parseFloat(formData.get('temperatura') as string) || 0.3,
            }),
        },
    }

    if (canEditAdvanced) {
        const custom_prompt = (formData.get('custom_prompt') as string) || ''
        const modelo_seleccionado = (formData.get('modelo_seleccionado') as string) || 'llama-3.3-70b-versatile'
        updatePayload.custom_prompt = custom_prompt || null
        updatePayload.modelo_seleccionado = modelo_seleccionado
    }

    const { error, data: updated } = await supabase
        .from('materia')
        .update(updatePayload)
        .eq('materia_id', materia_id)
        .select('materia_id')

    if (error) return { message: 'Error al guardar: ' + error.message }
    if (!updated || updated.length === 0) return { message: 'No se encontró la materia o no tenés permiso para editarla' }

    revalidatePath(`/admin/organizations/${org_id}/${carrera_id}/materias/${materia_id}/config`)
    return { message: 'Configuración guardada', success: true }
}

export async function deleteMateria(materia_id: string, org_id: string, carrera_id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('materia')
        .delete()
        .eq('materia_id', materia_id)

    if (error) {
        return { message: 'Error al eliminar: ' + error.message }
    }

    revalidatePath(`/admin/organizations/${org_id}/${carrera_id}/materias`)
    return { message: 'Eliminado correctamente', success: true }
}
