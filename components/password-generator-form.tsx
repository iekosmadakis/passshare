"use client"

import * as React from "react"
import { Copy, RefreshCw, Share2 } from "lucide-react"
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
  const { toast } = useToast()

  const strength = React.useMemo(() => {
    return password ? calculatePasswordStrength(password) : null
  }, [password])

  // Analyze password and update options to match actual content
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
      const newPassword = generateSecurePassword(options)
      setPassword(newPassword)
    } catch (error) {
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
    const newPassword = e.target.value
    setIsManuallyEditing(true)
    setPassword(newPassword)
    updateOptionsFromPassword(newPassword)
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

  const handleShare = () => {
    if (!password) return
    
    // Validate password length before sharing
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

  // Generate initial password
  React.useEffect(() => {
    if (!isManuallyEditing) {
      generatePassword()
    }
  }, [generatePassword, isManuallyEditing])

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Password Generator</CardTitle>
        <CardDescription>
          Generate a secure, cryptographically random password
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Generated Password Display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Generated Password</label>
            {password.length > 0 && (
              <span className={`text-xs ${password.length > MAX_PLAINTEXT_LENGTH ? 'text-destructive' : 'text-muted-foreground'}`}>
                {password.length.toLocaleString()}/{MAX_PLAINTEXT_LENGTH.toLocaleString()}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              value={password}
              className={`font-mono text-sm ${password.length > MAX_PLAINTEXT_LENGTH ? 'border-destructive' : ''}`}
              placeholder="Generate a password or type your own"
              onChange={handlePasswordChange}
              maxLength={MAX_PLAINTEXT_LENGTH + 100} // Allow slight overflow for UX, validation happens on submit
            />
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
          
          {/* Password Strength Indicator */}
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
                    strength.score === 0 ? 'bg-red-500' :
                    strength.score === 1 ? 'bg-red-500' :
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

        {/* Password Options */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Options</h3>
          
          {/* Length Slider */}
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

          {/* Character Type Toggles */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <label className="text-sm">Uppercase (A-Z)</label>
              <Switch
                checked={options.includeUppercase}
                onCheckedChange={(checked) => {
                  setIsManuallyEditing(false)
                  setOptions(prev => ({ ...prev, includeUppercase: checked }))
                }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm">Lowercase (a-z)</label>
              <Switch
                checked={options.includeLowercase}
                onCheckedChange={(checked) => {
                  setIsManuallyEditing(false)
                  setOptions(prev => ({ ...prev, includeLowercase: checked }))
                }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm">Numbers (0-9)</label>
              <Switch
                checked={options.includeNumbers}
                onCheckedChange={(checked) => {
                  setIsManuallyEditing(false)
                  setOptions(prev => ({ ...prev, includeNumbers: checked }))
                }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm">Symbols (!@#$...)</label>
              <Switch
                checked={options.includeSymbols}
                onCheckedChange={(checked) => {
                  setIsManuallyEditing(false)
                  setOptions(prev => ({ ...prev, includeSymbols: checked }))
                }}
              />
            </div>
          </div>
        </div>

        {/* Length Warning */}
        {password.length > MAX_PLAINTEXT_LENGTH && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-sm text-destructive">
              Password exceeds maximum length of {MAX_PLAINTEXT_LENGTH.toLocaleString()} characters. 
              Please shorten it before sharing.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button onClick={generatePassword} disabled={isGenerating} className="flex-1">
            <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            Generate New
          </Button>
          <Button 
            onClick={handleShare} 
            disabled={!password || password.length > MAX_PLAINTEXT_LENGTH}
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
