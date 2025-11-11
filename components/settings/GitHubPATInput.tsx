'use client'

// ABOUTME: GitHub Personal Access Token input component
// ABOUTME: Allows users to configure PAT for private repository access

import { useState, useEffect } from 'react'
import { Eye, EyeOff, Check, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { getGitHubToken, saveGitHubToken, isValidGitHubToken } from '@/lib/storage/settings'

export function GitHubPATInput() {
  const [token, setToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [hasToken, setHasToken] = useState(false)

  useEffect(() => {
    const savedToken = getGitHubToken()
    if (savedToken) {
      setToken(savedToken)
      setHasToken(true)
    }
  }, [])

  const handleSave = () => {
    if (token) {
      saveGitHubToken(token)
      setHasToken(true)
    }
  }

  const handleClear = () => {
    setToken('')
    saveGitHubToken(undefined)
    setHasToken(false)
  }

  const isValid = token.length === 0 || isValidGitHubToken(token)

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="github-pat">GitHub Personal Access Token</Label>
          {hasToken && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <Check className="h-3 w-3" />
              Configured
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="github-pat"
              type={showToken ? 'text' : 'password'}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className={!isValid ? 'border-destructive' : ''}
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showToken ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <Button onClick={handleSave} disabled={!token || !isValid}>
            Save
          </Button>
          {hasToken && (
            <Button onClick={handleClear} variant="outline">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {!isValid && token.length > 0 && (
          <p className="text-xs text-destructive">
            Invalid token format. Expected: ghp_... or github_pat_...
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Required for private repositories.{' '}
          <a
            href="https://github.com/settings/tokens/new?scopes=repo&description=GitHub%20Run"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Create a token
          </a>
        </p>
      </div>
    </div>
  )
}
