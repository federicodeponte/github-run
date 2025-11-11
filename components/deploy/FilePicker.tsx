'use client'

// ABOUTME: Auto-discovery file picker component for Python files
// ABOUTME: Fetches and displays all .py files from a GitHub repository

import { useState, useEffect, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { getGitHubToken } from '@/lib/storage/settings'

interface PythonFile {
  path: string
  name: string
  size: number
}

interface FilePickerProps {
  githubUrl: string
  value: string
  onChange: (filePath: string) => void
  disabled?: boolean
}

export function FilePicker({ githubUrl, value, onChange, disabled }: FilePickerProps) {
  const [files, setFiles] = useState<PythonFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  const fetchFiles = useCallback(async () => {
    if (!githubUrl || githubUrl.length < 10) {
      setFiles([])
      return
    }

    setLoading(true)
    setError(undefined)

    try {
      const token = getGitHubToken()

      const response = await fetch('/api/repos/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          githubUrl,
          token,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch files')
      }

      setFiles(data.files || [])

      // Auto-select first file if none selected
      if (data.files?.length > 0 && !value) {
        onChange(data.files[0].path)
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch files'
      setError(errorMessage)
      setFiles([])
    } finally {
      setLoading(false)
    }
  }, [githubUrl, value, onChange])

  // Debounced fetch on URL change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFiles()
    }, 500)

    return () => clearTimeout(timer)
  }, [fetchFiles])

  if (loading) {
    return (
      <div className="space-y-2">
        <Label htmlFor="file-picker">Python File</Label>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Discovering Python files...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-2">
        <Label htmlFor="file-picker">Python File Path</Label>
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
        <input
          type="text"
          id="file-picker"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="functions/hello.py"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Enter path manually or fix the error above
        </p>
      </div>
    )
  }

  if (files.length === 0 && githubUrl) {
    return (
      <div className="space-y-2">
        <Label htmlFor="file-picker">Python File Path</Label>
        <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
          No Python files found in repository
        </div>
        <input
          type="text"
          id="file-picker"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="functions/hello.py"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      </div>
    )
  }

  if (files.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="file-picker">Python File ({files.length} found)</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchFiles}
          disabled={loading || disabled}
        >
          Refresh
        </Button>
      </div>
      <select
        id="file-picker"
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">Select a Python file...</option>
        {files.map((file) => (
          <option key={file.path} value={file.path}>
            {file.path} ({(file.size / 1024).toFixed(1)}KB)
          </option>
        ))}
      </select>
      <p className="text-xs text-muted-foreground">
        Select a Python file from the repository
      </p>
    </div>
  )
}
