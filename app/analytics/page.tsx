'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Github, Loader2, BarChart3, TrendingUp, AlertCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { MetricCard } from '@/components/analytics/MetricCard'
import { DeploymentChart } from '@/components/analytics/DeploymentChart'
import { ErrorAnalysis } from '@/components/analytics/ErrorAnalysis'
import { TopFunctions } from '@/components/analytics/TopFunctions'
import type { AnalyticsData, TimeRange } from '@/lib/analytics/types'
import { getTimeRangeLabel } from '@/lib/analytics/service'

type LoadingState = 'idle' | 'loading' | 'success' | 'error'

const timeRangeOptions: { value: TimeRange; label: string }[] = [
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'all', label: 'All Time' },
]

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loadingState, setLoadingState] = useState<LoadingState>('idle')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    setLoadingState('loading')
    setError('')

    try {
      const response = await fetch(`/api/analytics?timeRange=${timeRange}`)
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch analytics')
      }

      setData(result.data)
      setLoadingState('success')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics'
      setError(errorMessage)
      setLoadingState('error')
      toast.error(errorMessage)
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
          <div className="flex gap-2">
            <Link href="/history">
              <Button variant="outline">History</Button>
            </Link>
            <Link href="/deploy">
              <Button variant="outline">Deploy</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <BarChart3 className="h-8 w-8" />
                Analytics Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Monitor deployment performance and track success metrics
              </p>
            </div>
            <Button onClick={fetchAnalytics} variant="outline" disabled={loadingState === 'loading'}>
              {loadingState === 'loading' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Refresh'
              )}
            </Button>
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {timeRangeOptions.map((option) => (
              <Button
                key={option.value}
                variant={timeRange === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(option.value)}
                disabled={loadingState === 'loading'}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {loadingState === 'loading' && !data && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {loadingState === 'error' && !data && (
          <div className="text-center py-20">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Failed to Load Analytics</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchAnalytics}>Try Again</Button>
          </div>
        )}

        {data && (
          <div className="space-y-8">
            {/* Overview Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Total Deployments"
                value={data.overview.totalDeployments}
                subtitle={getTimeRangeLabel(timeRange)}
                icon={BarChart3}
              />
              <MetricCard
                title="Success Rate"
                value={`${data.overview.successRate.toFixed(1)}%`}
                subtitle={`${data.overview.successfulDeployments} successful`}
                variant={data.overview.successRate >= 80 ? 'success' : 'warning'}
                icon={TrendingUp}
              />
              <MetricCard
                title="Failed Deployments"
                value={data.overview.failedDeployments}
                subtitle={`${((data.overview.failedDeployments / Math.max(data.overview.totalDeployments, 1)) * 100).toFixed(1)}% of total`}
                variant={data.overview.failedDeployments > 0 ? 'error' : 'success'}
                icon={AlertCircle}
              />
              <MetricCard
                title="Unique Functions"
                value={data.overview.uniqueFunctions}
                subtitle={`Across ${data.overview.uniqueRepositories} ${data.overview.uniqueRepositories === 1 ? 'repository' : 'repositories'}`}
                icon={Clock}
              />
            </div>

            {/* Deployment Trends Chart */}
            <DeploymentChart data={data.trends.timeSeries} type="bar" />

            {/* Two Column Layout */}
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Error Analysis */}
              <ErrorAnalysis data={data.errors} />

              {/* Top Functions */}
              <TopFunctions data={data.topFunctions} />
            </div>

            {/* Metadata */}
            <div className="text-xs text-muted-foreground text-center">
              Last updated: {new Date(data.generatedAt).toLocaleString()}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
