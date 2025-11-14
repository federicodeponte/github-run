'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Github, Search, Filter, Copy, CheckCircle2, XCircle, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import type { Database } from '@/lib/types/database'

type Deployment = Database['public']['Tables']['deployment_history']['Row']

type StatusFilter = 'all' | 'success' | 'error'

export default function HistoryPage() {
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchDeployments()
  }, [statusFilter, searchQuery])

  const fetchDeployments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/deployments/history?${params}`)
      const data = await response.json()

      if (data.success) {
        setDeployments(data.deployments)
      } else {
        toast.error('Failed to load deployment history')
      }
    } catch (error) {
      toast.error('Error loading deployment history')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const copyEndpoint = (endpoint: string) => {
    navigator.clipboard.writeText(endpoint)
    toast.success('Endpoint copied to clipboard!')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Github className="h-6 w-6" />
            <span className="font-bold text-xl">GitHub Run</span>
          </div>
          <div className="flex gap-2">
            <Link href="/deploy">
              <Button variant="outline">Deploy</Button>
            </Link>
            <Link href="/analytics">
              <Button variant="outline">Analytics</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Deployment History</h1>
            <p className="text-muted-foreground">
              View all your previous Python function deployments
            </p>
          </div>

          {/* Search and Filter Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by repository or function name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={statusFilter === 'all' ? 'default' : 'outline'}
                    onClick={() => setStatusFilter('all')}
                    size="sm"
                  >
                    All
                  </Button>
                  <Button
                    variant={statusFilter === 'success' ? 'default' : 'outline'}
                    onClick={() => setStatusFilter('success')}
                    size="sm"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Success
                  </Button>
                  <Button
                    variant={statusFilter === 'error' ? 'default' : 'outline'}
                    onClick={() => setStatusFilter('error')}
                    size="sm"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Error
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deployments Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Deployments</CardTitle>
              <CardDescription>
                {deployments.length} deployment{deployments.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                  Loading deployments...
                </div>
              ) : deployments.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <p className="text-muted-foreground">No deployments found</p>
                  <Link href="/deploy">
                    <Button>Deploy Your First Function</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {deployments.map((deployment) => (
                    <div key={deployment.id} className="border rounded-lg">
                      <div
                        className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => toggleRow(deployment.id)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{deployment.function_name}</span>
                              {deployment.status === 'success' ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {deployment.github_url.replace('https://github.com/', '')} / {deployment.file_path}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(deployment.created_at)}
                            </p>
                          </div>
                          {deployment.status === 'success' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  copyEndpoint(deployment.endpoint)
                                }}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy URL
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.open(deployment.endpoint, '_blank')
                                }}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Open
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedRows.has(deployment.id) && (
                        <div className="border-t px-4 py-4 bg-muted/20 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Endpoint</p>
                              <code className="text-xs bg-background p-2 rounded block overflow-x-auto">
                                {deployment.endpoint}
                              </code>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Deployment ID</p>
                              <code className="text-xs bg-background p-2 rounded block">
                                {deployment.deployment_id}
                              </code>
                            </div>
                          </div>

                          {deployment.test_success !== null && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Test Result</p>
                              <div className={`p-3 rounded-lg ${
                                deployment.test_success
                                  ? 'bg-green-500/10 border border-green-500/20'
                                  : 'bg-red-500/10 border border-red-500/20'
                              }`}>
                                <div className="flex items-center gap-2 mb-2">
                                  {deployment.test_success ? (
                                    <>
                                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                                      <span className="text-sm font-medium text-green-600">Test Passed</span>
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="h-4 w-4 text-red-600" />
                                      <span className="text-sm font-medium text-red-600">Test Failed</span>
                                    </>
                                  )}
                                </div>
                                {deployment.test_success && deployment.test_response && (
                                  <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
                                    {JSON.stringify(deployment.test_response, null, 2)}
                                  </pre>
                                )}
                                {!deployment.test_success && deployment.test_error && (
                                  <p className="text-xs text-red-600">
                                    {deployment.test_error}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {deployment.error_message && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Error Message</p>
                              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                                <p className="text-sm text-red-600">{deployment.error_message}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
