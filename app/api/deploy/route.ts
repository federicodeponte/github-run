import { NextRequest, NextResponse } from 'next/server'

// Parse GitHub URL to extract owner, repo, and optionally branch
function parseGitHubUrl(url: string) {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/)
  if (!match) {
    throw new Error('Invalid GitHub URL format')
  }
  return {
    owner: match[1],
    repo: match[2].replace('.git', '')
  }
}

// Fetch file content from GitHub
async function fetchGitHubFile(owner: string, repo: string, path: string) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GitHub-Run-MVP'
    }
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`File not found: ${path}`)
    }
    throw new Error(`GitHub API error: ${response.statusText}`)
  }

  const data = await response.json()

  if (data.type !== 'file') {
    throw new Error(`${path} is not a file`)
  }

  // Decode base64 content
  const content = Buffer.from(data.content, 'base64').toString('utf-8')
  return content
}

// Deploy to Modal.com
async function deployToModal(code: string, functionName: string) {
  const modalUrl = 'https://scaile--github-run-mvp-web.modal.run/deploy'

  const response = await fetch(modalUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      code,
      function_name: functionName
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Modal deployment failed')
  }

  const data = await response.json()

  return {
    endpoint: data.endpoint,
    deploymentId: data.deployment_id
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { githubUrl, filePath } = body

    if (!githubUrl || !filePath) {
      return NextResponse.json(
        { error: 'Missing required fields: githubUrl and filePath' },
        { status: 400 }
      )
    }

    // Parse GitHub URL
    const { owner, repo } = parseGitHubUrl(githubUrl)

    // Fetch Python file from GitHub
    const code = await fetchGitHubFile(owner, repo, filePath)

    // Extract function name from file path
    const functionName = filePath.split('/').pop()?.replace('.py', '') || 'function'

    // Deploy to Modal
    const { endpoint, deploymentId } = await deployToModal(code, functionName)

    return NextResponse.json({
      success: true,
      endpoint,
      deploymentId,
      code: code.substring(0, 200) + '...' // Return snippet for verification
    })

  } catch (error: any) {
    console.error('Deployment error:', error)
    return NextResponse.json(
      { error: error.message || 'Deployment failed' },
      { status: 500 }
    )
  }
}
