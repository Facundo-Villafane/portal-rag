import { FlagEmbedding, EmbeddingModel } from 'fastembed'

// Singleton instance to avoid reloading the model on every call
let embeddingModel: FlagEmbedding | null = null

async function getModel() {
    if (!embeddingModel) {
        console.log('Initializing FastEmbed model...')
        // Init with default model: BAAI/bge-small-en-v1.5
        // Lightweight and good performance
        embeddingModel = await FlagEmbedding.init({
            model: EmbeddingModel.BGESmallENV15
        })
    }
    return embeddingModel
}

export async function generateEmbedding(text: string): Promise<number[]> {
    const model = await getModel()
    const embeddings = model.embed([text]) // Async Generator
    for await (const batch of embeddings) {
        // fastembed returns Float32Array rows — convert to plain number[] for JSON serialization
        return Array.from(batch[0])
    }
    throw new Error('Failed to generate embedding')
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    const model = await getModel()
    const result: number[][] = []

    const embeddingsGenerator = model.embed(texts)

    for await (const batch of embeddingsGenerator) {
        // fastembed returns Float32Array rows — convert each to plain number[]
        for (const row of batch) {
            result.push(Array.from(row))
        }
    }

    return result
}
