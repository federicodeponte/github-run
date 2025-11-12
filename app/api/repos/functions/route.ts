// ABOUTME: API endpoint for analyzing Python files and extracting function definitions
// ABOUTME: Returns list of callable functions with metadata for deployment selection

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createGitHubClient } from '@/lib/github/client'
import { parseGitHubError } from '@/lib/github/errors'
import { extractPythonFunctions, suggestDefaultFunction } from '@/lib/python/parser'
import { checkRateLimit, getClientIp, RateLimits } from '@/lib/security/rate-limit'

/**
 * Request validation schema
 */
const requestSchema = z.object({
  githubUrl: z.string().url('Invalid GitHub URL'),
  filePath: z.string().min(1, 'File path is required').regex(/\.py$/, 'File must be a Python file (.py)'),
  token: z.string().optional(),
})

/**
 * Parse GitHub URL to extract owner and repo
 */
function parseGitHubUrl(url: string): { owner: string; repo: string } {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/)
  if (!match) {
    throw new Error('Invalid GitHub URL format. Expected: https://github.com/owner/repo')
  }
  return {
    owner: match[1],
    repo: match[2].replace('.git', ''),
  }
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

    // Validate request body
    const body = await request.json()
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
