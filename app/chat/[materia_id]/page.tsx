import { ChatInterface } from '@/components/chat-interface'

interface PageProps {
    params: Promise<{
        materia_id: string
    }>
}

export default async function ChatPage({ params }: PageProps) {
    const { materia_id } = await params

    // Optional: Fetch materia details server-side if needed for metadata

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <ChatInterface materiaId={materia_id} />
        </div>
    )
}
