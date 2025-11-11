// ABOUTME: API endpoint for deploying Python functions from GitHub to Modal
// ABOUTME: Refactored to use centralized GitHub client (DRY principle)

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createGitHubClient } from '@/lib/github/client'
import { parseGitHubError } from '@/lib/github/errors'

/**
 * Request validation schema
 */
const deployRequestSchema = z.object({
  githubUrl: z.string().url('Invalid GitHub URL'),
  filePath: z.string().min(1, 'File path is required').regex(/\.py$/, 'File must be a Python file (.py)'),
  functionName: z.string().min(1, 'Function name is required').regex(/^[a-zA-Z_]\w*$/, 'Invalid function name'),
  token: z.string().optional(),
  envVars: z.record(z.string(), z.string()).optional(),
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
 * Deploy function to Modal.com
 */
async function deployToModal(
  code: string,
  owner: string,
  repo: string,
  functionName: string,
  envVars?: Record<string, string>
): Promise<{ endpoint: string; deploymentId: string }> {
  const modalUrl = 'https://scaile--github-run-mvp-web.modal.run/deploy'

  const response = await fetch(modalUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code,
      owner,
      repo,
      function_name: functionName,
      env_vars: envVars || {},
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || 'Modal deployment failed')
  }

  const data = await response.json()

  return {
    endpoint: data.endpoint,
    deploymentId: data.deployment_id,
  }
}

/**
 * POST /api/deploy
 * Deploy a Python function from GitHub to Modal
 */
export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const body = await request.json()
    const validation = deployRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0].message,
        },
        { status: 400 }
      )
    }

    const { githubUrl, filePath, functionName, token, envVars } = validation.data

    // Parse GitHub URL
    const { owner, repo } = parseGitHubUrl(githubUrl)

    // Create GitHub client with optional token
    const client = createGitHubClient(token)

    // Fetch Python file from GitHub
    const code = await client.fetchFile({ owner, repo }, filePath)

    // Deploy to Modal with namespacing and environment variables
    const { endpoint, deploymentId } = await deployToModal(code, owner, repo, functionName, envVars)

    return NextResponse.json({
      success: true,
      endpoint,
      deploymentId,
      code: code.substring(0, 200) + '...', // Return snippet for verification
    })

  } catch (error) {
    const githubError = parseGitHubError(error)
    console.error('Deployment error:', githubError)

    return NextResponse.json(
      {
        success: false,
        error: githubError.message || 'Deployment failed',
      },
      { status: githubError.statusCode || 500 }
    )
  }
}
