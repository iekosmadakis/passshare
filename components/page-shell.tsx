"use client"

import { Shield } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

interface PageShellProps {
  children: React.ReactNode
}

export function PageShell({ children }: PageShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">PassShare</h1>
              <p className="text-sm text-muted-foreground">Secure Password Sharing</p>
            </div>
          </div>
          <ThemeToggle />
        </header>
        {children}
      </div>
    </div>
  )
}
