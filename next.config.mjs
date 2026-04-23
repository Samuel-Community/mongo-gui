/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader:             false,
  productionBrowserSourceMaps: false,
  compress:                    true,

  typescript: { ignoreBuildErrors: false },
  eslint:     { ignoreDuringBuilds: false },

  experimental: {
    // Tree-shake heavy icon/chart libraries
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-slot',
    ],
    // Inline critical CSS into <head> instead of a separate blocking request
    // Eliminates the "render-blocking layout.css" warning entirely
    inlineCss: true,
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',  value: 'nosniff'                         },
          { key: 'X-Frame-Options',         value: 'SAMEORIGIN'                      },
          { key: 'X-DNS-Prefetch-Control',  value: 'on'                              },
          { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',      value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data:",
              "img-src 'self' data: blob:",
              "worker-src blob:",
              "connect-src 'self'",
            ].join('; '),
          },
        ],
      },
      // Static assets cached forever (Next.js fingerprints filenames)
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;
