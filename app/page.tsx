'use client'

import Link from 'next/link'
import { Shield, BookOpen, ArrowRight, Zap, Network, GraduationCap } from 'lucide-react'
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
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-white">

      {/* Header */}
      <header className="border-b border-slate-800 sticky top-0 z-10 bg-slate-950/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-cyan-400 to-violet-600 rounded-lg" />
              <div className="relative w-full h-full flex items-center justify-center">
                <Network className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="leading-tight">
              <span className="font-bold text-base text-white tracking-tight">Codisea </span>
              <span className="font-bold text-base bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent tracking-tight">Nexus</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/admin" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Panel Admin
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg transition-colors"
            >
              Iniciar sesión
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-36">
          <div className="text-center max-w-3xl mx-auto space-y-8">

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950 text-cyan-400 text-sm font-medium border border-cyan-900">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
              </span>
              AI Knowledge Hub for Education
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
              Asistentes de IA{' '}
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
                contextuales
              </span>{' '}
              para tu universidad
            </h1>

            <p className="text-xl text-slate-400 leading-relaxed">
              Conectá el conocimiento de tus materias con modelos de lenguaje avanzados.
              Respondés dudas de alumnos 24/7, basándote exclusivamente en tu material académico.
            </p>

            {/* Quick access */}
            <div className="mt-8">
              <form onSubmit={handleChatNavigation} className="flex w-full max-w-md mx-auto gap-2 p-2 bg-slate-900 rounded-full border border-slate-700 focus-within:ring-2 focus-within:ring-cyan-500 focus-within:border-transparent transition-all">
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

            <div className="pt-4 flex justify-center gap-6 text-sm text-slate-500">
              <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-slate-600" /> Acceso seguro</span>
              <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-slate-600" /> Fuentes verificadas</span>
              <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-slate-600" /> Respuesta instantánea</span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 border-t border-slate-800 pt-16">
          <p className="text-center text-xs font-semibold text-slate-500 uppercase tracking-widest mb-12">Infraestructura de IA para instituciones educativas</p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 hover:border-blue-800 transition-colors group">
              <div className="w-11 h-11 bg-blue-950 rounded-xl flex items-center justify-center mb-5 text-blue-400 group-hover:bg-blue-900 transition-colors">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-white">RAG por Materia</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Cada asistente responde exclusivamente con el material bibliográfico cargado por el docente. Sin alucinaciones fuera de contexto.</p>
            </div>
            <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 hover:border-cyan-800 transition-colors group">
              <div className="w-11 h-11 bg-cyan-950 rounded-xl flex items-center justify-center mb-5 text-cyan-400 group-hover:bg-cyan-900 transition-colors">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-white">Multi-Institución</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Arquitectura multi-tenant. Cada universidad tiene su espacio aislado con carreras, materias y usuarios independientes.</p>
            </div>
            <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 hover:border-violet-800 transition-colors group">
              <div className="w-11 h-11 bg-violet-950 rounded-xl flex items-center justify-center mb-5 text-violet-400 group-hover:bg-violet-900 transition-colors">
                <Network className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-white">Integración LMS</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Embebé cualquier asistente en Moodle, Notion o cualquier plataforma vía iframe. Los alumnos acceden sin crear cuenta.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-600 text-xs">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-slate-700" />
            <span className="font-medium text-slate-500">Codisea Nexus</span>
          </div>
          <p>&copy; {new Date().getFullYear()} Codisea. Todos los derechos reservados.</p>
          <p className="text-slate-700">nexus.codisea.dev</p>
        </div>
      </footer>
    </div>
  )
}
