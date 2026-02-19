/**
 * Embeddings via Groq API (nomic-embed-text-v1.5, 768 dims)
 * Replaces local fastembed (too large for Vercel serverless, ~200MB+)
 */

const GROQ_EMBEDDINGS_URL = 'https://api.groq.com/openai/v1/embeddings'
const EMBEDDING_MODEL = 'nomic-embed-text-v1.5'

async function callGroqEmbeddings(inputs: string[]): Promise<number[][]> {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) throw new Error('GROQ_API_KEY not set')

    const res = await fetch(GROQ_EMBEDDINGS_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model: EMBEDDING_MODEL, input: inputs }),
    })

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`Groq embeddings error ${res.status}: ${err}`)
    }

    const json = await res.json()
    // Sort by index to maintain input order
    return (json.data as { index: number; embedding: number[] }[])
        .sort((a, b) => a.index - b.index)
        .map(d => d.embedding)
}

export async function generateEmbedding(text: string): Promise<number[]> {
    const results = await callGroqEmbeddings([text])
    return results[0]
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    // Groq allows up to 96 inputs per request
    const BATCH_SIZE = 96
    const all: number[][] = []

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        const batch = texts.slice(i, i + BATCH_SIZE)
        const embeddings = await callGroqEmbeddings(batch)
        all.push(...embeddings)
    }

    return all
}
