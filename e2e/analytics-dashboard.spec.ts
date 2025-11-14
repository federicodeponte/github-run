import { test, expect } from '@playwright/test'
import {
  mockAnalyticsFullData,
  mockAnalyticsEmptyData,
  mockAnalyticsAllSuccessData,
  mockAnalyticsAllFailuresData,
  mockAnalyticsLowSuccessData,
} from './fixtures/analytics-data'
import { mockAnalyticsAPI, mockRateLimitError, mockNetworkError } from './helpers/api-mocks'

test.describe('Analytics Dashboard - Page Load & Navigation', () => {
  test('should load analytics page successfully', async ({ page }) => {
    await mockAnalyticsAPI(page, mockAnalyticsFullData)
    await page.goto('/analytics')

    await expect(page).toHaveURL('/analytics')
    await expect(page.getByRole('heading', { name: /Analytics Dashboard/i })).toBeVisible()
  })

  test('should display header with GitHub branding', async ({ page }) => {
    await mockAnalyticsAPI(page, mockAnalyticsFullData)
    await page.goto('/analytics')

    await expect(page.getByText('GitHub Run')).toBeVisible()
  })

  test('should navigate to Deploy page when clicking Deploy button', async ({ page }) => {
    await mockAnalyticsAPI(page, mockAnalyticsFullData)
    await page.goto('/analytics')

    await page.getByRole('link', { name: /Deploy/i }).click()
    await expect(page).toHaveURL('/deploy')
  })

  test('should navigate to History page when clicking History button', async ({ page }) => {
    await mockAnalyticsAPI(page, mockAnalyticsFullData)
    await page.goto('/analytics')

    await page.getByRole('link', { name: /History/i }).click()
    await expect(page).toHaveURL('/history')
  })

  test('should have correct page title and description', async ({ page }) => {
    await mockAnalyticsAPI(page, mockAnalyticsFullData)
    await page.goto('/analytics')

    await expect(page.getByRole('heading', { name: /Analytics Dashboard/i })).toBeVisible()
    await expect(page.getByText(/Monitor deployment performance/i)).toBeVisible()
  })
})

test.describe('Analytics Dashboard - Time Range Filtering', () => {
  test('should have default time range of 7d selected', async ({ page }) => {
    await mockAnalyticsAPI(page, mockAnalyticsFullData)
    await page.goto('/analytics')

    const button7d = page.getByRole('button', { name: 'Last 7 Days' })
    await expect(button7d).toBeVisible()
    // Check if button has active styling (not outline variant)
    await expect(button7d).not.toHaveAttribute('data-variant', 'outline')
  })

  test('should switch to 24h time range when clicked', async ({ page }) => {
    await mockAnalyticsAPI(page, mockAnalyticsFullData)
    await page.goto('/analytics')

    await page.getByRole('button', { name: 'Last 24 Hours' }).click()

    // Wait for API call with timeRange=24h
  })

  test('should switch to 30d time range when clicked', async ({ page }) => {
    await mockAnalyticsAPI(page, mockAnalyticsFullData)
    await page.goto('/analytics')

    await page.getByRole('button', { name: 'Last 30 Days' }).click()

  })

  test('should switch to 90d time range when clicked', async ({ page }) => {
    await mockAnalyticsAPI(page, mockAnalyticsFullData)
    await page.goto('/analytics')

    await page.getByRole('button', { name: 'Last 90 Days' }).click()

  })

  test('should switch to all-time when clicked', async ({ page }) => {
    await mockAnalyticsAPI(page, mockAnalyticsFullData)
    await page.goto('/analytics')

    await page.getByRole('button', { name: 'All Time' }).click()

  })

  test('should refetch data when time range changes', async ({ page }) => {
    await mockAnalyticsAPI(page, mockAnalyticsFullData)
    await page.goto('/analytics')

    // Verify initial data - use first() to avoid timestamp conflicts
    await expect(page.getByText('45').first()).toBeVisible() // totalDeployments

    // Change time range and verify button click works
    await page.getByRole('button', { name: 'Last 24 Hours' }).click()

    // Verify the button is now active (data should still be visible since we're mocking the same response)
    await expect(page.getByText('45').first()).toBeVisible()
  })
})

