"use client"

import * as React from "react"
import { Copy, Eye, EyeOff, Shield, AlertTriangle } from "lucide-react"
import { 
  importKey, 
  decrypt, 
  separateIvAndCiphertext, 
  base64UrlDecode 
} from "@/lib/crypto"
import { copyToClipboard } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"

interface PasswordRetrievalViewProps {
  secretId: string
  encryptionKey: string
}

export function PasswordRetrievalView({ secretId, encryptionKey }: PasswordRetrievalViewProps) {
  const [password, setPassword] = React.useState<string>("")
  const [isRevealed, setIsRevealed] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [hasRetrieved, setHasRetrieved] = React.useState(false)
  const [error, setError] = React.useState<string>("")
  const { toast } = useToast()

  const retrievePassword = async () => {
    if (hasRetrieved) return
    
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/retrieve/${secretId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Secret not found or already accessed")
        } else if (response.status === 429) {
          throw new Error("Too many requests. Please try again later.")
        } else {
          throw new Error("Failed to retrieve secret")
        }
      }

      const data = await response.json()
      const cryptoKey = await importKey(encryptionKey)
      const encryptedBuffer = base64UrlDecode(data.encryptedData)
      const { iv, ciphertext } = separateIvAndCiphertext(encryptedBuffer)
      const decryptedPassword = await decrypt(ciphertext, iv, cryptoKey)
      
      setPassword(decryptedPassword)
      setHasRetrieved(true)
      setIsRevealed(true)
      
      toast({
        title: "Success!",
        description: "Password retrieved and decrypted successfully.",
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to retrieve password"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyPassword = async () => {
    if (!password) return
    
    const success = await copyToClipboard(password)
    if (success) {
      toast({
        title: "Copied!",
        description: "Password copied to clipboard.",
      })
    } else {
      toast({
        title: "Error",
        description: "Failed to copy password to clipboard.",
        variant: "destructive",
      })
    }
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!hasRetrieved) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Secure Password Access
          </CardTitle>
          <CardDescription>
            Click to retrieve and decrypt the shared password. This can only be done once.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={retrievePassword} 
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? "Retrieving..." : "Access Secret Password"}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-600">
          <Shield className="h-5 w-5" />
          Password Retrieved
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type={isRevealed ? "text" : "password"}
            value={password}
            readOnly
            className="font-mono"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsRevealed(!isRevealed)}
          >
            {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopyPassword}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 