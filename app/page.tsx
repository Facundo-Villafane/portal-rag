'use client'

import Link from 'next/link'
import { Bot, Shield, BookOpen, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [materiaId, setMateriaId] = useState('')
  const router = useRouter()

  const handleChatNavigation = (e: React.FormEvent) => {
    e.preventDefault()
    if (materiaId.trim()) {
      router.push(`/chat/${materiaId}`)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">

      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">EduChat Portal</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="/admin" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
              Panel Admin
            </Link>
            <a href="#" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
              Documentación
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center max-w-3xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Sistema RAG Educativo Activo
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900">
              Tu Asistente Universitario <span className="text-blue-600">Inteligente</span>
            </h1>

            <p className="text-xl text-slate-600 leading-relaxed">
              Accede a contenido de tus materias, haz preguntas y obtén respuestas instantáneas basadas en tus documentos de estudio. Potenciado por Inteligencia Artificial.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
              {/* Quick Access Form */}
              <form onSubmit={handleChatNavigation} className="flex w-full max-w-md gap-2 p-2 bg-white rounded-full shadow-lg border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
                <input
                  type="text"
                  placeholder="Ingresa ID de Materia (UUID)"
                  className="flex-1 px-4 py-2 bg-transparent focus:outline-none text-slate-800 placeholder:text-slate-400"
                  value={materiaId}
                  onChange={(e) => setMateriaId(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={!materiaId.trim()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  Ir al Chat <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            <div className="pt-8 flex justify-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1"><Shield className="w-4 h-4" /> Acceso seguro</span>
              <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> Base de conocimiento verificada</span>
            </div>
          </div>
        </div>

        {/* Features Grid (Optional Visuals) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-200">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 text-indigo-600">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Fuentes Confiables</h3>
              <p className="text-slate-600">Respuestas generadas exclusivamente a partir de material bibliográfico cargado por tus profesores.</p>
            </div>
            <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 text-emerald-600">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Disponibilidad 24/7</h3>
              <p className="text-slate-600">Tu asistente personal disponible en cualquier momento para resolver dudas antes del examen.</p>
            </div>
            <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4 text-amber-600">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Privacidad Total</h3>
              <p className="text-slate-600">Tus interacciones son privadas y seguras. El acceso está restringido a tu organización.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-500">
          <p>&copy; 2024 Portal de Chatbots Educativos. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
