// ABOUTME: API endpoint for fetching deployment history from Supabase
// ABOUTME: Returns all deployments with optional filtering and pagination

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database'

/**
 * Deployment history insert schema
 * Validates request body for POST endpoint
 */
const deploymentHistorySchema = z.object({
  github_url: z.string().min(1),
  file_path: z.string().min(1),
  function_name: z.string().min(1),
  endpoint: z.string().url(),
  deployment_id: z.string().min(1),
  status: z.enum(['success', 'error']),
  error_message: z.string().nullable().optional(),
  test_success: z.boolean().nullable().optional(),
  test_response: z.unknown().nullable().optional(),
  test_error: z.string().nullable().optional(),
})

type DeploymentHistoryInsert = Database['public']['Tables']['deployment_history']['Insert']

/**
 * GET /api/deployments/history
 * Fetch all deployment history with optional filters
 *
 * Query parameters:
 * - limit: number (default: 50, max: 100)
 * - offset: number (default: 0)
 * - status: 'success' | 'error' (optional filter)
 * - search: string (optional - searches github_url and function_name)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    // Parse query parameters
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const statusFilter = searchParams.get('status') as 'success' | 'error' | null
    const searchQuery = searchParams.get('search')

    // Build query
    let query = supabase
      .from('deployment_history')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply status filter if provided
    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }

    // Apply search filter if provided
    if (searchQuery) {
      query = query.or(
        `github_url.ilike.%${searchQuery}%,function_name.ilike.%${searchQuery}%`
      )
    }

    // Execute query
    const { data, error, count } = await query

    if (error) {
      console.error('Supabase query error:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch deployment history',
          details: error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      deployments: data || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Deployment history error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch deployment history',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/deployments/history
 * Create a new deployment record
 *
 * Body should match Database['public']['Tables']['deployment_history']['Insert']
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json() as unknown

    // Validate request body with Zod
    const validation = deploymentHistorySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
          details: validation.error.issues[0].message,
        },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    // Build insert object with proper null handling
    // Using satisfies to ensure type safety
    const insertData = {
      github_url: validatedData.github_url,
      file_path: validatedData.file_path,
      function_name: validatedData.function_name,
      endpoint: validatedData.endpoint,
      deployment_id: validatedData.deployment_id,
      status: validatedData.status,
      error_message: validatedData.error_message ?? null,
      test_success: validatedData.test_success ?? null,
      test_response: (validatedData.test_response ?? null) as Database['public']['Tables']['deployment_history']['Insert']['test_response'],
      test_error: validatedData.test_error ?? null,
    } satisfies DeploymentHistoryInsert

    // Insert deployment record
    // Using type-safe workaround for Supabase's type inference issues with Next.js async components
    // insertData is validated via Zod and satisfies DeploymentHistoryInsert, making this type assertion safe
    const insertQuery = supabase
      .from('deployment_history')
      // @ts-ignore - Supabase type inference issue with async server components
      .insert(insertData)
      .select()
      .single()

    const { data, error } = await (insertQuery as unknown as Promise<{
      data: Database['public']['Tables']['deployment_history']['Row'] | null
      error: Error | null
    }>)

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to save deployment record',
          details: error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      deployment: data,
    })
  } catch (error) {
    console.error('Deployment save error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save deployment record',
      },
      { status: 500 }
    )
  }
}
