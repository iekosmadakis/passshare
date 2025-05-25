"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { Shield, AlertTriangle } from "lucide-react"
import { PasswordRetrievalView } from "@/components/password-retrieval-view"
import { ThemeToggle } from "@/components/theme-toggle"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SharePage() {
  const params = useParams()
  const [encryptionKey, setEncryptionKey] = React.useState<string>("")
  const [error, setError] = React.useState<string>("")

  React.useEffect(() => {
    // Extract encryption key from URL fragment
    const hash = window.location.hash.slice(1) // Remove the # character
    
    if (!hash) {
      setError("Invalid share link: Missing encryption key")
      return
    }
    
    // Validate key format (should be base64url)
    try {
      // Basic validation - check if it's a valid base64url string
      const decoded = atob(hash.replace(/-/g, '+').replace(/_/g, '/'))
      if (decoded.length !== 32) { // 256 bits = 32 bytes
        throw new Error("Invalid key length")
      }
      setEncryptionKey(hash)
    } catch {
      setError("Invalid share link: Malformed encryption key")
    }
  }, [])

  const secretId = params.id as string

  if (!secretId) {
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
          
          <main className="flex justify-center">
            <Card className="w-full max-w-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Invalid Link
                </CardTitle>
                <CardDescription>
                  The share link is invalid or malformed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Please check the link and try again, or contact the person who shared it with you.
                </p>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    )
  }

  if (error) {
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
          
          <main className="flex justify-center">
            <Card className="w-full max-w-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Invalid Link
                </CardTitle>
                <CardDescription>
                  The share link is invalid or malformed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-destructive">{error}</p>
                  <p className="text-sm text-muted-foreground">
                    Please check the link and try again, or contact the person who shared it with you.
                  </p>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    )
  }

  if (!encryptionKey) {
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
          
          <main className="flex justify-center">
            <Card className="w-full max-w-2xl">
              <CardHeader>
                <CardTitle>Loading...</CardTitle>
                <CardDescription>
                  Validating share link...
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    )
  }

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
        
        <main className="flex justify-center">
          <PasswordRetrievalView 
            secretId={secretId} 
            encryptionKey={encryptionKey} 
          />
        </main>
      </div>
    </div>
  )
} 