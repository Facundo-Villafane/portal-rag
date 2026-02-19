import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async headers() {
    return [
      {
        // Allow embedding in iframes (Moodle, etc.)
        source: '/embed/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          { key: 'Content-Security-Policy', value: "frame-ancestors *" },
        ],
      },
      {
        // Allow cross-origin requests to the chat API from embedded iframes
        source: '/api/chat',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ]
  },
  // Tell Next.js to NOT bundle these packages — load them from node_modules at runtime
  serverExternalPackages: ['fastembed', '@anush008/tokenizers', 'pdf-parse'],

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'fastembed': 'commonjs fastembed',
        '@anush008/tokenizers': 'commonjs @anush008/tokenizers',
        'pdf-parse': 'commonjs pdf-parse',
        'pdf-parse/lib/pdf-parse.js': 'commonjs pdf-parse/lib/pdf-parse.js',
      });
    }
    return config;
  },

  // Empty turbopack config to silence warning when using --webpack flag
  turbopack: {},
};

export default nextConfig;
