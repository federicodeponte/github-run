'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Github, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"
import { FilePicker } from "@/components/deploy/FilePicker"
import { GitHubPATInput } from "@/components/settings/GitHubPATInput"
import { getGitHubToken } from "@/lib/storage/settings"

type DeployStatus = 'idle' | 'fetching' | 'deploying' | 'success' | 'error'

export default function DeployPage() {
  const [githubUrl, setGithubUrl] = useState('')
  const [filePath, setFilePath] = useState('')
  const [envVars, setEnvVars] = useState('')
  const [status, setStatus] = useState<DeployStatus>('idle')
  const [endpoint, setEndpoint] = useState('')
  const [error, setError] = useState('')

  const handleDeploy = async () => {
    if (!githubUrl) {
      toast.error('Please enter a GitHub repository URL')
      return
    }

    if (!filePath) {
      toast.error('Please select a Python file')
      return
    }

    setStatus('fetching')
    setError('')
    setEndpoint('')

    try {
      // Get GitHub token from storage
      const token = getGitHubToken()

      // Parse environment variables from key=value format
      const envVarsObject: Record<string, string> = {}
      if (envVars.trim()) {
        envVars.split('\n').forEach((line) => {
          let trimmed = line.trim()

          // Remove 'export' prefix if present
          if (trimmed.startsWith('export ')) {
            trimmed = trimmed.substring(7).trim()
          }

          if (trimmed && trimmed.includes('=')) {
            const [key, ...valueParts] = trimmed.split('=')
            envVarsObject[key.trim()] = valueParts.join('=').trim()
          }
        })
      }

      // Call our API route to deploy
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          githubUrl,
          filePath,
          token,
          envVars: Object.keys(envVarsObject).length > 0 ? envVarsObject : undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Deployment failed')
      }

      setStatus('success')
      setEndpoint(data.endpoint)
      toast.success('Function deployed successfully!')
    } catch (err: any) {
      setStatus('error')
      setError(err.message)
      toast.error(err.message)
    }
  }

  const testEndpoint = async () => {
    if (!endpoint) return

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'World' })
      })
      const data = await response.json()
      toast.success(`Response: ${JSON.stringify(data)}`)
    } catch (err: any) {
      toast.error(`Test failed: ${err.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Github className="h-6 w-6" />
            <span className="font-bold text-xl">GitHub Run</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Deploy a Python Function</h1>
            <p className="text-muted-foreground">
              Paste a GitHub repo URL and deploy any Python function instantly
            </p>
          </div>

          <GitHubPATInput />

          <Card>
            <CardHeader>
              <CardTitle>Deployment Configuration</CardTitle>
              <CardDescription>
                Enter the GitHub repository URL and select your Python file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">GitHub Repository URL</label>
                <Input
                  placeholder="https://github.com/username/repo"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Example: https://github.com/federicodeponte/python-functions
                </p>
              </div>

              <FilePicker
                githubUrl={githubUrl}
                value={filePath}
                onChange={setFilePath}
                disabled={status === 'fetching' || status === 'deploying'}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium">Environment Variables (Optional)</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder={"OPENAI_API_KEY=sk-...\nAPI_URL=https://api.example.com"}
                  value={envVars}
                  onChange={(e) => setEnvVars(e.target.value)}
                  disabled={status === 'fetching' || status === 'deploying'}
                />
                <p className="text-xs text-muted-foreground">
                  One variable per line in KEY=VALUE format (export prefix optional)
                </p>
              </div>

              <Button
                onClick={handleDeploy}
                disabled={status === 'fetching' || status === 'deploying'}
                className="w-full"
              >
                {status === 'fetching' || status === 'deploying' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {status === 'fetching' ? 'Fetching code...' : 'Deploying...'}
                  </>
                ) : (
                  <>
                    <Github className="mr-2 h-4 w-4" />
                    Deploy Function
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {status === 'success' && endpoint && (
            <Card className="border-green-500/50 bg-green-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  Deployment Successful!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your API Endpoint</label>
                  <div className="flex gap-2">
                    <Input value={endpoint} readOnly className="font-mono text-sm" />
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(endpoint)
                        toast.success('Endpoint copied to clipboard!')
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Test Your Function</label>
                  <Button onClick={testEndpoint} variant="outline" className="w-full">
                    Send Test Request
                  </Button>
                </div>

                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium">Example cURL Request:</p>
                  <pre className="text-xs overflow-x-auto">
                    {`curl -X POST ${endpoint} \\
  -H "Content-Type: application/json" \\
  -d '{"name": "World"}'`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {status === 'error' && error && (
            <Card className="border-red-500/50 bg-red-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  Deployment Failed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Example Python Function</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                <code>{`def hello(name: str = "World"):
    """A simple greeting function"""
    return {
        "message": f"Hello, {name}!",
        "timestamp": "2025-01-15T10:30:00Z"
    }`}</code>
              </pre>
              <p className="text-xs text-muted-foreground mt-2">
                Your function should return a JSON-serializable dict or value
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
