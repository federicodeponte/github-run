// ABOUTME: Analytics service layer for computing deployment metrics and statistics
// ABOUTME: Pure functions that transform query results into analytics insights

import type {
  AnalyticsOverview,
  DeploymentTrends,
  ErrorAnalysis,
  TopFunction,
  TimeSeriesDataPoint,
  TimeRange,
} from './types'
import type { Database } from '@/lib/types/database'

type DeploymentRow = Database['public']['Tables']['deployment_history']['Row']

/**
 * Compute overview metrics from deployment data
 */
export function computeOverview(deployments: DeploymentRow[]): AnalyticsOverview {
  const total = deployments.length
  const successful = deployments.filter((d) => d.status === 'success').length
  const failed = total - successful

  // Count unique functions and repositories
  const uniqueFunctions = new Set(deployments.map((d) => `${d.github_url}:${d.function_name}`))
    .size
  const uniqueRepositories = new Set(deployments.map((d) => d.github_url)).size

  return {
    totalDeployments: total,
    successfulDeployments: successful,
    failedDeployments: failed,
    successRate: total > 0 ? (successful / total) * 100 : 0,
    uniqueFunctions,
    uniqueRepositories,
  }
}

/**
 * Compute deployment trends from time-series data
 */
export function computeTrends(
  timeSeriesData: Array<{ date: string; successful: number; failed: number }>
): DeploymentTrends {
  // Convert to TimeSeriesDataPoint format
  const timeSeries: TimeSeriesDataPoint[] = timeSeriesData.map((item) => ({
    timestamp: item.date,
    date: formatDateForDisplay(item.date),
    successful: item.successful,
    failed: item.failed,
    total: item.successful + item.failed,
  }))

  const totalInPeriod = timeSeries.reduce((sum, item) => sum + item.total, 0)
  const successfulInPeriod = timeSeries.reduce((sum, item) => sum + item.successful, 0)
  const successRate = totalInPeriod > 0 ? (successfulInPeriod / totalInPeriod) * 100 : 0

  return {
    timeSeries,
    totalInPeriod,
    successRate,
  }
}

/**
 * Compute error analysis from error deployments
 */
export function computeErrorAnalysis(errorDeployments: DeploymentRow[]): ErrorAnalysis {
  const totalErrors = errorDeployments.length

  // Group errors by message
  const errorCounts = errorDeployments.reduce((acc, deployment) => {
    const message = deployment.error_message || 'Unknown error'
    acc[message] = (acc[message] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Convert to array and calculate percentages
  const errorsByType = Object.entries(errorCounts)
    .map(([errorMessage, count]) => ({
      errorMessage: truncateErrorMessage(errorMessage),
      count,
      percentage: totalErrors > 0 ? (count / totalErrors) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10) // Top 10 error types

  // Get recent errors
  const recentErrors = errorDeployments
    .slice(0, 5)
    .map((deployment) => ({
      timestamp: deployment.created_at,
      functionName: deployment.function_name,
      repository: extractRepositoryName(deployment.github_url),
      errorMessage: truncateErrorMessage(deployment.error_message || 'Unknown error'),
    }))

  return {
    totalErrors,
    errorsByType,
    recentErrors,
  }
}

/**
 * Compute top functions from grouped data
 */
export function computeTopFunctions(
  groupedData: Array<{
    functionName: string
    repository: string
    deploymentCount: number
    successCount: number
    lastDeployed: string
  }>
): TopFunction[] {
  return groupedData.map((item) => ({
    functionName: item.functionName,
    repository: extractRepositoryName(item.repository),
    deploymentCount: item.deploymentCount,
    successRate: item.deploymentCount > 0 ? (item.successCount / item.deploymentCount) * 100 : 0,
    lastDeployed: item.lastDeployed,
  }))
}

/**
 * Helper: Format date for display
 */
function formatDateForDisplay(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Helper: Extract repository name from GitHub URL
 */
function extractRepositoryName(githubUrl: string): string {
  try {
    const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
    if (match) {
      return `${match[1]}/${match[2]}`
    }
    return githubUrl
  } catch {
    return githubUrl
  }
}

/**
 * Helper: Truncate error message for display
 */
function truncateErrorMessage(message: string, maxLength: number = 100): string {
  if (message.length <= maxLength) {
    return message
  }
  return message.substring(0, maxLength) + '...'
}

/**
 * Helper: Get time range label for display
 */
export function getTimeRangeLabel(range: TimeRange): string {
  switch (range) {
    case '24h':
      return 'Last 24 Hours'
    case '7d':
      return 'Last 7 Days'
    case '30d':
      return 'Last 30 Days'
    case '90d':
      return 'Last 90 Days'
    case 'all':
      return 'All Time'
    default:
      return 'Unknown'
  }
}
