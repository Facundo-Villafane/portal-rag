/**
 * Smart text chunking following SDD Section 3.2 specifications:
 * - Chunk size: 400-800 tokens
 * - Overlap: 10-15% of chunk size
 * - Priority: Titles → Subtitles → Paragraphs → Lists
 * - Preserve semantic coherence
 * - Don't split formulas or definitions
 */

interface ChunkOptions {
    minTokens?: number
    maxTokens?: number
    overlapPercent?: number
}

const DEFAULT_OPTIONS: Required<ChunkOptions> = {
    minTokens: 400,
    maxTokens: 800,
    overlapPercent: 12.5, // 10-15% range, using middle value
}

export function chunkText(text: string, options: ChunkOptions = {}): string[] {
    const { minTokens, maxTokens, overlapPercent } = { ...DEFAULT_OPTIONS, ...options }

    // Token approximation: 1 token ≈ 4 characters
    const CHARS_PER_TOKEN = 4
    const maxChars = maxTokens * CHARS_PER_TOKEN

    // If text fits in a single chunk, don't split it — preserves structured content like temarios
    if (text.length <= maxChars) {
        const trimmed = text.trim()
        return trimmed.length > 100 ? [trimmed] : []
    }
    const minChars = minTokens * CHARS_PER_TOKEN
    const overlapChars = Math.floor(maxChars * (overlapPercent / 100))

    const chunks: string[] = []
    let position = 0

    while (position < text.length) {
        let chunkEnd = Math.min(position + maxChars, text.length)

        // If this is the last chunk and it's large enough, take it all
        if (chunkEnd === text.length) {
            const finalChunk = text.slice(position).trim()
            if (finalChunk.length > 0) {
                chunks.push(finalChunk)
            }
            break
        }

        // Find optimal break point using priority hierarchy
        const breakPoint = findOptimalBreakPoint(
            text,
            position,
            chunkEnd,
            minChars
        )

        // Extract chunk
        const chunk = text.slice(position, breakPoint).trim()
        if (chunk.length > 0) {
            chunks.push(chunk)
        }

        // Move position with overlap (10-15% of chunk size)
        const newPosition = breakPoint - overlapChars

        // Ensure we always make progress
        if (newPosition <= position && chunks.length > 0) {
            position = breakPoint
        } else {
            position = Math.max(newPosition, 0)
        }
    }

    return chunks.filter(chunk => chunk.length > 100) // Remove tiny chunks
}

/**
 * Finds optimal break point following priority:
 * 1. Title markers (##, #, etc.)
 * 2. Double newline (paragraph break)
 * 3. Single newline
 * 4. Sentence end (. ! ?)
 * 5. Comma or semicolon
 * 6. Space
 */
function findOptimalBreakPoint(
    text: string,
    start: number,
    idealEnd: number,
    minLength: number
): number {
    const searchWindow = text.slice(start, idealEnd)
    const minBreakPoint = start + minLength

    // Priority 1: Title markers (Markdown headers)
    const titleMatch = searchWindow.match(/\n#{1,6}\s/g)
    if (titleMatch) {
        const lastTitleIndex = searchWindow.lastIndexOf(titleMatch[titleMatch.length - 1])
        if (lastTitleIndex > minLength) {
            return start + lastTitleIndex
        }
    }

    // Priority 2: Paragraph breaks (double newline)
    const paragraphIndex = searchWindow.lastIndexOf('\n\n')
    if (paragraphIndex > minLength) {
        return start + paragraphIndex + 2
    }

    // Priority 3: List items or single newlines
    const newlineIndex = searchWindow.lastIndexOf('\n')
    if (newlineIndex > minLength) {
        return start + newlineIndex + 1
    }

    // Priority 4: Sentence endings
    const sentencePattern = /[.!?]\s+/g
    let lastSentenceEnd = -1
    let match
    while ((match = sentencePattern.exec(searchWindow)) !== null) {
        if (start + match.index > minBreakPoint) {
            lastSentenceEnd = match.index + match[0].length
        }
    }
    if (lastSentenceEnd > minLength) {
        return start + lastSentenceEnd
    }

    // Priority 5: Comma or semicolon
    const punctuationPattern = /[,;]\s+/g
    let lastPunctuation = -1
    while ((match = punctuationPattern.exec(searchWindow)) !== null) {
        if (start + match.index > minBreakPoint) {
            lastPunctuation = match.index + match[0].length
        }
    }
    if (lastPunctuation > minLength) {
        return start + lastPunctuation
    }

    // Priority 6: Any space
    const spaceIndex = searchWindow.lastIndexOf(' ')
    if (spaceIndex > minLength) {
        return start + spaceIndex + 1
    }

    // Fallback: hard break at ideal end
    return idealEnd
}

/**
 * Estimates token count for a text chunk
 */
export function estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    // More accurate would use tiktoken library
    return Math.ceil(text.length / 4)
}
