export const COURSE_CONFIG = {
    id: 'billetaje-y-reservas',
    nombreMateria: 'Billetaje y Reservas',
    nombreCarrera: 'Tecnicatura Universitaria en Gestión Aeronáutica',
    nombreInstitucion: 'Universidad',
    nombreBot: 'Asistente de Billetaje y Reservas',
    welcomeMessage: 'Hola, puedo ayudarte con el material de Billetaje y Reservas. ¿Qué querés consultar?',
    theme: 'blue',
    model: process.env.CHAT_MODEL || 'llama-3.3-70b-versatile',
    temperature: Number(process.env.CHAT_TEMPERATURE ?? 0.3),
    retriever: {
        topK: Number(process.env.RAG_TOP_K ?? 8),
        scoreThreshold: Number(process.env.RAG_SCORE_THRESHOLD ?? 0.08),
        knowledgeDir: process.env.KNOWLEDGE_DIR,
    },
}