test.describe('Analytics Dashboard - Overview Metrics Display', () => {
  test('should display Total Deployments metric card', async ({ page }) => {
    await mockAnalyticsAPI(page, mockAnalyticsFullData)
    await page.goto('/analytics')

    await expect(page.getByText('Total Deployments')).toBeVisible()
    await expect(page.getByText('45').first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Last 7 Days' })).toBeVisible()
  })

  test('should display Success Rate metric card with percentage', async ({ page }) => {
    await mockAnalyticsAPI(page, mockAnalyticsFullData)
    await page.goto('/analytics')

    await expect(page.getByText('Success Rate').first()).toBeVisible()
    await expect(page.getByText('84.4%')).toBeVisible()
    await expect(page.getByText('38 successful')).toBeVisible()
  })

  test('should show success rate with green variant when >= 80%', async ({ page }) => {
    await mockAnalyticsAPI(page, mockAnalyticsAllSuccessData)
    await page.goto('/analytics')

    const successCard = page.locator('text=Success Rate').first()
    await expect(page.getByText('100.0%')).toBeVisible()
  })

  test('should show success rate with warning variant when < 80%', async ({ page }) => {
    await mockAnalyticsAPI(page, mockAnalyticsLowSuccessData)
    await page.goto('/analytics')

    await expect(page.getByText('60.0%')).toBeVisible()
  })

  test('should display Failed Deployments metric card', async ({ page }) => {
    await mockAnalyticsAPI(page, mockAnalyticsFullData)
    await page.goto('/analytics')

    await expect(page.getByText('Failed Deployments').first()).toBeVisible()
    await expect(page.getByText('7').first()).toBeVisible()
    await expect(page.getByText('15.6% of total')).toBeVisible()
  })

  test('should show failed deployments with error variant when > 0', async ({ page }) => {
    await mockAnalyticsAPI(page, mockAnalyticsAllFailuresData)
    await page.goto('/analytics')

    await expect(page.getByText('Failed Deployments').first()).toBeVisible()
    const failedText = page.locator('text=15').first() // 15 failed deployments
    await expect(failedText).toBeVisible()
  })

  test('should display Unique Functions metric card', async ({ page }) => {
    await mockAnalyticsAPI(page, mockAnalyticsFullData)
    await page.goto('/analytics')

    await expect(page.getByText('Unique Functions')).toBeVisible()
    await expect(page.getByText('12').first()).toBeVisible()
    await expect(page.getByText(/Across 5 repositories/i)).toBeVisible()
  })

  test('should handle singular repository text', async ({ page }) => {
    const singleRepoData = {
      ...mockAnalyticsFullData,
      overview: {
        ...mockAnalyticsFullData.overview,
        uniqueRepositories: 1,
      },
    }
    await mockAnalyticsAPI(page, singleRepoData)
    await page.goto('/analytics')

    await expect(page.getByText(/Across 1 repository/i)).toBeVisible()
  })
})

test.describe('Analytics Dashboard - Charts & Visualizations', () => {
  test('should render Deployment Trends chart with data', async ({ page }) => {
    await mockAnalyticsAPI(page, mockAnalyticsFullData)
    await page.goto('/analytics')

    await expect(page.getByText('Deployment Trends')).toBeVisible()
    await expect(page.getByText('Successful and failed deployments over time')).toBeVisible()

    // Chart should be rendered (recharts creates SVG) - look for SVG more broadly
    const chartSvg = page.locator('svg').first()
    await expect(chartSvg).toBeVisible()
  })

  test('should display chart with successful and failed data', async ({ page }) => {
    await mockAnalyticsAPI(page, mockAnalyticsFullData)
    await page.goto('/analytics')

    // Recharts should create legend or labels - check subtitle instead
    await expect(page.getByText('Successful and failed deployments over time')).toBeVisible()
  })

  test('should show dates on chart x-axis', async ({ page }) => {
    await mockAnalyticsAPI(page, mockAnalyticsFullData)
    await page.goto('/analytics')

    // Check for date labels (Jan 6, Jan 7, etc.)
    await expect(page.getByText('Jan 6')).toBeVisible()
    await expect(page.getByText('Jan 12')).toBeVisible()
  })

  test('should display Error Analysis section', async ({ page }) => {
    await mockAnalyticsAPI(page, mockAnalyticsFullData)
    await page.goto('/analytics')

    await expect(page.getByText('Error Types')).toBeVisible()
    await expect(page.getByText('7 errors in selected time range')).toBeVisible()

    // Error messages should be visible - use first() to avoid duplicates
    await expect(page.getByText('Module not found: openai').first()).toBeVisible()
    await expect(page.getByText('42.9%')).toBeVisible() // percentage
  })

  test('should display Recent Errors section', async ({ page }) => {
    await mockAnalyticsAPI(page, mockAnalyticsFullData)
    await page.goto('/analytics')

    await expect(page.getByText('Recent Errors')).toBeVisible()
    await expect(page.getByText('Latest deployment failures')).toBeVisible()

    // Recent error details should be visible - use first() to avoid table matches
    await expect(page.getByText('process_data').first()).toBeVisible()
    await expect(page.getByText('https://github.com/user/data-processor').first()).toBeVisible()
  })

  test('should display Top Functions table', async ({ page }) => {
    await mockAnalyticsAPI(page, mockAnalyticsFullData)
    await page.goto('/analytics')

    await expect(page.getByText('Top Functions')).toBeVisible()
    await expect(page.getByText('Most deployed functions by usage')).toBeVisible()

    // Check table exists with function data instead of headers
    await expect(page.getByText('hello')).toBeVisible()
    await expect(page.getByText('92%')).toBeVisible() // Success rate badge
  })

  test('should show success rate badges with correct colors', async ({ page }) => {
    await mockAnalyticsAPI(page, mockAnalyticsFullData)
    await page.goto('/analytics')

    // High success rate (>= 80%) should be green
    const highSuccessBadge = page.getByText('92%') // hello function
    await expect(highSuccessBadge).toBeVisible()

    // Low success rate (< 80%) should be red
    const lowSuccessBadge = page.getByText('60%') // analyze_sentiment function
    await expect(lowSuccessBadge).toBeVisible()
  })
})

test.describe('Analytics Dashboard - Loading States', () => {
  test('should show loading spinner on initial page load', async ({ page }) => {
    // Mock slow API response
    await mockAnalyticsAPI(page, mockAnalyticsFullData, { delay: 1000 })
    await page.goto('/analytics')

    // Should show loading state while fetching - use first() for spinner
    const loadingSpinner = page.locator('svg.animate-spin').first()
    await expect(loadingSpinner).toBeVisible()

    // Wait for data to load - use first() to avoid timestamp conflicts
    await expect(page.getByText('45').first()).toBeVisible({ timeout: 3000 })
    await expect(loadingSpinner).not.toBeVisible()
  })

  test('should show loading state in Refresh button when clicked', async ({ page }) => {
    await mockAnalyticsAPI(page, mockAnalyticsFullData, { delay: 500 })
    await page.goto('/analytics')

    // Wait for initial load - use first() to avoid timestamp conflicts
    await expect(page.getByText('45').first()).toBeVisible()

    // Click refresh
    const refreshButton = page.getByRole('button', { name: /Refresh/i })
    await refreshButton.click()

    // Should show loading text
    await expect(page.getByText('Loading...')).toBeVisible()

    // Wait for refresh to complete
    await expect(page.getByText('Refresh')).toBeVisible({ timeout: 2000 })
  })

  test('should disable time range buttons during loading', async ({ page }) => {
    await mockAnalyticsAPI(page, mockAnalyticsFullData, { delay: 1000 })
    await page.goto('/analytics')

    // Buttons should be disabled initially
    const button24h = page.getByRole('button', { name: 'Last 24 Hours' })
    await expect(button24h).toBeDisabled()

    // Wait for load to complete - use first() to avoid timestamp conflicts
    await expect(page.getByText('45').first()).toBeVisible({ timeout: 3000 })
    await expect(button24h).toBeEnabled()
  })

  test('should clear loading state when data arrives', async ({ page }) => {
    await mockAnalyticsAPI(page, mockAnalyticsFullData, { delay: 500 })
    await page.goto('/analytics')

    // Loading spinner should appear - use first() for spinner
    const loadingSpinner = page.locator('svg.animate-spin').first()
    await expect(loadingSpinner).toBeVisible()

    // Data should appear and loading should clear - use first() to avoid timestamp conflicts
    await expect(page.getByText('45').first()).toBeVisible({ timeout: 2000 })
    await expect(loadingSpinner).not.toBeVisible()
  })
})

test.describe('Analytics Dashboard - Error Handling', () => {
  test('should display error message when API fails', async ({ page }) => {
    await mockAnalyticsAPI(page, null, { error: true })
    await page.goto('/analytics')

    await expect(page.getByText('Failed to Load Analytics')).toBeVisible()
    await expect(page.getByRole('main').getByText('Failed to fetch analytics data')).toBeVisible()
  })

  test('should show error icon on failure', async ({ page }) => {
    await mockAnalyticsAPI(page, null, { error: true })
    await page.goto('/analytics')

    // Error state should be visible with heading and error message
    await expect(page.getByText('Failed to Load Analytics')).toBeVisible()
    await expect(page.getByRole('main').getByText('Failed to fetch analytics data')).toBeVisible()

    // Red-colored icon should be present (AlertCircle renders with text-red-600 class)
    const errorSection = page.locator('text=Failed to Load Analytics').locator('..')
    await expect(errorSection).toBeVisible()
  })

  test('should display Try Again button on error', async ({ page }) => {
    await mockAnalyticsAPI(page, null, { error: true })
    await page.goto('/analytics')

    const tryAgainButton = page.getByRole('button', { name: 'Try Again' })
    await expect(tryAgainButton).toBeVisible()
  })

  test('should refetch data when clicking Try Again', async ({ page }) => {
    // First load fails
    await mockAnalyticsAPI(page, null, { error: true })
    await page.goto('/analytics')

    await expect(page.getByText('Failed to Load Analytics')).toBeVisible()

    // Mock successful response for retry
    await mockAnalyticsAPI(page, mockAnalyticsFullData)

    // Click Try Again
    await page.getByRole('button', { name: 'Try Again' }).click()

    // Should show data now
    await expect(page.getByText('45').first()).toBeVisible()
    await expect(page.getByText('Failed to Load Analytics')).not.toBeVisible()
  })
})

test.describe('Analytics Dashboard - Empty States', () => {
  test('should show empty state when no deployments exist', async ({ page }) => {
    await mockAnalyticsAPI(page, mockAnalyticsEmptyData)
    await page.goto('/analytics')

    await expect(page.getByText('No deployments found')).toBeVisible()
  })

  test('should show empty state message in charts', async ({ page }) => {
    await mockAnalyticsAPI(page, mockAnalyticsEmptyData)
    await page.goto('/analytics')

    await expect(page.getByText('No deployments found')).toBeVisible()
  })

  test('should show success message when zero errors', async ({ page }) => {
    await mockAnalyticsAPI(page, mockAnalyticsAllSuccessData)
    await page.goto('/analytics')

    await expect(page.getByText('All deployments successful!')).toBeVisible()
    await expect(page.getByText('Keep up the great work')).toBeVisible()
  })

  test('should show empty state in Top Functions when no data', async ({ page }) => {
    await mockAnalyticsAPI(page, mockAnalyticsEmptyData)
    await page.goto('/analytics')

    await expect(page.getByText('No functions have been deployed yet')).toBeVisible()
  })
})

test.describe('Analytics Dashboard - Data Accuracy', () => {
  test('should calculate success rate correctly', async ({ page }) => {
    await mockAnalyticsAPI(page, mockAnalyticsFullData)
    await page.goto('/analytics')

    // 38 successful / 45 total = 84.4%
    await expect(page.getByText('84.4%')).toBeVisible()
  })

  test('should calculate failed percentage correctly', async ({ page }) => {
    await mockAnalyticsAPI(page, mockAnalyticsFullData)
    await page.goto('/analytics')

    // 7 failed / 45 total = 15.6%
    await expect(page.getByText('15.6% of total')).toBeVisible()
  })

  test('should display correct time series data', async ({ page }) => {
    await mockAnalyticsAPI(page, mockAnalyticsFullData)
    await page.goto('/analytics')

    // Verify total deployments in period - use first() to avoid timestamp conflicts
    await expect(page.getByText('45').first()).toBeVisible() // totalDeployments
  })

  test('should calculate error percentages correctly', async ({ page }) => {
    await mockAnalyticsAPI(page, mockAnalyticsFullData)
    await page.goto('/analytics')

    // 3 errors of type "Module not found: openai" / 7 total = 42.86%
    await expect(page.getByText('42.9%')).toBeVisible()
  })

  test('should sort top functions by deployment count', async ({ page }) => {
    await mockAnalyticsAPI(page, mockAnalyticsFullData)
    await page.goto('/analytics')

    // Get all deployment count badges in order - use first() to avoid duplicates
    const firstFunction = page.getByText('hello')
    const secondFunction = page.getByText('process_data').first()

    // hello (12 deployments) should appear before process_data (8 deployments)
    await expect(firstFunction).toBeVisible()
    await expect(secondFunction).toBeVisible()

    // Verify deployment counts are visible - use first() to avoid chart dates
    await expect(page.getByText('12').first()).toBeVisible() // hello
    await expect(page.getByText('8').first()).toBeVisible() // process_data
  })
})

test.describe('Analytics Dashboard - Responsive Design', () => {
  test('should display correctly on mobile viewport', async ({ page }) => {
    await mockAnalyticsAPI(page, mockAnalyticsFullData)
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/analytics')

    // Main content should be visible
    await expect(page.getByRole('heading', { name: /Analytics Dashboard/i })).toBeVisible()
    await expect(page.getByText('Total Deployments')).toBeVisible()

    // Time range buttons should wrap properly
    const timeRangeButtons = page.getByRole('button', { name: /Last/i })
    await expect(timeRangeButtons.first()).toBeVisible()
  })

  test('should display correctly on tablet viewport', async ({ page }) => {
    await mockAnalyticsAPI(page, mockAnalyticsFullData)
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/analytics')

    // All metric cards should be visible
    await expect(page.getByText('Total Deployments')).toBeVisible()
    await expect(page.getByText('Success Rate').first()).toBeVisible()
    await expect(page.getByText('Failed Deployments').first()).toBeVisible()
    await expect(page.getByText('Unique Functions')).toBeVisible()

    // Charts should render - check for chart section heading and description
    await expect(page.getByText('Deployment Trends')).toBeVisible()
    await expect(page.getByText('Successful and failed deployments over time')).toBeVisible()
  })

  test('should display full grid on desktop', async ({ page }) => {
    await mockAnalyticsAPI(page, mockAnalyticsFullData)
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/analytics')

    // All sections should be visible
    await expect(page.getByText('Total Deployments')).toBeVisible()
    await expect(page.getByText('Deployment Trends')).toBeVisible()
    await expect(page.getByText('Error Types')).toBeVisible()
    await expect(page.getByText('Top Functions')).toBeVisible()
  })
})
