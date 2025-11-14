// ABOUTME: Reusable API mocking utilities for E2E tests
// ABOUTME: Provides helpers to mock analytics and deployment history API responses with various scenarios

import type { Page } from '@playwright/test'
import type { AnalyticsData, TimeRange } from '@/lib/analytics/types'
import type { Database } from '@/lib/types/database'

type Deployment = Database['public']['Tables']['deployment_history']['Row']

/**
 * Options for mocking API responses
 */
export interface MockOptions {
  /**
   * Delay in milliseconds before responding
   */
  delay?: number

  /**
   * Simulate an error response
   */
  error?: boolean

  /**
   * HTTP status code (default: 200 for success, 500 for error)
   */
  status?: number

  /**
   * Custom error message
   */
  errorMessage?: string
}

/**
 * Mock the analytics API endpoint with custom data and options
 *
 * @param page - Playwright page object
 * @param data - Analytics data to return (or null for default)
 * @param options - Mock options (delay, error, status)
 *
 * @example
 * ```typescript
 * // Mock successful response with data
 * await mockAnalyticsAPI(page, mockAnalyticsFullData)
 *
 * // Mock slow API (2 second delay)
 * await mockAnalyticsAPI(page, mockAnalyticsFullData, { delay: 2000 })
 *
 * // Mock error response
 * await mockAnalyticsAPI(page, null, { error: true })
 *
 * // Mock custom error
 * await mockAnalyticsAPI(page, null, {
 *   error: true,
 *   errorMessage: 'Rate limit exceeded'
 * })
 * ```
 */
export async function mockAnalyticsAPI(
  page: Page,
  data: AnalyticsData | null,
  options: MockOptions = {}
): Promise<void> {
  const { delay = 0, error = false, status, errorMessage = 'Failed to fetch analytics data' } = options

  await page.route('**/api/analytics*', async (route) => {
    // Simulate network delay if specified
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay))
    }

    // Simulate error response
    if (error) {
      await route.fulfill({
        status: status ?? 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: errorMessage,
        }),
      })
      return
    }

    // Success response
    await route.fulfill({
      status: status ?? 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data,
      }),
    })
  })
}

/**
 * Mock analytics API for a specific time range
 *
 * @param page - Playwright page object
 * @param timeRange - Time range to match
 * @param data - Analytics data to return
 * @param options - Mock options
 *
 * @example
 * ```typescript
 * // Mock 24h data
 * await mockAnalyticsAPIForTimeRange(page, '24h', mockData24h)
 *
 * // Mock 7d data (default)
 * await mockAnalyticsAPIForTimeRange(page, '7d', mockData7d)
 * ```
 */
export async function mockAnalyticsAPIForTimeRange(
  page: Page,
  timeRange: TimeRange,
  data: AnalyticsData,
  options: MockOptions = {}
): Promise<void> {
  const { delay = 0, error = false, status, errorMessage = 'Failed to fetch analytics data' } = options

  await page.route(`**/api/analytics?timeRange=${timeRange}*`, async (route) => {
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay))
    }

    if (error) {
      await route.fulfill({
        status: status ?? 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: errorMessage,
        }),
      })
      return
    }

    await route.fulfill({
      status: status ?? 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data,
      }),
    })
  })
}

/**
 * Mock rate limit error
 *
 * @param page - Playwright page object
 *
 * @example
 * ```typescript
 * await mockRateLimitError(page)
 * ```
 */
export async function mockRateLimitError(page: Page): Promise<void> {
  await page.route('**/api/analytics*', async (route) => {
    await route.fulfill({
      status: 429,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
      }),
    })
  })
}

/**
 * Mock network error (connection failure)
 *
 * @param page - Playwright page object
 *
 * @example
 * ```typescript
 * await mockNetworkError(page)
 * ```
 */
export async function mockNetworkError(page: Page): Promise<void> {
  await page.route('**/api/analytics*', async (route) => {
    await route.abort('failed')
  })
}

/**
 * Mock the deployment history API endpoint with custom data and options
 *
 * @param page - Playwright page object
 * @param deployments - Array of deployments to return (or null for default)
 * @param options - Mock options (delay, error, status)
 *
 * @example
 * ```typescript
 * // Mock successful response with deployments
 * await mockDeploymentHistoryAPI(page, mockDeploymentsFull)
 *
 * // Mock slow API (2 second delay)
 * await mockDeploymentHistoryAPI(page, mockDeploymentsFull, { delay: 2000 })
 *
 * // Mock error response
 * await mockDeploymentHistoryAPI(page, null, { error: true })
 * ```
 */
export async function mockDeploymentHistoryAPI(
  page: Page,
  deployments: Deployment[] | null,
  options: MockOptions = {}
): Promise<void> {
  const { delay = 0, error = false, status, errorMessage = 'Failed to load deployment history' } = options

  await page.route('**/api/deployments/history*', async (route) => {
    // Simulate network delay if specified
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay))
    }

    // Simulate error response
    if (error) {
      await route.fulfill({
        status: status ?? 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: errorMessage,
        }),
      })
      return
    }

    // Success response
    await route.fulfill({
      status: status ?? 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        deployments: deployments ?? [],
      }),
    })
  })
}
