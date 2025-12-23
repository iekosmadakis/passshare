import type { Metadata } from 'next'

/**
 * Metadata for share pages
 * 
 * SECURITY: These meta tags help prevent link preview bots from
 * rendering the page and potentially triggering secret retrieval.
 * The noindex directive tells search engines not to index these pages.
 */
export const metadata: Metadata = {
  // Prevent search engine indexing of share links
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
    nocache: true,
  },
  // Generic Open Graph data that doesn't reveal anything sensitive
  openGraph: {
    title: 'PassShare - Secure Password',
    description: 'A secure, one-time password has been shared with you.',
    type: 'website',
  },
  // Twitter card with minimal information
  twitter: {
    card: 'summary',
    title: 'PassShare - Secure Password',
    description: 'A secure, one-time password has been shared with you.',
  },
  // Additional meta tags
  other: {
    // Tell bots not to render this page
    'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
  },
}

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}





