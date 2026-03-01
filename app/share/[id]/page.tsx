"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { AlertTriangle } from "lucide-react"
import { PasswordRetrievalView } from "@/components/password-retrieval-view"
import { PageShell } from "@/components/page-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function ErrorCard({ title, message }: { title: string; message?: string }) {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>
          The share link is invalid or malformed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {message && <p className="text-sm text-destructive">{message}</p>}
          <p className="text-sm text-muted-foreground">
            Please check the link and try again, or contact the person who shared it with you.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function LoadingCard() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Loading...</CardTitle>
        <CardDescription>Validating share link...</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function SharePage() {
  const params = useParams()
  const [encryptionKey, setEncryptionKey] = React.useState<string>("")
  const [error, setError] = React.useState<string>("")

  React.useEffect(() => {
    const hash = window.location.hash.slice(1)

    if (!hash) {
      setError("Invalid share link: Missing encryption key")
      return
    }

    try {
      const decoded = atob(hash.replace(/-/g, '+').replace(/_/g, '/'))
      if (decoded.length !== 32) {
        throw new Error("Invalid key length")
      }
      setEncryptionKey(hash)
    } catch {
      setError("Invalid share link: Malformed encryption key")
    }
  }, [])

  const secretId = params.id as string

  const content = (() => {
    if (!secretId) {
      return <ErrorCard title="Invalid Link" />
    }
    if (error) {
      return <ErrorCard title="Invalid Link" message={error} />
    }
    if (!encryptionKey) {
      return <LoadingCard />
    }
    return <PasswordRetrievalView secretId={secretId} encryptionKey={encryptionKey} />
  })()

  return (
    <PageShell>
      <main className="flex justify-center">{content}</main>
    </PageShell>
  )
}
