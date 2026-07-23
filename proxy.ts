import { NextResponse, type NextRequest } from 'next/server'

const LEGACY_PREFIXES = [
    '/admin',
    '/api/admin',
    '/api/auth',
    '/api/ingest',
    '/api/upload-logo',
]

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl

    if (LEGACY_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
