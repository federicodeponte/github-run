// ABOUTME: Simple request logging utility for API routes
// ABOUTME: Logs requests with timestamps, IPs, paths, and response times

interface RequestLog {
  timestamp: string
  method: string
  path: string
  ip: string
  userAgent?: string
  duration?: number
  status?: number
  error?: string
}

/**
 * Log an API request
 * In production, this should be sent to a logging service (e.g., Datadog, LogRocket)
 */
export function logRequest(log: RequestLog): void {
  const logEntry = {
    ...log,
    timestamp: new Date().toISOString(),
  }

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    const emoji = log.status && log.status >= 400 ? '❌' : '✅'
    console.log(
      `${emoji} [${logEntry.timestamp}] ${logEntry.method} ${logEntry.path} - ${logEntry.status || '...'} (${logEntry.duration || 0}ms) - IP: ${logEntry.ip}`
    )
    if (log.error) {
      console.error(`  Error: ${log.error}`)
    }
  }

  // In production, send to logging service
  // TODO: Integrate with logging service (Datadog, LogRocket, etc.)
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to external logging service
    // await fetch('https://logs.example.com/api/log', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(logEntry)
    // })
  }
}

/**
 * Middleware wrapper to automatically log requests
 * Usage:
 * export const POST = withRequestLogging(async (request) => { ... })
 */
export function withRequestLogging(
  handler: (request: Request) => Promise<Response>
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    const startTime = Date.now()
    const path = new URL(request.url).pathname
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                request.headers.get('x-real-ip') ||
                'unknown'
    const userAgent = request.headers.get('user-agent') || undefined

    try {
      const response = await handler(request)
      const duration = Date.now() - startTime

      logRequest({
        timestamp: new Date().toISOString(),
        method: request.method,
        path,
        ip,
        userAgent,
        duration,
        status: response.status,
      })

      return response
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : String(error)

      logRequest({
        timestamp: new Date().toISOString(),
        method: request.method,
        path,
        ip,
        userAgent,
        duration,
        status: 500,
        error: errorMessage,
      })

      throw error
    }
  }
}

/**
 * Get client IP address from request
 * (Re-exported from rate-limit for convenience)
 */
export { getClientIp } from './rate-limit'
