// ABOUTME: API endpoint for fetching deployment history from Supabase
// ABOUTME: Returns all deployments with optional filtering and pagination

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    const body = await request.json()

    // Validate required fields
    const requiredFields = ['github_url', 'file_path', 'function_name', 'endpoint', 'deployment_id', 'status']
    const missingFields = requiredFields.filter(field => !body[field])

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Insert deployment record
    const { data, error } = await supabase
      .from('deployment_history')
      .insert({
        github_url: body.github_url as string,
        file_path: body.file_path as string,
        function_name: body.function_name as string,
        endpoint: body.endpoint as string,
        deployment_id: body.deployment_id as string,
        status: body.status as 'success' | 'error',
        error_message: body.error_message || null,
        test_success: body.test_success || null,
        test_response: body.test_response || null,
        test_error: body.test_error || null,
      } as any)
      .select()
      .single()

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
