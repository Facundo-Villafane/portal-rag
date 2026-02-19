import { createOpenAI } from '@ai-sdk/openai'
import { decryptCredential } from './encryption'

/**
 * Model pricing per 1M tokens (input / output)
 * Updated as of 2024. Verify current pricing.
 */
export const MODEL_PRICING: Record<string, { input: number; output: number; provider: string }> = {
    // Groq Production Models
    'llama-3.3-70b-versatile': { input: 0.59, output: 0.79, provider: 'groq' },
    'llama-3.1-8b-instant': { input: 0.05, output: 0.08, provider: 'groq' },

    // Groq Preview Models
    'meta-llama/llama-4-maverick-17b-128e-instruct': { input: 0.20, output: 0.60, provider: 'groq' },
    'meta-llama/llama-4-scout-17b-16e-instruct': { input: 0.11, output: 0.34, provider: 'groq' },
    'qwen/qwen3-32b': { input: 0.29, output: 0.59, provider: 'groq' },

    // OpenAI Models
    'gpt-4o': { input: 2.50, output: 10.00, provider: 'openai' },
    'gpt-4o-mini': { input: 0.150, output: 0.600, provider: 'openai' },

    // Anthropic Models
    'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00, provider: 'anthropic' },
    'claude-3-haiku-20240307': { input: 0.25, output: 1.25, provider: 'anthropic' },
}

/**
 * Gets model with organization-specific credentials
 * Following SDD Section 18.3: Runtime credential decryption
 */
export async function getModel(modelName: string, orgId?: string) {
    const pricing = MODEL_PRICING[modelName] || MODEL_PRICING['llama-3.3-70b-versatile']
    const provider = pricing.provider

    let apiKey: string | undefined

    // If org_id provided, resolve credentials from the key pool (SDD Section 18.3)
    if (orgId) {
        try {
            // Use service client — getModel() is called from the public chat route (no user session)
            const { createServiceClient } = await import('./supabase/server')
            const supabase = createServiceClient()

            // 1. Try the key pool first — pick one at random for stateless load distribution
            const { data: poolKeys } = await supabase
                .from('org_llm_key')
                .select('encrypted_key')
                .eq('org_id', orgId)
                .eq('provider', provider)
                .eq('is_active', true)

            if (poolKeys && poolKeys.length > 0) {
                const chosen = poolKeys[Math.floor(Math.random() * poolKeys.length)]
                apiKey = decryptCredential(chosen.encrypted_key)
            } else {
                // 2. Fallback: legacy single-key column (backward compat for existing orgs)
                const { data: org } = await supabase
                    .from('organization')
                    .select('llm_credentials_encrypted')
                    .eq('org_id', orgId)
                    .single()

                if (org?.llm_credentials_encrypted) {
                    apiKey = decryptCredential(org.llm_credentials_encrypted)
                }
            }
        } catch (error) {
            console.error('[getModel] failed to load org credentials, using global fallback:', error)
        }
    }

    // 3. Global env fallback
    if (provider === 'openai' || modelName.startsWith('gpt-')) {
        const openai = createOpenAI({
            apiKey: apiKey || process.env.OPENAI_API_KEY,
        })
        return openai(modelName)
    }

    if (provider === 'anthropic' || modelName.startsWith('claude-')) {
        const anthropic = createOpenAI({
            baseURL: 'https://api.anthropic.com/v1',
            apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
        })
        return anthropic(modelName)
    }

    // Default to Groq
    const groq = createOpenAI({
        baseURL: 'https://api.groq.com/openai/v1',
        apiKey: apiKey || process.env.GROQ_API_KEY,
    })

    return groq(modelName || 'llama-3.3-70b-versatile')
}

/**
 * Calculates cost for a completion
 * Following SDD Section 16.3
 */
export function calculateCost(
    modelName: string,
    tokensInput: number,
    tokensOutput: number
): number {
    const pricing = MODEL_PRICING[modelName]
    if (!pricing) {
        console.warn(`Unknown model pricing for: ${modelName}`)
        return 0
    }

    const inputCost = (tokensInput / 1_000_000) * pricing.input
    const outputCost = (tokensOutput / 1_000_000) * pricing.output

    return inputCost + outputCost
}
