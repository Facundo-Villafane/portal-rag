/**
 * Embeddings via Hugging Face Inference API
 * Model: sentence-transformers/all-MiniLM-L6-v2 (384 dims)
 * Free tier — no key required, or set HF_TOKEN for higher rate limits.
 */

const HF_MODEL = 'sentence-transformers/all-MiniLM-L6-v2'
const HF_URL   = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}/pipeline/feature-extraction`

async function callHFEmbeddings(inputs: string[]): Promise<number[][]> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (process.env.HF_TOKEN) headers['Authorization'] = `Bearer ${process.env.HF_TOKEN}`

    const res = await fetch(HF_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ inputs }),
    })

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`HF embeddings error ${res.status}: ${err}`)
    }

    // HF returns number[][] directly
    const json = await res.json() as number[][]
    return json
}

export async function generateEmbedding(text: string): Promise<number[]> {
    const results = await callHFEmbeddings([text])
    return results[0]
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    // HF Inference allows batches; keep reasonable size to avoid timeouts
    const BATCH_SIZE = 32
    const all: number[][] = []

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        const batch = texts.slice(i, i + BATCH_SIZE)
        const embeddings = await callHFEmbeddings(batch)
        all.push(...embeddings)
    }

    return all
}
