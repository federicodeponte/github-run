// ABOUTME: TypeScript types for GitHub API responses
// ABOUTME: Provides type safety for all GitHub API interactions

/**
 * GitHub API file/directory content response
 * @see https://docs.github.com/en/rest/repos/contents
 */
export interface GitHubContent {
  type: 'file' | 'dir' | 'symlink' | 'submodule'
  name: string
  path: string
  sha: string
  size: number
  url: string
  html_url: string
  git_url: string
  download_url: string | null
  content?: string // Base64 encoded for files
  encoding?: string
  _links: {
    self: string
    git: string
    html: string
  }
}

/**
 * GitHub API tree response
 * Used for recursive repository traversal
 * @see https://docs.github.com/en/rest/git/trees
 */
export interface GitHubTree {
  sha: string
  url: string
  tree: GitHubTreeItem[]
  truncated: boolean
}

export interface GitHubTreeItem {
  path: string
  mode: string
  type: 'blob' | 'tree' | 'commit'
  sha: string
  size?: number
  url: string
}

/**
 * GitHub API error response
 */
export interface GitHubError {
  message: string
  documentation_url?: string
  status?: number
}

/**
 * GitHub repository reference
 */
export interface GitHubRepo {
  owner: string
  repo: string
  branch?: string
}

/**
 * File discovery result
 */
export interface PythonFile {
  path: string
  name: string
  size: number
}
