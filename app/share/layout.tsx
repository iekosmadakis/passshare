import type { Metadata } from 'next'

/** Prevents bots/crawlers from indexing share pages or triggering secret retrieval */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
    nocache: true,
  },
  openGraph: {
    title: 'PassShare - Secure Password',
    description: 'A secure, one-time password has been shared with you.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'PassShare - Secure Password',
    description: 'A secure, one-time password has been shared with you.',
  },
  other: {
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
