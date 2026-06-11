import { NextRequest, NextResponse } from 'next/server'

/**
 * Emits a per-request, nonce-based Content-Security-Policy.
 *
 * script-src uses 'strict-dynamic' + a fresh nonce so that only scripts this
 * app explicitly trusts (Next's own bootstrap, which inherits the nonce) can run.
 * 'unsafe-inline' is kept ONLY as a legacy fallback that strict-dynamic-aware
 * browsers ignore; 'unsafe-eval' is dev-only (React Fast Refresh) and never ships
 * to production. This restores script-src as a real XSS containment boundary for
 * the pages that handle the decryption key and plaintext password.
 */
export function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID())
  const isDev = process.env.NODE_ENV === 'development'

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ')

  // Next reads the nonce from the CSP on the *request* headers and applies it to
  // its inline scripts; x-nonce is exposed so the theme script can be nonced too.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', csp)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', csp)
  return response
}

export const config = {
  matcher: [
    // Document routes only — skip API (JSON, guarded by nosniff) and static assets.
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico|icon.png).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
