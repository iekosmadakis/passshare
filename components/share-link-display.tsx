"use client"

import * as React from "react"
import { Copy, ExternalLink, QrCode } from "lucide-react"
import QRCode from "qrcode"
import { copyToClipboard, formatTimeRemaining } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"

interface ShareLinkDisplayProps {
  shareUrl: string
  onClose: () => void
}

export function ShareLinkDisplay({ shareUrl, onClose }: ShareLinkDisplayProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = React.useState<string>("")
  const [timeRemaining, setTimeRemaining] = React.useState<number>(24 * 60 * 60) // 24 hours in seconds
  const [showQR, setShowQR] = React.useState(false)
  const { toast } = useToast()

  // Generate QR code
  React.useEffect(() => {
    const generateQR = async () => {
      try {
        const dataUrl = await QRCode.toDataURL(shareUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        setQrCodeDataUrl(dataUrl)
      } catch (error) {
        console.error('Error generating QR code:', error)
      }
    }

    generateQR()
  }, [shareUrl])

  // Countdown timer
  React.useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleCopyLink = async () => {
    const success = await copyToClipboard(shareUrl)
    if (success) {
      toast({
        title: "Copied!",
        description: "Share link copied to clipboard.",
      })
    } else {
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard.",
        variant: "destructive",
      })
    }
  }

  const handleOpenLink = () => {
    window.open(shareUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Share Link Created
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </CardTitle>
        <CardDescription>
          Your password has been encrypted and can be accessed once via this link.
          The link will expire in {formatTimeRemaining(timeRemaining)}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Share URL */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Share URL</label>
          <div className="flex gap-2">
            <Input
              value={shareUrl}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyLink}
              title="Copy link"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleOpenLink}
              title="Open link"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* QR Code Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">QR Code</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowQR(!showQR)}
          >
            <QrCode className="h-4 w-4 mr-2" />
            {showQR ? 'Hide' : 'Show'} QR Code
          </Button>
        </div>

        {/* QR Code Display */}
        {showQR && qrCodeDataUrl && (
          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-lg">
              <img 
                src={qrCodeDataUrl} 
                alt="QR Code for share link"
                className="w-64 h-64"
              />
            </div>
          </div>
        )}

        {/* Security Information */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <h4 className="text-sm font-medium">Security Information</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• The password is encrypted client-side before being sent to the server</li>
            <li>• The encryption key is embedded in the URL fragment and never sent to the server</li>
            <li>• The link can only be accessed once - it will be destroyed after viewing</li>
            <li>• The link will automatically expire in 24 hours</li>
            <li>• The server never sees your unencrypted password</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button onClick={handleCopyLink} className="flex-1">
            <Copy className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
          <Button onClick={onClose} variant="outline" className="flex-1">
            Create Another
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 