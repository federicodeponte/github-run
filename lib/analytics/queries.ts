// ABOUTME: Supabase analytics query builders for deployment metrics
// ABOUTME: Pure functions that construct type-safe database queries

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import type { TimeRange } from './types'

type DeploymentRow = Database['public']['Tables']['deployment_history']['Row']

/**
 * Get time range filter for SQL queries
 * Returns ISO timestamp string for the start of the time range
 */
export function getTimeRangeFilter(range: TimeRange): string | null {
  const now = new Date()

  switch (range) {
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
    case 'all':
      return null
    default:
      return null
  }
}

/**
 * Query all deployments within time range
 */
export async function queryDeployments(
  supabase: SupabaseClient<Database>,
  timeRange: TimeRange
): Promise<DeploymentRow[]> {
  let query = supabase
    .from('deployment_history')
    .select('*')
    .order('created_at', { ascending: false })

  const startTime = getTimeRangeFilter(timeRange)
  if (startTime) {
    query = query.gte('created_at', startTime)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error querying deployments:', error)
    return []
  }

  return data || []
}

/**
 * Query deployments grouped by day for time-series charts
 */
export async function queryDeploymentsByDay(
  supabase: SupabaseClient<Database>,
  timeRange: TimeRange
): Promise<Array<{ date: string; successful: number; failed: number }>> {
  const startTime = getTimeRangeFilter(timeRange)

  // For 'all' or long ranges, we'll fetch all data and group in memory
  // In production, you'd use PostgreSQL date_trunc for better performance
  const deployments = await queryDeployments(supabase, timeRange)

  // Group by date
  const grouped = deployments.reduce((acc, deployment) => {
    const date = deployment.created_at.split('T')[0] // Get YYYY-MM-DD

    if (!acc[date]) {
      acc[date] = { date, successful: 0, failed: 0 }
    }

    if (deployment.status === 'success') {
      acc[date].successful++
    } else {
      acc[date].failed++
    }

    return acc
  }, {} as Record<string, { date: string; successful: number; failed: number }>)

  // Convert to array and sort by date
  return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Query error statistics
 */
export async function queryErrors(
  supabase: SupabaseClient<Database>,
  timeRange: TimeRange
): Promise<DeploymentRow[]> {
  let query = supabase
    .from('deployment_history')
    .select('*')
    .eq('status', 'error')
    .order('created_at', { ascending: false })

  const startTime = getTimeRangeFilter(timeRange)
  if (startTime) {
    query = query.gte('created_at', startTime)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error querying errors:', error)
    return []
  }

  return data || []
}

/**
 * Query top functions by deployment count
 */
export async function queryTopFunctions(
  supabase: SupabaseClient<Database>,
  timeRange: TimeRange,
  limit: number = 10
): Promise<Array<{
  functionName: string
  repository: string
  deploymentCount: number
  successCount: number
  lastDeployed: string
}>> {
  const deployments = await queryDeployments(supabase, timeRange)

  // Group by function and repository
  const grouped = deployments.reduce((acc, deployment) => {
    const key = `${deployment.github_url}:${deployment.function_name}`

    if (!acc[key]) {
      acc[key] = {
        functionName: deployment.function_name,
        repository: deployment.github_url,
        deploymentCount: 0,
        successCount: 0,
        lastDeployed: deployment.created_at,
      }
    }

    acc[key].deploymentCount++
    if (deployment.status === 'success') {
      acc[key].successCount++
    }

    // Update last deployed if this is more recent
    if (deployment.created_at > acc[key].lastDeployed) {
      acc[key].lastDeployed = deployment.created_at
    }

    return acc
  }, {} as Record<string, {
    functionName: string
    repository: string
    deploymentCount: number
    successCount: number
    lastDeployed: string
  }>)

  // Convert to array, sort by deployment count, and limit
  return Object.values(grouped)
    .sort((a, b) => b.deploymentCount - a.deploymentCount)
    .slice(0, limit)
}
