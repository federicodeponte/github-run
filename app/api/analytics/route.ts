// ABOUTME: Analytics API endpoint for deployment metrics and monitoring
// ABOUTME: Returns aggregated statistics for dashboard visualization

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIp, RateLimits } from '@/lib/security/rate-limit'
import {
  queryDeployments,
  queryDeploymentsByDay,
  queryErrors,
  queryTopFunctions,
} from '@/lib/analytics/queries'
import {
  computeOverview,
  computeTrends,
  computeErrorAnalysis,
  computeTopFunctions,
} from '@/lib/analytics/service'
import type { TimeRange, AnalyticsData } from '@/lib/analytics/types'

/**
 * Query parameters schema
 */
const querySchema = z.object({
  timeRange: z.enum(['24h', '7d', '30d', '90d', 'all']).optional().default('7d'),
})

/**
 * GET /api/analytics
 * Fetch comprehensive analytics data for the specified time range
 *
 * Query parameters:
 * - timeRange: '24h' | '7d' | '30d' | '90d' | 'all' (default: '7d')
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting check
    const clientIp = getClientIp(request)
    const rateLimit = checkRateLimit(clientIp, RateLimits.READ)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: rateLimit.message,
        },
        { status: 429 }
      )
    }

    // Validate query parameters
    const searchParams = request.nextUrl.searchParams
    const validation = querySchema.safeParse({
      timeRange: searchParams.get('timeRange'),
    })

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid time range parameter',
          details: validation.error.issues[0].message,
        },
        { status: 400 }
      )
    }

    const { timeRange } = validation.data

    // Create Supabase client
    const supabase = await createClient()

    // Execute all queries in parallel for performance
    const [deployments, timeSeriesData, errorDeployments, topFunctionsData] = await Promise.all([
      queryDeployments(supabase, timeRange),
      queryDeploymentsByDay(supabase, timeRange),
      queryErrors(supabase, timeRange),
      queryTopFunctions(supabase, timeRange, 10),
    ])

    // Compute analytics from query results
    const overview = computeOverview(deployments)
    const trends = computeTrends(timeSeriesData)
    const errors = computeErrorAnalysis(errorDeployments)
    const topFunctions = computeTopFunctions(topFunctionsData)

    // Construct response
    const analyticsData: AnalyticsData = {
      overview,
      trends,
      errors,
      topFunctions,
      timeRange,
      generatedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      data: analyticsData,
    })
  } catch (error) {
    console.error('Analytics error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch analytics data',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/analytics
 * Return 405 Method Not Allowed
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed. Use GET to fetch analytics data.',
      allowedMethods: ['GET'],
    },
    {
      status: 405,
      headers: {
        Allow: 'GET',
      },
    }
  )
}

/**
 * PUT /api/analytics
 * Return 405 Method Not Allowed
 */
export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed. Use GET to fetch analytics data.',
      allowedMethods: ['GET'],
    },
    {
      status: 405,
      headers: {
        Allow: 'GET',
      },
    }
  )
}

/**
 * DELETE /api/analytics
 * Return 405 Method Not Allowed
 */
export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed. Use GET to fetch analytics data.',
      allowedMethods: ['GET'],
    },
    {
      status: 405,
      headers: {
        Allow: 'GET',
      },
    }
  )
}

/**
 * PATCH /api/analytics
 * Return 405 Method Not Allowed
 */
export async function PATCH() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed. Use GET to fetch analytics data.',
      allowedMethods: ['GET'],
    },
    {
      status: 405,
      headers: {
        Allow: 'GET',
      },
    }
  )
}
