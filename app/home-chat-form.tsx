'use client'

import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function HomeChatForm() {
    const [materiaId, setMateriaId] = useState('')
    const router = useRouter()

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (materiaId.trim()) router.push(`/chat/${materiaId}`)
    }

    return (
        <div className="mt-8">
            <form onSubmit={handleSubmit} className="flex w-full max-w-md mx-auto gap-2 p-2 bg-slate-900 rounded-full border border-slate-700 focus-within:ring-2 focus-within:ring-cyan-500 focus-within:border-transparent transition-all">
                <input
                    type="text"
                    placeholder="ID de Materia (UUID)"
                    className="flex-1 px-4 py-2 bg-transparent focus:outline-none text-slate-200 placeholder:text-slate-500 text-sm"
                    value={materiaId}
                    onChange={(e) => setMateriaId(e.target.value)}
                />
                <button
                    type="submit"
                    disabled={!materiaId.trim()}
                    className="bg-gradient-to-r from-blue-600 to-violet-600 text-white px-5 py-2 rounded-full font-medium hover:from-blue-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-sm"
                >
                    Ir al Chat <ArrowRight className="w-4 h-4" />
                </button>
            </form>
            <p className="mt-3 text-xs text-slate-600">Acceso directo al asistente de una materia — sin cuenta requerida</p>
        </div>
    )
}
