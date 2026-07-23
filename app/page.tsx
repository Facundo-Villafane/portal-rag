import { ChatInterface } from '@/components/chat-interface'
import { COURSE_CONFIG } from '@/lib/course-config'

export default async function Home() {
    return (
        <main className="h-screen bg-[#fbf9ff] text-slate-950">
            <ChatInterface
                materiaId={COURSE_CONFIG.id}
                materiaNombre={COURSE_CONFIG.nombreMateria}
                botNombre={COURSE_CONFIG.nombreBot}
                welcomeMessage={COURSE_CONFIG.welcomeMessage}
                carreraNombre={COURSE_CONFIG.nombreCarrera}
                orgNombre={COURSE_CONFIG.nombreInstitucion}
                theme={COURSE_CONFIG.theme}
            />
        </main>
    )
}
