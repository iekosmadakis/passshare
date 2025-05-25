"use client"

import * as React from "react"
import { Copy, RefreshCw, Share2 } from "lucide-react"
import { 
  generateSecurePassword, 
  calculatePasswordStrength, 
  DEFAULT_PASSWORD_OPTIONS,
  type PasswordOptions 
} from "@/lib/password-generator"
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
  const { toast } = useToast()

  const strength = React.useMemo(() => {
    return password ? calculatePasswordStrength(password) : null
  }, [password])

  const generatePassword = React.useCallback(() => {
    setIsGenerating(true)
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
    onShare(password)
  }

  // Generate initial password
  React.useEffect(() => {
    generatePassword()
  }, [generatePassword])

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
          <label className="text-sm font-medium">Generated Password</label>
          <div className="flex gap-2">
            <Input
              value={password}
              readOnly
              className="font-mono text-sm"
              placeholder="Click generate to create a password"
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
                  className={`h-2 rounded-full transition-all duration-300 ${
                    strength.score === 0 ? 'bg-red-500' :
                    strength.score === 1 ? 'bg-red-500' :
                    strength.score === 2 ? 'bg-orange-500' :
                    strength.score === 3 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${(strength.score / 4) * 100}%` }}
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
              onValueChange={(value) => setOptions(prev => ({ ...prev, length: value[0] }))}
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
                onCheckedChange={(checked) => 
                  setOptions(prev => ({ ...prev, includeUppercase: checked }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm">Lowercase (a-z)</label>
              <Switch
                checked={options.includeLowercase}
                onCheckedChange={(checked) => 
                  setOptions(prev => ({ ...prev, includeLowercase: checked }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm">Numbers (0-9)</label>
              <Switch
                checked={options.includeNumbers}
                onCheckedChange={(checked) => 
                  setOptions(prev => ({ ...prev, includeNumbers: checked }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm">Symbols (!@#$...)</label>
              <Switch
                checked={options.includeSymbols}
                onCheckedChange={(checked) => 
                  setOptions(prev => ({ ...prev, includeSymbols: checked }))
                }
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button onClick={generatePassword} disabled={isGenerating} className="flex-1">
            <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            Generate New
          </Button>
          <Button 
            onClick={handleShare} 
            disabled={!password}
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