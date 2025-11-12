// ABOUTME: Typed error hierarchy for better error handling and user-friendly messages
// ABOUTME: Provides structured errors with codes, user messages, and debugging context

/**
 * Base error class for all application errors
 */
export class AppError extends Error {
  public readonly code: string
  public readonly userMessage: string
  public readonly context?: Record<string, any>

  constructor(
    message: string,
    userMessage: string,
    code: string,
    context?: Record<string, any>
  ) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.userMessage = userMessage
    this.context = context
    Error.captureStackTrace(this, this.constructor)
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      context: this.context,
    }
  }
}

/**
 * GitHub-related errors (repos, files, auth)
 */
export class GitHubError extends AppError {
  constructor(message: string, userMessage: string, context?: Record<string, any>) {
    super(message, userMessage, 'GITHUB_ERROR', context)
  }
}

export class GitHubAuthError extends GitHubError {
  constructor(message: string = 'GitHub authentication failed', context?: Record<string, any>) {
    super(
      message,
      'GitHub authentication failed. Please check your Personal Access Token.',
      { ...context, authError: true }
    )
  }
}

export class GitHubNotFoundError extends GitHubError {
  constructor(resource: string, context?: Record<string, any>) {
    super(
      `GitHub resource not found: ${resource}`,
      `Could not find ${resource}. Please check the repository URL and file path.`,
      { ...context, resource }
    )
  }
}

export class GitHubRateLimitError extends GitHubError {
  constructor(resetTime?: Date, context?: Record<string, any>) {
    const resetMsg = resetTime
      ? `Rate limit will reset at ${resetTime.toLocaleTimeString()}`
      : 'Rate limit exceeded'

    super(
      'GitHub API rate limit exceeded',
      `${resetMsg}. Please try again later or use a GitHub token.`,
      { ...context, resetTime }
    )
  }
}

/**
 * Python parsing errors
 */
export class PythonParserError extends AppError {
  constructor(message: string, userMessage: string, context?: Record<string, any>) {
    super(message, userMessage, 'PYTHON_PARSER_ERROR', context)
  }
}

export class NoFunctionsFoundError extends PythonParserError {
  constructor(filePath: string, context?: Record<string, any>) {
    super(
      `No functions found in ${filePath}`,
      'No deployable functions found in this file. Make sure your file contains at least one top-level function.',
      { ...context, filePath }
    )
  }
}

/**
 * Modal deployment errors
 */
export class ModalDeploymentError extends AppError {
  constructor(message: string, userMessage: string, context?: Record<string, any>) {
    super(message, userMessage, 'MODAL_DEPLOYMENT_ERROR', context)
  }
}

export class ModalExecutionError extends ModalDeploymentError {
  constructor(functionName: string, detail: string, context?: Record<string, any>) {
    super(
      `Modal execution failed for ${functionName}: ${detail}`,
      `Function execution failed: ${detail}`,
      { ...context, functionName, detail }
    )
  }
}

export class ModalTimeoutError extends ModalDeploymentError {
  constructor(functionName: string, timeoutMs: number, context?: Record<string, any>) {
    super(
      `Modal execution timeout for ${functionName} after ${timeoutMs}ms`,
      `Function execution timed out after ${timeoutMs / 1000}s. Consider optimizing your function or increasing the timeout.`,
      { ...context, functionName, timeoutMs }
    )
  }
}

/**
 * Network and API errors
 */
export class NetworkError extends AppError {
  constructor(message: string, userMessage: string, context?: Record<string, any>) {
    super(message, userMessage, 'NETWORK_ERROR', context)
  }
}

export class APIError extends NetworkError {
  constructor(
    endpoint: string,
    status: number,
    statusText: string,
    context?: Record<string, any>
  ) {
    super(
      `API request failed: ${status} ${statusText} (${endpoint})`,
      `Request failed with status ${status}. Please try again.`,
      { ...context, endpoint, status, statusText }
    )
  }
}

/**
 * Validation errors
 */
export class ValidationError extends AppError {
  constructor(message: string, userMessage: string, context?: Record<string, any>) {
    super(message, userMessage, 'VALIDATION_ERROR', context)
  }
}

export class InvalidGitHubURLError extends ValidationError {
  constructor(url: string, context?: Record<string, any>) {
    super(
      `Invalid GitHub URL: ${url}`,
      'Please enter a valid GitHub repository URL (e.g., https://github.com/username/repo)',
      { ...context, url }
    )
  }
}

export class InvalidEnvironmentVariableError extends ValidationError {
  constructor(line: string, context?: Record<string, any>) {
    super(
      `Invalid environment variable format: ${line}`,
      'Environment variables must be in KEY=VALUE format, one per line.',
      { ...context, line }
    )
  }
}

/**
 * Helper function to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

/**
 * Extract user-friendly message from any error
 */
export function getUserMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.userMessage
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred. Please try again.'
}

/**
 * Get error code from any error
 */
export function getErrorCode(error: unknown): string {
  if (isAppError(error)) {
    return error.code
  }

  return 'UNKNOWN_ERROR'
}
