"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { AlertTriangle } from "lucide-react"
import { base64UrlDecode } from "@/lib/crypto"
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

const KEY_STORAGE_PREFIX = "passshare-key:"

export default function SharePage() {
  const params = useParams()
  const secretId = params.id as string
  const [encryptionKey, setEncryptionKey] = React.useState<string>("")
  const [error, setError] = React.useState<string>("")

  React.useEffect(() => {
    const storageKey = secretId ? KEY_STORAGE_PREFIX + secretId : ""
    let hash = window.location.hash.slice(1)

    // Recover the key after an accidental reload: sessionStorage is tab-scoped
    // and never synced to the browser-vendor cloud or written to history.
    if (!hash && storageKey) {
      try {
        hash = sessionStorage.getItem(storageKey) ?? ""
      } catch {
        /* sessionStorage unavailable — fall through to the missing-key error */
      }
    }

    if (!hash) {
      setError("Invalid share link: Missing encryption key")
      return
    }

    try {
      const keyBuffer = base64UrlDecode(hash)
      if (keyBuffer.byteLength !== 32) {
        throw new Error("Invalid key length")
      }
      if (storageKey) {
        try {
          sessionStorage.setItem(storageKey, hash)
        } catch {
          /* best-effort persistence; the key still lives in component state */
        }
      }
      setEncryptionKey(hash)

      // Strip the key from the address bar/history so the full capability URL is
      // not recorded in (cloud-synced) browser history while the secret is live.
      if (window.location.hash) {
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search
        )
      }
    } catch {
      setError("Invalid share link: Malformed encryption key")
    }
  }, [secretId])

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
