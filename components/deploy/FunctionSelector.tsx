'use client'

// ABOUTME: Function selector component for choosing which Python function to deploy
// ABOUTME: Auto-discovers functions in selected file and suggests best default

import { useState, useEffect, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { getGitHubToken } from '@/lib/storage/settings'

interface PythonFunction {
  name: string
  parameters: string[]
  isAsync: boolean
  hasDecorators: boolean
  lineNumber: number
}

interface FunctionSelectorProps {
  githubUrl: string
  filePath: string
  value: string
  onChange: (functionName: string) => void
  disabled?: boolean
}

export function FunctionSelector({
  githubUrl,
  filePath,
  value,
  onChange,
  disabled
}: FunctionSelectorProps) {
  const [functions, setFunctions] = useState<PythonFunction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  const fetchFunctions = useCallback(async () => {
    // Don't fetch if we don't have both URL and file path
    if (!githubUrl || !filePath || githubUrl.length < 10 || !filePath.endsWith('.py')) {
      setFunctions([])
      return
    }

    setLoading(true)
    setError(undefined)

    try {
      const token = getGitHubToken()

      const response = await fetch('/api/repos/functions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          githubUrl,
          filePath,
          token,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze Python file')
      }

      setFunctions(data.functions || [])

      // Auto-select default function if none selected
      if (data.defaultFunction && !value) {
        onChange(data.defaultFunction)
      } else if (data.functions?.length > 0 && !value) {
        // Fallback: select first function
        onChange(data.functions[0].name)
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze file'
      setError(errorMessage)
      setFunctions([])
    } finally {
      setLoading(false)
    }
  }, [githubUrl, filePath, value, onChange])

  // Fetch functions when file path changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFunctions()
    }, 300) // Debounce

    return () => clearTimeout(timer)
  }, [fetchFunctions])

  if (loading) {
    return (
      <div className="space-y-2">
        <Label htmlFor="function-selector">Python Function</Label>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Analyzing Python file...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-2">
        <Label htmlFor="function-selector">Function Name</Label>
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
        <input
          type="text"
          id="function-selector"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="main"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Enter function name manually or fix the error above
        </p>
      </div>
    )
  }

  if (functions.length === 0 && filePath) {
    return (
      <div className="space-y-2">
        <Label htmlFor="function-selector">Function Name</Label>
        <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
          No functions found in file
        </div>
        <input
          type="text"
          id="function-selector"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="main"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      </div>
    )
  }

  if (functions.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="function-selector">Python Function ({functions.length} found)</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchFunctions}
          disabled={loading || disabled}
        >
          Refresh
        </Button>
      </div>
      <select
        id="function-selector"
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">Select a function...</option>
        {functions.map((func) => (
          <option key={func.name} value={func.name}>
            {func.isAsync ? 'async ' : ''}{func.name}({func.parameters.join(', ')})
          </option>
        ))}
      </select>
      <p className="text-xs text-muted-foreground">
        Select which function to deploy as the API endpoint
      </p>
    </div>
  )
}
