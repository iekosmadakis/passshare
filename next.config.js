/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@vercel/kv'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            // Process-isolate the document; severs window.opener for cross-origin links
            // and mitigates Spectre-class side-channel attacks.
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          },
          {
            // Prevents other sites from embedding our resources (no-cors fetches, <img>, etc.).
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin'
          }
          // Content-Security-Policy is set per-request (with a nonce) in middleware.ts.
        ]
      }
    ]
  }
}

module.exports = nextConfig
