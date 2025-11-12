// ABOUTME: Simple in-memory rate limiter for API endpoints
// ABOUTME: Prevents abuse by limiting requests per IP address

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed within the window
   */
  max: number

  /**
   * Time window in milliseconds
   */
  windowMs: number

  /**
   * Optional message to return when rate limit is exceeded
   */
  message?: string
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  message?: string
}

/**
 * Check if a request should be rate limited
 *
 * @param identifier - Unique identifier (typically IP address)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const key = identifier

  // Initialize or reset if window has expired
  if (!store[key] || store[key].resetTime < now) {
    store[key] = {
      count: 1,
      resetTime: now + config.windowMs,
    }

    return {
      allowed: true,
      remaining: config.max - 1,
      resetTime: store[key].resetTime,
    }
  }

  // Increment count
  store[key].count++

  // Check if limit exceeded
  if (store[key].count > config.max) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: store[key].resetTime,
      message: config.message || 'Too many requests. Please try again later.',
    }
  }

  return {
    allowed: true,
    remaining: config.max - store[key].count,
    resetTime: store[key].resetTime,
  }
}

/**
 * Get client IP address from request headers
 * Handles various proxy configurations
 */
export function getClientIp(request: Request): string {
  // Check for forwarded IP (from proxies like Vercel, Cloudflare)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  // Check for real IP header
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback to a generic identifier
  return 'unknown'
}

/**
 * Predefined rate limit configurations
 */
export const RateLimits = {
  /**
   * Strict limit for deployment endpoints
   * 10 requests per 15 minutes
   */
  DEPLOYMENT: {
    max: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many deployment attempts. Please wait before trying again.',
  },

  /**
   * Moderate limit for file/function listing
   * 30 requests per 5 minutes
   */
  LISTING: {
    max: 30,
    windowMs: 5 * 60 * 1000, // 5 minutes
    message: 'Too many requests. Please slow down.',
  },

  /**
   * Lenient limit for history/read operations
   * 60 requests per minute
   */
  READ: {
    max: 60,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many requests. Please wait a moment.',
  },
} as const
