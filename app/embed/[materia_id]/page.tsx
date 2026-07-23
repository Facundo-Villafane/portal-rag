import { COURSE_CONFIG } from '@/lib/course-config'
import { EmbedLayout } from './embed-layout'

export default async function EmbedPage() {
    return (
        <div className="h-screen w-full overflow-hidden">
            <EmbedLayout
                materiaId={COURSE_CONFIG.id}
                materiaNombre={COURSE_CONFIG.nombreMateria}
                botNombre={COURSE_CONFIG.nombreBot}
                welcomeMessage={COURSE_CONFIG.welcomeMessage}
                orgNombre={COURSE_CONFIG.nombreInstitucion}
                carreraNombre={COURSE_CONFIG.nombreCarrera}
                theme={COURSE_CONFIG.theme}
            />
        </div>
    )
}
