// ABOUTME: Centralized GitHub API client following SOLID principles
// ABOUTME: Single source of truth for all GitHub API interactions

import type { GitHubContent, GitHubTree, GitHubRepo, PythonFile } from './types'
import { GitHubAuthError, GitHubNotFoundError, parseGitHubError } from './errors'

const GITHUB_API_BASE = 'https://api.github.com'

/**
 * GitHub API client configuration
 */
export interface GitHubClientConfig {
  token?: string
  userAgent?: string
}

/**
 * GitHub API client
 * Implements Single Responsibility Principle - only handles GitHub API calls
 */
export class GitHubClient {
  private token?: string
  private userAgent: string

  constructor(config: GitHubClientConfig = {}) {
    this.token = config.token
    this.userAgent = config.userAgent || 'GitHub-Run-MVP'
  }

  /**
   * Set authentication token
   */
  setToken(token: string | undefined): void {
    this.token = token
  }

  /**
   * Make authenticated request to GitHub API
   */
  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': this.userAgent,
      ...(options.headers as Record<string, string>),
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new GitHubAuthError()
      }
      if (response.status === 404) {
        throw new GitHubNotFoundError(url)
      }
      throw parseGitHubError(response)
    }

    return response.json() as Promise<T>
  }

  /**
   * Fetch file content from repository
   */
  async fetchFile(repo: GitHubRepo, filePath: string): Promise<string> {
    const url = `${GITHUB_API_BASE}/repos/${repo.owner}/${repo.repo}/contents/${filePath}`

    const data = await this.request<GitHubContent>(url)

    if (data.type !== 'file') {
      throw new Error(`${filePath} is not a file`)
    }

    if (!data.content) {
      throw new Error(`No content found for ${filePath}`)
    }

    // Decode base64 content
    return Buffer.from(data.content, 'base64').toString('utf-8')
  }

  /**
   * Get repository tree (all files recursively)
   */
  async getTree(repo: GitHubRepo, branch = 'main'): Promise<GitHubTree> {
    // First, get the latest commit SHA for the branch
    const branchUrl = `${GITHUB_API_BASE}/repos/${repo.owner}/${repo.repo}/git/ref/heads/${branch}`

    let treeSha: string
    try {
      const branchData = await this.request<{ object: { sha: string } }>(branchUrl)
      treeSha = branchData.object.sha
    } catch (error) {
      // Try 'master' if 'main' fails
      if (branch === 'main') {
        return this.getTree(repo, 'master')
      }
      throw error
    }

    // Get the commit to find the tree SHA
    const commitUrl = `${GITHUB_API_BASE}/repos/${repo.owner}/${repo.repo}/git/commits/${treeSha}`
    const commitData = await this.request<{ tree: { sha: string } }>(commitUrl)

    // Get the full tree recursively
    const treeUrl = `${GITHUB_API_BASE}/repos/${repo.owner}/${repo.repo}/git/trees/${commitData.tree.sha}?recursive=1`
    return this.request<GitHubTree>(treeUrl)
  }

  /**
   * List all Python files in repository
   * Implements Open/Closed Principle - easy to extend filtering logic
   */
  async listPythonFiles(repo: GitHubRepo, branch?: string): Promise<PythonFile[]> {
    const tree = await this.getTree(repo, branch)

    return tree.tree
      .filter(item => {
        // Only include Python files (blobs ending with .py)
        return item.type === 'blob' && item.path.endsWith('.py')
      })
      .map(item => ({
        path: item.path,
        name: item.path.split('/').pop() || item.path,
        size: item.size || 0,
      }))
      .sort((a, b) => a.path.localeCompare(b.path))
  }
}

/**
 * Singleton instance for server-side use
 * Can be configured with environment variables
 */
export const githubClient = new GitHubClient()

/**
 * Create a client instance with a specific token
 * Useful for per-request authentication
 */
export function createGitHubClient(token?: string): GitHubClient {
  return new GitHubClient({ token })
}
