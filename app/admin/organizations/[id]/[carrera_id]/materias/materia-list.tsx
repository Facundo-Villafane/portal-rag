'use client'

import { deleteMateria } from '@/lib/actions/materias'
import { Trash2, Book, FileText, Bot } from 'lucide-react'
import { useState, useTransition } from 'react'
import Link from 'next/link'

export function MateriaList({ initialMaterias, orgId, carreraId }: { initialMaterias: any[], orgId: string, carreraId: string }) {
    const [isPending, startTransition] = useTransition()

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta materia? Se eliminará todo su contenido y conocimiento asociado.')) return

        startTransition(async () => {
            await deleteMateria(id, orgId, carreraId)
        })
    }

    if (initialMaterias.length === 0) {
        return (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Book className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">No hay materias registradas</h3>
                <p className="text-slate-500 mt-1">Crea una materia para empezar a cargar contenido.</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {initialMaterias.map((materia) => (
                <div key={materia.materia_id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {materia.carrera?.nombre || 'Sin Carrera'}
                        </div>
                        <button
                            onClick={() => handleDelete(materia.materia_id)}
                            disabled={isPending}
                            className="text-slate-400 hover:text-red-600 transition-colors p-2"
                            title="Eliminar Materia"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>

                    <h3 className="text-xl font-bold text-slate-800 mb-1">{materia.nombre}</h3>
                    <p className="text-xs text-slate-400 mb-4 font-mono">{materia.materia_id}</p>

                    <div className="mt-auto space-y-3 pt-4 border-t border-slate-100">
                        <Link
                            href={`/admin/organizations/${orgId}/${carreraId}/materias/${materia.materia_id}/ingest`}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group"
                        >
                            <span className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                                <FileText className="w-4 h-4 text-blue-500" />
                                Gestionar Contenido
                            </span>
                            <span className="text-slate-400 group-hover:text-blue-600 text-xs">Ingresar &rarr;</span>
                        </Link>

                        <Link
                            href={`/chat/${materia.materia_id}`}
                            target="_blank"
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group"
                        >
                            <span className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                                <Bot className="w-4 h-4 text-purple-500" />
                                Probar Chat
                            </span>
                            <span className="text-slate-400 group-hover:text-purple-600 text-xs">Abrir &rarr;</span>
                        </Link>
                    </div>
                </div>
            ))}
        </div>
    )
}
