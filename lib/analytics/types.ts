// ABOUTME: Type definitions for analytics and monitoring data structures
// ABOUTME: Provides type safety for metrics, aggregations, and time-series data

/**
 * Time range for analytics queries
 */
export type TimeRange = '24h' | '7d' | '30d' | '90d' | 'all'

/**
 * Overall system metrics
 */
export interface AnalyticsOverview {
  totalDeployments: number
  successfulDeployments: number
  failedDeployments: number
  successRate: number
  averageDeploymentTime?: number
  uniqueFunctions: number
  uniqueRepositories: number
}

/**
 * Time-series data point for charts
 */
export interface TimeSeriesDataPoint {
  timestamp: string
  date: string
  successful: number
  failed: number
  total: number
}

/**
 * Deployment trend data over time
 */
export interface DeploymentTrends {
  timeSeries: TimeSeriesDataPoint[]
  totalInPeriod: number
  successRate: number
}

/**
 * Error analysis data
 */
export interface ErrorAnalysis {
  totalErrors: number
  errorsByType: Array<{
    errorMessage: string
    count: number
    percentage: number
  }>
  recentErrors: Array<{
    timestamp: string
    functionName: string
    repository: string
    errorMessage: string
  }>
}

/**
 * Top function metrics
 */
export interface TopFunction {
  functionName: string
  repository: string
  deploymentCount: number
  successRate: number
  lastDeployed: string
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  averageTestTime?: number
  p95TestTime?: number
  p99TestTime?: number
  slowestEndpoints: Array<{
    endpoint: string
    functionName: string
    averageTime: number
  }>
}

/**
 * Complete analytics response
 */
export interface AnalyticsData {
  overview: AnalyticsOverview
  trends: DeploymentTrends
  errors: ErrorAnalysis
  topFunctions: TopFunction[]
  timeRange: TimeRange
  generatedAt: string
}
