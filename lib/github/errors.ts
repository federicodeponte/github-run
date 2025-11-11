// ABOUTME: Custom error types for GitHub API interactions
// ABOUTME: Provides better error handling and user-friendly messages

export class GitHubAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message)
    this.name = 'GitHubAPIError'
  }
}

export class GitHubAuthError extends GitHubAPIError {
  constructor(message = 'GitHub authentication failed. Please check your Personal Access Token.') {
    super(message, 401)
    this.name = 'GitHubAuthError'
  }
}

export class GitHubNotFoundError extends GitHubAPIError {
  constructor(resource: string) {
    super(`GitHub resource not found: ${resource}`, 404)
    this.name = 'GitHubNotFoundError'
  }
}

export class GitHubRateLimitError extends GitHubAPIError {
  constructor(message = 'GitHub API rate limit exceeded. Please try again later.') {
    super(message, 429)
    this.name = 'GitHubRateLimitError'
  }
}

/**
 * Parse GitHub API error and return appropriate custom error
 */
export function parseGitHubError(error: unknown): GitHubAPIError {
  if (error instanceof GitHubAPIError) {
    return error
  }

  if (error instanceof Response) {
    if (error.status === 401 || error.status === 403) {
      return new GitHubAuthError()
    }
    if (error.status === 404) {
      return new GitHubNotFoundError(error.url)
    }
    if (error.status === 429) {
      return new GitHubRateLimitError()
    }
    return new GitHubAPIError(error.statusText, error.status)
  }

  if (error instanceof Error) {
    return new GitHubAPIError(error.message)
  }

  return new GitHubAPIError('Unknown GitHub API error')
}
