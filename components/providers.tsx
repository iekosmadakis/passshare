"use client"

import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/toaster"

interface ProvidersProps {
  children: React.ReactNode
  nonce?: string
}

export function Providers({ children, nonce }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      nonce={nonce}
    >
      {children}
      <Toaster />
    </ThemeProvider>
  )
}