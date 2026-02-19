'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const CarreraSchema = z.object({
    nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    codigo: z.string().min(1, 'El código es requerido').max(20, 'Máximo 20 caracteres').regex(/^[A-Z0-9\-]+$/, 'Solo mayúsculas, números y guiones'),
})

export async function getCarreras(org_id: string) {
    const supabase = await createClient()

    const { data: carreras, error } = await supabase
        .from('carrera')
        .select('*')
        .eq('org_id', org_id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching carreras:', error)
        return []
    }

    return carreras
}

export async function createCarrera(prevState: any, formData: FormData) {
    const supabase = await createClient()
    const org_id = formData.get('org_id') as string

    const validatedFields = CarreraSchema.safeParse({
        nombre: formData.get('nombre'),
        codigo: formData.get('codigo'),
    })

    if (!validatedFields.success) {
        return {
            error: validatedFields.error.flatten().fieldErrors,
            message: 'Faltan campos requeridos o son inválidos',
        }
    }

    const { data: newCarrera, error } = await supabase.from('carrera').insert({
        nombre: validatedFields.data.nombre,
        codigo: validatedFields.data.codigo,
        org_id: org_id
    }).select('carrera_id').single()

    if (error) {
        return { message: 'Error al crear la carrera: ' + error.message }
    }

    revalidatePath(`/admin/organizations/${org_id}/carreras`)
    return { message: 'Carrera creada exitosamente', success: true, carreraId: newCarrera.carrera_id }
}

export async function deleteCarrera(carrera_id: string, org_id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('carrera')
        .delete()
        .eq('carrera_id', carrera_id)

    if (error) {
        return { message: 'Error al eliminar: ' + error.message }
    }

    revalidatePath(`/admin/organizations/${org_id}/carreras`)
    return { message: 'Eliminado correctamente', success: true }
}
