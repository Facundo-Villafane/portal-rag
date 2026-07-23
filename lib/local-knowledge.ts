import { readdir, readFile } from 'fs/promises'
import path from 'path'
import type { ContextItem } from './rag'
import { COURSE_CONFIG } from './course-config'

interface KnowledgeChunk {
    entry_id: string
    content: string
    metadata: {
        source: string
        title: string
        chunk: number
    }
    tokens: Set<string>
}

const DEFAULT_KNOWLEDGE_DIR = path.join(process.cwd(), 'content', 'knowledge')
const MIN_CHUNK_LENGTH = 400
const MAX_CHUNK_LENGTH = 1800

const STOPWORDS = new Set([
    'ante', 'bajo', 'con', 'contra', 'del', 'desde', 'durante', 'ella', 'entre',
    'esa', 'ese', 'eso', 'esta', 'este', 'esto', 'las', 'los', 'mas', 'para',
    'pero', 'por', 'que', 'sin', 'sus', 'una', 'unas', 'unos',
])

let cachedChunks: Promise<KnowledgeChunk[]> | null = null

export async function retrieveLocalContext(
    query: string,
    topK = 8,
    threshold = 0.08,
): Promise<ContextItem[]> {
    const chunks = await loadKnowledgeChunks()
    const queryTokens = tokenize(query)

    if (queryTokens.length === 0) return []

    return chunks
        .map((chunk) => ({
            chunk,
            similarity: scoreChunk(query, queryTokens, chunk),
        }))
        .filter(({ similarity }) => similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK)
        .map(({ chunk, similarity }) => ({
            entry_id: chunk.entry_id,
            content: `Fuente: ${chunk.metadata.title}\n\n${chunk.content}`,
            metadata: chunk.metadata,
            similarity,
        }))
}

async function loadKnowledgeChunks(): Promise<KnowledgeChunk[]> {
    cachedChunks ??= buildKnowledgeChunks()
    return cachedChunks
}

async function buildKnowledgeChunks(): Promise<KnowledgeChunk[]> {
    const knowledgeDir = resolveKnowledgeDir(COURSE_CONFIG.retriever.knowledgeDir)
    const files = await listKnowledgeFiles(knowledgeDir)
    const chunks: KnowledgeChunk[] = []

    for (const file of files) {
        const raw = await readFile(file, 'utf8')
        const text = file.toLowerCase().match(/\.html?$/) ? htmlToText(raw) : raw
        const title = resolveTitle(text, file)
        const relativePath = path.relative(knowledgeDir, file) || path.basename(file)

        chunkMarkdown(text).forEach((content, index) => {
            chunks.push({
                entry_id: `${relativePath}#${index + 1}`,
                content,
                metadata: {
                    source: relativePath,
                    title,
                    chunk: index + 1,
                },
                tokens: new Set(tokenize(`${title}\n${content}`)),
            })
        })
    }

    return chunks
}

function resolveKnowledgeDir(configuredDir?: string): string {
    if (!configuredDir) return DEFAULT_KNOWLEDGE_DIR
    return path.isAbsolute(configuredDir)
        ? configuredDir
        : path.join(process.cwd(), configuredDir)
}

async function listKnowledgeFiles(dir: string): Promise<string[]> {
    const entries = await readdir(dir, { withFileTypes: true })
    const files = await Promise.all(entries.map(async (entry) => {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) return listKnowledgeFiles(fullPath)
        return entry.isFile() && isKnowledgeFile(entry.name) ? [fullPath] : []
    }))

    return files.flat().sort()
}

function isKnowledgeFile(fileName: string): boolean {
    return ['.md', '.html', '.htm'].includes(path.extname(fileName).toLowerCase())
}

function chunkMarkdown(text: string): string[] {
    const normalized = text
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()

    const sections = normalized
        .split(/\n(?=#{1,4}\s+)/g)
        .map((section) => section.trim())
        .filter(Boolean)

    const chunks: string[] = []
    let current = ''

    for (const section of sections) {
        if (!current) {
            current = section
            continue
        }

        if (current.length + section.length + 2 <= MAX_CHUNK_LENGTH) {
            current += `\n\n${section}`
        } else {
            chunks.push(...splitLargeSection(current))
            current = section
        }
    }

    if (current) chunks.push(...splitLargeSection(current))

    return chunks.filter((chunk) => chunk.length >= MIN_CHUNK_LENGTH || chunks.length === 1)
}

function splitLargeSection(section: string): string[] {
    if (section.length <= MAX_CHUNK_LENGTH) return [section]

    const paragraphs = section.split(/\n\n+/g).map((p) => p.trim()).filter(Boolean)
    const chunks: string[] = []
    let current = ''

    for (const paragraph of paragraphs) {
        if (!current) {
            current = paragraph
            continue
        }

        if (current.length + paragraph.length + 2 <= MAX_CHUNK_LENGTH) {
            current += `\n\n${paragraph}`
        } else {
            chunks.push(current)
            current = paragraph
        }
    }

    if (current) chunks.push(current)
    return chunks
}

function resolveTitle(text: string, file: string): string {
    const heading = text.match(/^#\s+(.+)$/m)?.[1]?.trim()
    if (heading) return heading

    return path
        .basename(file, path.extname(file))
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

function htmlToText(html: string): string {
    return decodeHtmlEntities(html)
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<!--[\s\S]*?-->/g, ' ')
        .replace(/<\/(h[1-6]|p|div|section|article|li|tr|blockquote)>/gi, '\n\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<li[^>]*>/gi, '- ')
        .replace(/<h([1-6])[^>]*>/gi, '\n# ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n[ \t]+/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}

function decodeHtmlEntities(text: string): string {
    return text
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&aacute;/gi, 'á')
        .replace(/&eacute;/gi, 'é')
        .replace(/&iacute;/gi, 'í')
        .replace(/&oacute;/gi, 'ó')
        .replace(/&uacute;/gi, 'ú')
        .replace(/&ntilde;/gi, 'ñ')
        .replace(/&Aacute;/g, 'Á')
        .replace(/&Eacute;/g, 'É')
        .replace(/&Iacute;/g, 'Í')
        .replace(/&Oacute;/g, 'Ó')
        .replace(/&Uacute;/g, 'Ú')
        .replace(/&Ntilde;/g, 'Ñ')
}

function scoreChunk(query: string, queryTokens: string[], chunk: KnowledgeChunk): number {
    const uniqueQueryTokens = Array.from(new Set(queryTokens))
    let matches = 0

    for (const token of uniqueQueryTokens) {
        if (chunk.tokens.has(token)) matches += 1
    }

    const normalizedContent = normalize(chunk.content)
    const normalizedTitle = normalize(chunk.metadata.title)
    const normalizedQuery = normalize(query)
    const phraseBoost = normalizedQuery.length > 5 && normalizedContent.includes(normalizedQuery) ? 0.35 : 0
    const titleBoost = uniqueQueryTokens.some((token) => normalizedTitle.includes(token)) ? 0.15 : 0

    return matches / Math.max(uniqueQueryTokens.length, 1) + phraseBoost + titleBoost
}

function tokenize(text: string): string[] {
    return normalize(text)
        .split(/[^a-z0-9]+/g)
        .filter((token) => token.length > 2 && !STOPWORDS.has(token))
}

function normalize(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
}
