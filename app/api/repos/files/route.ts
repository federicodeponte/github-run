// ABOUTME: API endpoint for discovering Python files in GitHub repositories
// ABOUTME: Supports both public and private repos via GitHub PAT

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createGitHubClient } from '@/lib/github/client'
import { GitHubAuthError, GitHubNotFoundError, parseGitHubError } from '@/lib/github/errors'

/**
 * Request validation schema
 * Using Zod for runtime type safety
 */
const requestSchema = z.object({
  githubUrl: z.string().url('Invalid GitHub URL'),
  token: z.string().optional(),
  branch: z.string().optional(),
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
 * GET /api/repos/files
 * Discover all Python files in a repository
 */
export async function POST(request: NextRequest) {
  try {
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
