/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@vercel/kv'],
  // This app never uses next/image (the QR code is a plain <img> with a data URL),
  // so turn the optimizer off to remove the /_next/image endpoint — and with it
  // the sharp/libvips image-decoding attack surface — from the deployment.
  images: { unoptimized: true },
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
            // no-referrer: share URLs carry the decryption key in the fragment.
            // Fragments are never sent in Referer, but this also stops the secret
            // *id* in the path leaking to any third-party origin the user visits.
            key: 'Referrer-Policy',
            value: 'no-referrer'
          },
          {
            // Vercel already sets HSTS at the edge; declaring it here keeps the
            // guarantee if the app is ever hosted elsewhere. No 'preload' — that
            // is an irreversible commitment for the apex domain.
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains'
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
