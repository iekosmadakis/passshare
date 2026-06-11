import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import { Providers } from '@/components/providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PassShare - Secure Password Sharing',
  description: 'Share passwords securely with client-side encryption and one-time access links.',
  keywords: ['password', 'sharing', 'security', 'encryption', 'one-time'],
  authors: [{ name: 'PassShare' }],
  robots: 'index, follow',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Forwarded by middleware.ts so next-themes' pre-hydration script is nonce'd
  // and not blocked by the strict-dynamic CSP.
  const nonce = (await headers()).get('x-nonce') ?? undefined

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers nonce={nonce}>
          {children}
        </Providers>
      </body>
    </html>
  )
}