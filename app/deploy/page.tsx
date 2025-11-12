'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Github, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { FilePicker } from "@/components/deploy/FilePicker"
import { FunctionSelector } from "@/components/deploy/FunctionSelector"
import { GitHubPATInput } from "@/components/settings/GitHubPATInput"
import { DeploymentProgress } from "@/components/deploy/DeploymentProgress"
import { getGitHubToken } from "@/lib/storage/settings"
import { generateExampleRequest, generateCurlExample } from "@/lib/python/example-generator"
import type { PythonFunction } from "@/lib/python/parser"

type DeployStatus = 'idle' | 'fetching' | 'deploying' | 'testing' | 'success' | 'error'

/**
 * API Response from /api/deploy endpoint
 */
interface DeployApiResponse {
  success: boolean
  endpoint?: string
  deploymentId?: string
  code?: string
  error?: string
}

/**
 * Test result from endpoint validation
 */
interface TestResult {
  success: boolean
  response?: unknown
  error?: string
}

export default function DeployPage() {
  const [githubUrl, setGithubUrl] = useState('')
  const [filePath, setFilePath] = useState('')
  const [functionName, setFunctionName] = useState('')
  const [selectedFunction, setSelectedFunction] = useState<PythonFunction | null>(null)
  const [envVars, setEnvVars] = useState('')
  const [status, setStatus] = useState<DeployStatus>('idle')
  const [endpoint, setEndpoint] = useState('')
  const [error, setError] = useState('')
  const [testResult, setTestResult] = useState<TestResult | null>(null)

  const handleDeploy = async () => {
    if (!githubUrl) {
      toast.error('Please enter a GitHub repository URL')
      return
    }

    if (!filePath) {
      toast.error('Please select a Python file')
      return
    }

    if (!functionName) {
      toast.error('Please select a function to deploy')
      return
    }

    setStatus('fetching')
    setError('')
    setEndpoint('')
    setTestResult(null)

    let data: DeployApiResponse | null = null

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
          functionName,
          token,
          envVars: Object.keys(envVarsObject).length > 0 ? envVarsObject : undefined
        })
      })

      data = await response.json() as DeployApiResponse

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Deployment failed')
      }

      if (!data.endpoint || !data.deploymentId) {
        throw new Error('Invalid response: missing endpoint or deploymentId')
      }

      const deployedEndpoint = data.endpoint
      setEndpoint(deployedEndpoint)

      // Automatically test the deployed endpoint with retry logic
      setStatus('testing')
      toast.info('Deployment successful! Testing endpoint...')

      // Wait 2 seconds for Modal to sync across containers
      await new Promise(resolve => setTimeout(resolve, 2000))

      let testResult: TestResult | null = null
      const maxAttempts = 3

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (attempt > 1) {
          toast.info(`Retrying test (attempt ${attempt}/${maxAttempts})...`)
          await new Promise(resolve => setTimeout(resolve, 1000))
        }

        testResult = await runTest(false)

        // Success - stop retrying
        if (testResult.success) break

        // Retry on transient errors (non-JSON or 404)
        const isTransientError = testResult.error?.includes('non-JSON') ||
                                testResult.error?.includes('404') ||
                                testResult.error?.includes('not found')

        if (!isTransientError || attempt === maxAttempts) break
      }

      setTestResult(testResult!)
      setStatus('success')

      // Save deployment to history
      await saveDeployment(data.deploymentId, deployedEndpoint, 'success', testResult!)

      if (testResult!.success) {
        toast.success('Deployment verified! Endpoint is working correctly.')
      } else {
        toast.warning('Deployment succeeded but automated test failed. Check the error below.')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setStatus('error')
      setError(errorMessage)
      toast.error(errorMessage)
      setTestResult(null)

      // Save failed deployment if we have deployment ID
      if (data?.deploymentId && data?.endpoint) {
        await saveDeployment(data.deploymentId, data.endpoint, 'error', null, errorMessage)
      }
    }
  }

  const saveDeployment = async (
    deploymentId: string,
    deployedEndpoint: string,
    status: 'success' | 'error',
    testResult?: TestResult | null,
    errorMessage?: string
  ) => {
    try {
      await fetch('/api/deployments/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          github_url: githubUrl,
          file_path: filePath,
          function_name: functionName,
          endpoint: deployedEndpoint,
          deployment_id: deploymentId,
          status,
          error_message: errorMessage || null,
          test_success: testResult?.success || null,
          test_response: testResult?.response || null,
          test_error: testResult?.error || null,
        }),
      })
      // Silently fail - don't interrupt user flow if saving fails
    } catch (error) {
      console.error('Failed to save deployment history:', error)
    }
  }

  const runTest = async (showToast = true): Promise<TestResult> => {
    const testPayload = selectedFunction ? generateExampleRequest(selectedFunction, false) : {}

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      })

      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        const text = await response.text()
        const error = `Server returned non-JSON response: ${text.substring(0, 100)}`
        const result = { success: false, error }
        if (showToast) toast.error(`Test failed: ${error}`)
        return result
      }

      const data = await response.json()

      if (response.ok && data.success) {
        const result = { success: true, response: data.result }
        if (showToast) toast.success('Test passed! Function is working correctly.')
        return result
      } else {
        const error = data.detail || data.error || 'Test failed'
        const result = { success: false, error }
        if (showToast) toast.error(`Test failed: ${error}`)
        return result
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during test'
      const result = { success: false, error: errorMessage }
      if (showToast) toast.error(`Test failed: ${errorMessage}`)
      return result
    }
  }

  const testEndpoint = async () => {
    if (!endpoint || !selectedFunction) return
    const result = await runTest(true)
    setTestResult(result)
  }

  // Fetch function metadata when function name changes
  const handleFunctionChange = async (name: string) => {
    setFunctionName(name)

    if (!name || !githubUrl || !filePath) {
      setSelectedFunction(null)
      return
    }

    try {
      const token = getGitHubToken()
      const response = await fetch('/api/repos/functions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubUrl, filePath, token })
      })

      const data = await response.json()
      if (data.success && data.functions) {
        const func = data.functions.find((f: PythonFunction) => f.name === name)
        setSelectedFunction(func || null)
      }
    } catch (err) {
      console.error('Failed to fetch function metadata:', err)
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
          <Link href="/history">
            <Button variant="outline">
              View History
            </Button>
          </Link>
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

              <FunctionSelector
                githubUrl={githubUrl}
                filePath={filePath}
                value={functionName}
                onChange={handleFunctionChange}
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
                disabled={status === 'fetching' || status === 'deploying' || status === 'testing'}
                className="w-full"
              >
                {status === 'fetching' || status === 'deploying' || status === 'testing' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {status === 'fetching' ? 'Fetching code...' : status === 'deploying' ? 'Deploying...' : 'Testing endpoint...'}
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

          {/* Progress Indicator */}
          {(status === 'fetching' || status === 'deploying' || status === 'testing' || status === 'success') && (
            <Card>
              <CardContent className="pt-6">
                <DeploymentProgress status={status} />
              </CardContent>
            </Card>
          )}

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

                {/* Automated Test Results */}
                {testResult && (
                  <div className={`rounded-lg p-4 space-y-2 ${
                    testResult.success
                      ? 'bg-green-500/10 border border-green-500/20'
                      : 'bg-yellow-500/10 border border-yellow-500/20'
                  }`}>
                    <div className="flex items-center gap-2">
                      {testResult.success ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <p className="text-sm font-medium text-green-600">Automated Test Passed</p>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-yellow-600" />
                          <p className="text-sm font-medium text-yellow-600">Automated Test Failed</p>
                        </>
                      )}
                    </div>
                    {testResult.success && testResult.response !== undefined && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Response:</p>
                        <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
                          {JSON.stringify(testResult.response, null, 2)}
                        </pre>
                      </div>
                    )}
                    {!testResult.success && testResult.error && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Error:</p>
                        <pre className="text-xs bg-background p-2 rounded overflow-x-auto text-red-600">
                          {testResult.error}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Manual Test</label>
                  <Button onClick={testEndpoint} variant="outline" className="w-full">
                    Re-test Endpoint
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Test was automatically run on deployment. Click to re-test manually.
                  </p>
                </div>

                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Example cURL Request:</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const curlCmd = selectedFunction
                          ? generateCurlExample(endpoint, selectedFunction)
                          : `curl -X POST ${endpoint} \\\n  -H "Content-Type: application/json" \\\n  -d '{}'`
                        navigator.clipboard.writeText(curlCmd)
                        toast.success('cURL command copied!')
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                  <pre className="text-xs overflow-x-auto">
                    {selectedFunction
                      ? generateCurlExample(endpoint, selectedFunction)
                      : `curl -X POST ${endpoint} \\
  -H "Content-Type: application/json" \\
  -d '{}'`}
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
              <CardContent className="space-y-4">
                <p className="text-sm text-red-600 font-medium">{error}</p>

                {/* Recovery suggestions */}
                <div className="bg-background p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium">💡 Troubleshooting Tips:</p>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    {error.includes('404') || error.includes('not found') ? (
                      <>
                        <li>Check that the GitHub repository URL is correct</li>
                        <li>Verify the file path exists in the repository</li>
                        <li>For private repos, ensure your GitHub token has access</li>
                      </>
                    ) : error.includes('Authentication') || error.includes('401') ? (
                      <>
                        <li>Add a GitHub Personal Access Token above</li>
                        <li>Ensure your token has 'repo' scope permissions</li>
                        <li>Check that the token hasn't expired</li>
                      </>
                    ) : error.includes('rate limit') ? (
                      <>
                        <li>GitHub API rate limit reached</li>
                        <li>Add a GitHub token to increase your rate limit</li>
                        <li>Wait a few minutes and try again</li>
                      </>
                    ) : (
                      <>
                        <li>Check that your function returns a JSON-serializable value</li>
                        <li>Verify the function has no syntax errors</li>
                        <li>Try deploying a simpler function first to test</li>
                      </>
                    )}
                  </ul>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setStatus('idle')}
                  className="w-full"
                >
                  Try Again
                </Button>
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
