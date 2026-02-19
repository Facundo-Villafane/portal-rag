'use client'

import { deleteCarrera } from '@/lib/actions/carreras'
import { Trash2, BookOpen, GraduationCap } from 'lucide-react'
import { useState, useTransition } from 'react'

import Link from 'next/link'

export function CarreraList({ initialCarreras, orgId }: { initialCarreras: any[], orgId: string }) {
    const [isPending, startTransition] = useTransition()

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta carrera? Se eliminarán también sus materias y contenidos.')) return

        startTransition(async () => {
            await deleteCarrera(id, orgId)
        })
    }

    if (initialCarreras.length === 0) {
        return (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <GraduationCap className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">No hay carreras registradas</h3>
                <p className="text-slate-500 mt-1">Comienza creando la primera carrera para tu universidad.</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {initialCarreras.map((carrera) => (
                <div key={carrera.carrera_id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                            <GraduationCap className="w-6 h-6" />
                        </div>
                        <button
                            onClick={() => handleDelete(carrera.carrera_id)}
                            disabled={isPending}
                            className="text-slate-400 hover:text-red-600 transition-colors p-2"
                            title="Eliminar Carrera"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>

                    <h3 className="text-xl font-bold text-slate-800 mb-2">{carrera.nombre}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px]">
                        {carrera.contexto_global || 'Sin descripción contextual definida.'}
                    </p>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
                        <span className="text-slate-500">ID: {carrera.carrera_id.slice(0, 8)}...</span>

                        <Link
                            href={`/admin/organizations/${orgId}/${carrera.carrera_id}/materias`}
                            className="text-blue-600 font-medium flex items-center gap-1 cursor-pointer hover:underline"
                        >
                            Ver Materias <BookOpen className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            ))}
        </div>
    )
}
