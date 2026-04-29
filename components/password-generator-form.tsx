"use client"

import * as React from "react"
import { Copy, Eye, EyeOff, RefreshCw, Share2 } from "lucide-react"
import {
  generateSecurePassword,
  calculatePasswordStrength,
  DEFAULT_PASSWORD_OPTIONS,
  type PasswordOptions
} from "@/lib/password-generator"
import { MAX_PLAINTEXT_LENGTH } from "@/lib/schemas"
import { copyToClipboard } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"

interface PasswordGeneratorFormProps {
  onShare: (password: string) => void
}

export function PasswordGeneratorForm({ onShare }: PasswordGeneratorFormProps) {
  const [options, setOptions] = React.useState<PasswordOptions>(DEFAULT_PASSWORD_OPTIONS)
  const [password, setPassword] = React.useState<string>("")
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [isManuallyEditing, setIsManuallyEditing] = React.useState(false)
  const [isRevealed, setIsRevealed] = React.useState(false)
  const { toast } = useToast()

  const strength = React.useMemo(() => {
    return password ? calculatePasswordStrength(password) : null
  }, [password])

  const updateOptionsFromPassword = React.useCallback((pwd: string) => {
    if (!pwd) return
    setOptions(prev => ({
      ...prev,
      length: pwd.length,
      includeUppercase: /[A-Z]/.test(pwd),
      includeLowercase: /[a-z]/.test(pwd),
      includeNumbers: /[0-9]/.test(pwd),
      includeSymbols: /[^a-zA-Z0-9]/.test(pwd)
    }))
  }, [])

  const generatePassword = React.useCallback(() => {
    setIsGenerating(true)
    setIsManuallyEditing(false)
    try {
      setPassword(generateSecurePassword(options))
    } catch {
      toast({
        title: "Error",
        description: "Failed to generate password. Please check your options.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }, [options, toast])

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsManuallyEditing(true)
    setPassword(e.target.value)
    updateOptionsFromPassword(e.target.value)
  }

  const handleCopyPassword = async () => {
    if (!password) return
    const success = await copyToClipboard(password)
    toast({
      title: success ? "Copied!" : "Error",
      description: success ? "Password copied to clipboard." : "Failed to copy password to clipboard.",
      variant: success ? "default" : "destructive",
    })
  }

  const handleShare = () => {
    if (!password) return
    if (password.length > MAX_PLAINTEXT_LENGTH) {
      toast({
        title: "Error",
        description: `Password exceeds maximum length of ${MAX_PLAINTEXT_LENGTH} characters.`,
        variant: "destructive",
      })
      return
    }
    onShare(password)
  }

  React.useEffect(() => {
    if (!isManuallyEditing) {
      generatePassword()
    }
  }, [generatePassword, isManuallyEditing])

  const isOverLimit = password.length > MAX_PLAINTEXT_LENGTH

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Password Generator</CardTitle>
        <CardDescription>
          Generate a secure, cryptographically random password
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Generated Password</label>
            {password.length > 0 && (
              <span className={`text-xs ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
                {password.length.toLocaleString()}/{MAX_PLAINTEXT_LENGTH.toLocaleString()}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              type={isRevealed ? "text" : "password"}
              value={password}
              className={`font-mono text-sm ${isOverLimit ? 'border-destructive' : ''}`}
              placeholder="Generate a password or type your own"
              onChange={handlePasswordChange}
              maxLength={MAX_PLAINTEXT_LENGTH + 100}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsRevealed(!isRevealed)}
              title={isRevealed ? "Hide password" : "Show password"}
            >
              {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyPassword}
              disabled={!password}
              title="Copy password"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={generatePassword}
              disabled={isGenerating}
              title="Generate new password"
            >
              <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {strength && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Strength</span>
                <span className={`text-sm font-medium ${strength.color}`}>
                  {strength.label}
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 progress-bar ${
                    strength.score <= 1 ? 'bg-red-500' :
                    strength.score === 2 ? 'bg-orange-500' :
                    strength.score === 3 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ '--progress-width': `${(strength.score / 4) * 100}%` } as React.CSSProperties}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                {strength.feedback.join(', ')}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Options</h3>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm">Length</label>
              <span className="text-sm text-muted-foreground">{options.length}</span>
            </div>
            <Slider
              value={[options.length]}
              onValueChange={(value) => {
                setIsManuallyEditing(false)
                setOptions(prev => ({ ...prev, length: value[0] }))
              }}
              min={8}
              max={64}
              step={1}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {([
              ['Uppercase (A-Z)', 'includeUppercase'],
              ['Lowercase (a-z)', 'includeLowercase'],
              ['Numbers (0-9)', 'includeNumbers'],
              ['Symbols (!@#$...)', 'includeSymbols'],
            ] as const).map(([label, key]) => (
              <div key={key} className="flex items-center justify-between">
                <label className="text-sm">{label}</label>
                <Switch
                  checked={options[key]}
                  onCheckedChange={(checked) => {
                    setIsManuallyEditing(false)
                    setOptions(prev => ({ ...prev, [key]: checked }))
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {isOverLimit && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-sm text-destructive">
              Password exceeds maximum length of {MAX_PLAINTEXT_LENGTH.toLocaleString()} characters.
              Please shorten it before sharing.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 pt-4">
          <Button onClick={generatePassword} disabled={isGenerating} className="flex-1">
            <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            Generate New
          </Button>
          <Button
            onClick={handleShare}
            disabled={!password || isOverLimit}
            variant="outline"
            className="flex-1"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Create Share Link
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
