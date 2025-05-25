"use client"

import * as React from "react"
import { Shield } from "lucide-react"
import { 
  generateKey, 
  exportKey, 
  encrypt, 
  combineIvAndCiphertext, 
  base64UrlEncode 
} from "@/lib/crypto"
import { ThemeToggle } from "@/components/theme-toggle"
import { PasswordGeneratorForm } from "@/components/password-generator-form"
import { ShareLinkDisplay } from "@/components/share-link-display"
import { useToast } from "@/components/ui/use-toast"

export default function HomePage() {
  const [shareUrl, setShareUrl] = React.useState<string>("")
  const { toast } = useToast()

  const handleShare = async (password: string) => {
    try {
      // Generate encryption key and encrypt password
      const key = await generateKey()
      const keyString = await exportKey(key)
      const { ciphertext, iv } = await encrypt(password, key)
      
      // Combine IV and ciphertext for storage
      const combined = combineIvAndCiphertext(iv, ciphertext)
      const encryptedData = base64UrlEncode(combined)
      
      // Send encrypted data to server
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ encryptedData }),
      })
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.')
        }
        throw new Error('Failed to create share link')
      }
      
      const { id } = await response.json()
      
      // Create share URL with encryption key in fragment
      const baseUrl = window.location.origin
      const url = `${baseUrl}/share/${id}#${keyString}`
      
      setShareUrl(url)
      
      toast({
        title: "Success!",
        description: "Secure share link created successfully.",
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create share link'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleCloseShare = () => {
    setShareUrl("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
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

        {/* Main Content */}
        <main className="flex flex-col items-center space-y-8">
          {!shareUrl ? (
            <>
              {/* Hero Section */}
              <div className="text-center space-y-4 max-w-2xl">
                <h2 className="text-4xl font-bold text-foreground">
                  Share Passwords Securely
                </h2>
                <p className="text-lg text-muted-foreground">
                  Generate strong passwords and share them via encrypted, one-time access links.
                  Your passwords are encrypted client-side and never stored in plain text.
                </p>
              </div>

              {/* Password Generator */}
              <PasswordGeneratorForm onShare={handleShare} />

              {/* Features */}
              <div className="grid md:grid-cols-3 gap-6 max-w-4xl w-full mt-16">
                <div className="text-center space-y-2">
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full w-fit mx-auto">
                    <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold">Client-Side Encryption</h3>
                  <p className="text-sm text-muted-foreground">
                    Passwords are encrypted in your browser using AES-256-GCM before being sent to the server.
                  </p>
                </div>
                
                <div className="text-center space-y-2">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full w-fit mx-auto">
                    <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold">One-Time Access</h3>
                  <p className="text-sm text-muted-foreground">
                    Links are destroyed after a single access, ensuring maximum security.
                  </p>
                </div>
                
                <div className="text-center space-y-2">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full w-fit mx-auto">
                    <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold">Auto-Expiry</h3>
                  <p className="text-sm text-muted-foreground">
                    All links automatically expire after 24 hours for additional security.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <ShareLinkDisplay shareUrl={shareUrl} onClose={handleCloseShare} />
          )}
        </main>

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-muted-foreground">
          <p>
            Built with security in mind. Your passwords are encrypted client-side and never stored in plain text.
          </p>
        </footer>
      </div>
    </div>
  )
} 