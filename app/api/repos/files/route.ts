// ABOUTME: API endpoint for discovering Python files in GitHub repositories
// ABOUTME: Supports both public and private repos via GitHub PAT

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createGitHubClient } from '@/lib/github/client'
import { GitHubAuthError, GitHubNotFoundError, parseGitHubError } from '@/lib/github/errors'
import { checkRateLimit, getClientIp, RateLimits } from '@/lib/security/rate-limit'
import { githubUrlSchema } from '@/lib/security/validation'

/**
 * Request validation schema
 * Using Zod for runtime type safety
 */
const requestSchema = z.object({
  githubUrl: githubUrlSchema,
  token: z.string().optional(),
  branch: z.string().optional(),
})

/**
 * Parse GitHub URL to extract owner and repo
 * Uses URL() for consistent parsing with validation
 */
function parseGitHubUrl(url: string): { owner: string; repo: string } {
  try {
    const parsed = new URL(url)
    const pathMatch = parsed.pathname.match(/^\/([^\/]+)\/([^\/]+)\/?$/)
    if (!pathMatch) {
      throw new Error('Invalid GitHub URL format. Expected: https://github.com/owner/repo')
    }
    return {
      owner: pathMatch[1],
      repo: pathMatch[2].replace('.git', ''),
    }
  } catch (error) {
    throw new Error('Invalid GitHub URL format. Expected: https://github.com/owner/repo')
  }
}

/**
 * GET /api/repos/files
 * Return 405 Method Not Allowed - this endpoint only accepts POST requests
 */
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed. Use POST to list repository files.',
      allowedMethods: ['POST'],
    },
    {
      status: 405,
      headers: {
        Allow: 'POST',
      },
    }
  )
}

/**
 * POST /api/repos/files
 * Discover all Python files in a repository
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const clientIp = getClientIp(request)
    const rateLimit = checkRateLimit(clientIp, RateLimits.LISTING)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: rateLimit.message,
        },
        { status: 429 }
      )
    }

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
        },
        { status: 400 }
      )
    }
    const validation = requestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0].message,
        },
        { status: 400 }
      )
    }

    const { githubUrl, token, branch } = validation.data

    // Parse GitHub URL
    const repo = parseGitHubUrl(githubUrl)

    // Create GitHub client with optional token
    const client = createGitHubClient(token)

    // List all Python files
    const files = await client.listPythonFiles(repo, branch)

    return NextResponse.json({
      success: true,
      files,
      count: files.length,
    })

  } catch (error) {
    // Handle specific GitHub errors
    if (error instanceof GitHubAuthError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication failed. Please check your GitHub Personal Access Token.',
          code: 'AUTH_ERROR',
        },
        { status: 401 }
      )
    }

    if (error instanceof GitHubNotFoundError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Repository not found. Please check the URL or ensure you have access to private repositories.',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      )
    }

    // Generic error handling
    const githubError = parseGitHubError(error)
    console.error('File discovery error:', githubError)

    return NextResponse.json(
      {
        success: false,
        error: githubError.message || 'Failed to list repository files',
      },
      { status: githubError.statusCode || 500 }
    )
  }
}

/**
 * PUT /api/repos/files
 * Return 405 Method Not Allowed
 */
export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed. Use POST to list repository files.',
      allowedMethods: ['GET', 'POST'],
    },
    {
      status: 405,
      headers: {
        Allow: 'GET, POST',
      },
    }
  )
}

/**
 * DELETE /api/repos/files
 * Return 405 Method Not Allowed
 */
export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed. Use POST to list repository files.',
      allowedMethods: ['GET', 'POST'],
    },
    {
      status: 405,
      headers: {
        Allow: 'GET, POST',
      },
    }
  )
}

/**
 * PATCH /api/repos/files
 * Return 405 Method Not Allowed
 */
export async function PATCH() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed. Use POST to list repository files.',
      allowedMethods: ['GET', 'POST'],
    },
    {
      status: 405,
      headers: {
        Allow: 'GET, POST',
      },
    }
  )
}
