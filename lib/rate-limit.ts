import { NextRequest } from 'next/server'

type LimitRecord = {
    day: string
    count: number
}

type LimitResult = {
    allowed: boolean
    remaining: number
    limit: number
    resetLabel: string
}

declare global {
    var __billrDailyLimits: Map<string, LimitRecord> | undefined
}

const TIME_ZONE = 'America/Argentina/Buenos_Aires'

function getStore() {
    if (!globalThis.__billrDailyLimits) {
        globalThis.__billrDailyLimits = new Map<string, LimitRecord>()
    }

    return globalThis.__billrDailyLimits
}

function todayKey() {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date())
}

function readPositiveInt(value: string | undefined, fallback: number) {
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback
}

export function getChatLimitConfig() {
    return {
        perSessionDaily: readPositiveInt(process.env.CHAT_DAILY_SESSION_LIMIT, 25),
        perIpDaily: readPositiveInt(process.env.CHAT_DAILY_IP_LIMIT, 200),
        maxOutputTokens: readPositiveInt(process.env.CHAT_MAX_OUTPUT_TOKENS, 900),
    }
}

export function getClientIp(req: NextRequest) {
    const forwardedFor = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    const realIp = req.headers.get('x-real-ip')?.trim()
    return forwardedFor || realIp || 'unknown'
}

export function checkDailyLimit(key: string, limit: number): LimitResult {
    const day = todayKey()
    const store = getStore()
    const current = store.get(key)

    if (!current || current.day !== day) {
        store.set(key, { day, count: 1 })
        return {
            allowed: true,
            remaining: Math.max(limit - 1, 0),
            limit,
            resetLabel: 'manana',
        }
    }

    if (current.count >= limit) {
        return {
            allowed: false,
            remaining: 0,
            limit,
            resetLabel: 'manana',
        }
    }

    current.count += 1
    return {
        allowed: true,
        remaining: Math.max(limit - current.count, 0),
        limit,
        resetLabel: 'manana',
    }
}
