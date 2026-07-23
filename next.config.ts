import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    async headers() {
        return [
            {
                source: '/embed/:path*',
                headers: [
                    { key: 'X-Frame-Options', value: 'ALLOWALL' },
                    { key: 'Content-Security-Policy', value: 'frame-ancestors *' },
                ],
            },
            {
                source: '/api/chat',
                headers: [
                    { key: 'Access-Control-Allow-Origin', value: '*' },
                    { key: 'Access-Control-Allow-Methods', value: 'POST, OPTIONS' },
                    { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
                ],
            },
        ]
    },
    turbopack: {},
}

export default nextConfig
