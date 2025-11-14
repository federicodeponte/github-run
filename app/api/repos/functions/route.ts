// ABOUTME: API endpoint for analyzing Python files and extracting function definitions
// ABOUTME: Returns list of callable functions with metadata for deployment selection

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createGitHubClient } from '@/lib/github/client'
import { parseGitHubError } from '@/lib/github/errors'
import { extractPythonFunctions, suggestDefaultFunction } from '@/lib/python/parser'
import { checkRateLimit, getClientIp, RateLimits } from '@/lib/security/rate-limit'
import { githubUrlSchema, filePathSchema } from '@/lib/security/validation'

/**
 * Request validation schema
 */
const requestSchema = z.object({
  githubUrl: githubUrlSchema,
  filePath: filePathSchema,
  token: z.string().optional(),
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
 * GET /api/repos/functions
 * Return 405 Method Not Allowed - this endpoint only accepts POST requests
 */
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed. Use POST to analyze Python functions.',
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
 * POST /api/repos/functions
 * Analyze a Python file and extract function definitions
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

    const { githubUrl, filePath, token } = validation.data

    // Parse GitHub URL
    const repo = parseGitHubUrl(githubUrl)

    // Create GitHub client with optional token
    const client = createGitHubClient(token)

    // Fetch Python file content
    const code = await client.fetchFile(repo, filePath)

    // Extract functions from Python code
    const functions = extractPythonFunctions(code)

    // Get filename without extension for default suggestion
    const filename = filePath.split('/').pop()?.replace('.py', '')

    // Suggest a default function
    const defaultFunction = suggestDefaultFunction(functions, filename)

    return NextResponse.json({
      success: true,
      functions,
      defaultFunction: defaultFunction?.name,
      count: functions.length,
    })

  } catch (error) {
    const githubError = parseGitHubError(error)
    console.error('Function analysis error:', githubError)

    return NextResponse.json(
      {
        success: false,
        error: githubError.message || 'Failed to analyze Python file',
      },
      { status: githubError.statusCode || 500 }
    )
  }
}

/**
 * PUT /api/repos/functions
 * Return 405 Method Not Allowed
 */
export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed. Use POST to analyze Python functions.',
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
 * DELETE /api/repos/functions
 * Return 405 Method Not Allowed
 */
export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed. Use POST to analyze Python functions.',
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
 * PATCH /api/repos/functions
 * Return 405 Method Not Allowed
 */
export async function PATCH() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed. Use POST to analyze Python functions.',
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
