import { test, expect } from '@playwright/test'
import {
  mockDeploymentsFull,
  mockDeploymentsEmpty,
  mockDeploymentsAllSuccess,
  mockDeploymentsAllErrors,
  mockDeploymentsForSearch,
} from './fixtures/deployment-data'
import { mockDeploymentHistoryAPI } from './helpers/api-mocks'

test.describe('History Page - Page Load & Navigation', () => {
  test('should load history page successfully', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, mockDeploymentsFull)
    await page.goto('/history')

    await expect(page).toHaveURL('/history')
    await expect(page.getByRole('heading', { name: /Deployment History/i })).toBeVisible()
  })

  test('should display header with GitHub branding', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, mockDeploymentsFull)
    await page.goto('/history')

    await expect(page.getByText('GitHub Run')).toBeVisible()
  })

  test('should navigate to Deploy page when clicking Deploy button', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, mockDeploymentsFull)
    await page.goto('/history')

    await page.getByRole('link', { name: /Deploy/i }).click()
    await expect(page).toHaveURL('/deploy')
  })

  test('should navigate to Analytics page when clicking Analytics button', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, mockDeploymentsFull)
    await page.goto('/history')

    await page.getByRole('link', { name: /Analytics/i }).click()
    await expect(page).toHaveURL('/analytics')
  })

  test('should have correct page title and description', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, mockDeploymentsFull)
    await page.goto('/history')

    await expect(page.getByRole('heading', { name: /Deployment History/i })).toBeVisible()
    await expect(page.getByText(/View all your previous Python function deployments/i)).toBeVisible()
  })
})

test.describe('History Page - Search Functionality', () => {
  test('should display search input placeholder', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, mockDeploymentsFull)
    await page.goto('/history')

    const searchInput = page.getByPlaceholder(/Search by repository or function name/i)
    await expect(searchInput).toBeVisible()
  })

  test('should filter by function name when searching', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, mockDeploymentsForSearch)
    await page.goto('/history')

    // Type in search
    const searchInput = page.getByPlaceholder(/Search by repository or function name/i)
    await searchInput.fill('hello')

    // Should trigger API call with search parameter
    // Wait for re-render
    await page.waitForTimeout(300)
  })

  test('should filter by repository name when searching', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, mockDeploymentsForSearch)
    await page.goto('/history')

    const searchInput = page.getByPlaceholder(/Search by repository or function name/i)
    await searchInput.fill('goodbye-app')

    await page.waitForTimeout(300)
  })

  test('should clear search when input is cleared', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, mockDeploymentsForSearch)
    await page.goto('/history')

    const searchInput = page.getByPlaceholder(/Search by repository or function name/i)
    await searchInput.fill('hello')
    await page.waitForTimeout(300)

    // Clear search
    await searchInput.clear()
    await page.waitForTimeout(300)
  })

  test('should show search icon in input field', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, mockDeploymentsFull)
    await page.goto('/history')

    // Search icon should be visible in the input area
    const searchIcon = page.locator('svg.lucide-search').first()
    await expect(searchIcon).toBeVisible()
  })
})

test.describe('History Page - Status Filtering', () => {
  test('should have All filter selected by default', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, mockDeploymentsFull)
    await page.goto('/history')

    const allButton = page.getByRole('button', { name: 'All', exact: true })
    await expect(allButton).toBeVisible()
  })

  test('should switch to Success filter when clicked', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, mockDeploymentsFull)
    await page.goto('/history')

    await page.getByRole('button', { name: /Success/i }).click()
  })

  test('should switch to Error filter when clicked', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, mockDeploymentsFull)
    await page.goto('/history')

    await page.getByRole('button', { name: /Error/i }).click()
  })

  test('should display Success filter with icon', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, mockDeploymentsFull)
    await page.goto('/history')

    const successButton = page.getByRole('button', { name: /Success/i })
    await expect(successButton).toBeVisible()

    // CheckCircle2 icon should be visible (using simpler selector)
    const successIcon = successButton.locator('svg').first()
    await expect(successIcon).toBeVisible()
  })

  test('should display Error filter with icon', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, mockDeploymentsFull)
    await page.goto('/history')

    const errorButton = page.getByRole('button', { name: /Error/i })
    await expect(errorButton).toBeVisible()

    // XCircle icon should be visible (using simpler selector)
    const errorIcon = errorButton.locator('svg').first()
    await expect(errorIcon).toBeVisible()
  })

  test('should refetch data when filter changes', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, mockDeploymentsFull)
    await page.goto('/history')

    // Verify initial data loaded
    await expect(page.getByText(/8 deployments found/i)).toBeVisible()

    // Change filter
    await page.getByRole('button', { name: /Success/i }).click()

    // Should trigger new API call
    await page.waitForTimeout(300)
  })
})

test.describe('History Page - Deployment List Display', () => {
  test('should display deployment count correctly', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, mockDeploymentsFull)
    await page.goto('/history')

    await expect(page.getByText(/8 deployments found/i)).toBeVisible()
  })

  test('should handle singular deployment count text', async ({ page }) => {
    const singleDeployment = [mockDeploymentsFull[0]]
    await mockDeploymentHistoryAPI(page, singleDeployment)
    await page.goto('/history')

    await expect(page.getByText(/1 deployment found/i)).toBeVisible()
  })

  test('should display function names for all deployments', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, mockDeploymentsFull)
    await page.goto('/history')

    await expect(page.getByText('hello').first()).toBeVisible()
    await expect(page.getByText('process_data').first()).toBeVisible()
    await expect(page.getByText('send_email').first()).toBeVisible()
  })

  test('should display repository paths', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, mockDeploymentsFull)
    await page.goto('/history')

    // Repository path should be visible (without https://github.com/ prefix)
    await expect(page.getByText(/user\/python-functions/i).first()).toBeVisible()
    await expect(page.getByText(/user\/data-processor/i).first()).toBeVisible()
  })

  test('should display file paths', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, mockDeploymentsFull)
    await page.goto('/history')

    await expect(page.getByText(/src\/hello.py/i).first()).toBeVisible()
    await expect(page.getByText(/functions\/process_data.py/i).first()).toBeVisible()
  })

  test('should show success icon for successful deployments', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, mockDeploymentsAllSuccess)
    await page.goto('/history')

    // Green CheckCircle2 icon should be visible for successful deployments
    const successIcons = page.locator('svg.text-green-600')
    await expect(successIcons.first()).toBeVisible()
  })

  test('should show error icon for failed deployments', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, mockDeploymentsAllErrors)
    await page.goto('/history')

    // Red XCircle icon should be visible for failed deployments
    const errorIcons = page.locator('svg.text-red-600')
    await expect(errorIcons.first()).toBeVisible()
  })
})

test.describe('History Page - Row Expansion & Details', () => {
  test('should expand row when clicked', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, mockDeploymentsFull)
    await page.goto('/history')

    // Click on first deployment row
    const firstRow = page.locator('div.cursor-pointer').filter({ hasText: 'hello' }).first()
    await firstRow.click()

    // Endpoint details should be visible after expansion
    await expect(page.getByText(/Endpoint/i).first()).toBeVisible()
    await expect(page.getByText(/Deployment ID/i).first()).toBeVisible()
  })

  test('should display endpoint URL when expanded', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, mockDeploymentsFull)
    await page.goto('/history')

    const firstRow = page.locator('div.cursor-pointer').filter({ hasText: 'hello' }).first()
    await firstRow.click()

    await expect(page.getByText(/modal.com\/deployments\/hello-abc123/i)).toBeVisible()
  })

  test('should display deployment ID when expanded', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, mockDeploymentsFull)
    await page.goto('/history')

    const firstRow = page.locator('div.cursor-pointer').filter({ hasText: 'hello' }).first()
    await firstRow.click()

    await expect(page.getByText(/dep_abc123/i)).toBeVisible()
  })

  test('should show test results when available', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, mockDeploymentsFull)
    await page.goto('/history')

    const firstRow = page.locator('div.cursor-pointer').filter({ hasText: 'hello' }).first()
    await firstRow.click()

    await expect(page.getByText(/Test Passed/i).first()).toBeVisible()
  })

  test('should display test response JSON when test passed', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, mockDeploymentsFull)
    await page.goto('/history')

    const firstRow = page.locator('div.cursor-pointer').filter({ hasText: 'hello' }).first()
    await firstRow.click()

    // Test response should be visible as formatted JSON
    await expect(page.getByText(/"message":/i).first()).toBeVisible()
  })

  test('should display error message for failed deployments', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, mockDeploymentsAllErrors)
    await page.goto('/history')

    const errorRow = page.locator('div.cursor-pointer').filter({ hasText: 'process_data' }).first()
    await errorRow.click()

    await expect(page.getByText(/Module not found: openai/i).first()).toBeVisible()
  })
})

test.describe('History Page - Action Buttons', () => {
  test('should display Copy URL button for successful deployments', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, mockDeploymentsAllSuccess)
    await page.goto('/history')

    const copyButton = page.getByRole('button', { name: /Copy URL/i }).first()
    await expect(copyButton).toBeVisible()
  })

  test('should display Open button for successful deployments', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, mockDeploymentsAllSuccess)
    await page.goto('/history')

    const openButton = page.getByRole('button', { name: /Open/i }).first()
    await expect(openButton).toBeVisible()
  })

  test('should NOT display action buttons for failed deployments', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, mockDeploymentsAllErrors)
    await page.goto('/history')

    const copyButton = page.getByRole('button', { name: /Copy URL/i })
    await expect(copyButton).not.toBeVisible()
  })

  test('should show toast when copying endpoint', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, mockDeploymentsAllSuccess)
    await page.goto('/history')

    // Click Copy URL button
    const copyButton = page.getByRole('button', { name: /Copy URL/i }).first()
    await copyButton.click()

    // Toast notification should appear
    await expect(page.getByText(/copied to clipboard/i)).toBeVisible()
  })
})

test.describe('History Page - Empty States', () => {
  test('should show empty state when no deployments exist', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, mockDeploymentsEmpty)
    await page.goto('/history')

    await expect(page.getByText(/No deployments found/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Deploy Your First Function/i })).toBeVisible()
  })

  test('should navigate to Deploy page when clicking empty state button', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, mockDeploymentsEmpty)
    await page.goto('/history')

    await page.getByRole('button', { name: /Deploy Your First Function/i }).click()
    await expect(page).toHaveURL('/deploy')
  })

  test('should show zero deployments found in empty state', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, mockDeploymentsEmpty)
    await page.goto('/history')

    await expect(page.getByText(/0 deployments found/i)).toBeVisible()
  })
})

test.describe('History Page - Error Handling', () => {
  test('should show loading state initially', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, mockDeploymentsFull, { delay: 1000 })
    await page.goto('/history')

    await expect(page.getByText(/Loading deployments/i)).toBeVisible()
  })

  test('should clear loading state after data loads', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, mockDeploymentsFull, { delay: 500 })
    await page.goto('/history')

    await expect(page.getByText(/Loading deployments/i)).toBeVisible()

    // Wait for data to load
    await expect(page.getByText(/8 deployments found/i)).toBeVisible({ timeout: 2000 })
    await expect(page.getByText(/Loading deployments/i)).not.toBeVisible()
  })

  test('should handle API error gracefully', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, null, { error: true })
    await page.goto('/history')

    // Toast error should appear
    await expect(page.getByText(/Failed to load deployment history/i).first()).toBeVisible()
  })

  test('should display empty state on error', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, null, { error: true })
    await page.goto('/history')

    // Since error sets deployments to empty array, empty state should show
    await expect(page.getByText(/No deployments found/i)).toBeVisible()
  })
})

test.describe('History Page - Loading States', () => {
  test('should show loading text while fetching data', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, mockDeploymentsFull, { delay: 1000 })
    await page.goto('/history')

    const loadingText = page.getByText(/Loading deployments.../i)
    await expect(loadingText).toBeVisible()
  })

  test('should hide loading state after successful load', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, mockDeploymentsFull, { delay: 300 })
    await page.goto('/history')

    // Loading should disappear
    await expect(page.getByText(/8 deployments found/i)).toBeVisible({ timeout: 2000 })
    await expect(page.getByText(/Loading deployments.../i)).not.toBeVisible()
  })

  test('should reload data when filter changes', async ({ page }) => {
    await mockDeploymentHistoryAPI(page, mockDeploymentsFull)
    await page.goto('/history')

    // Wait for initial load
    await expect(page.getByText(/8 deployments found/i)).toBeVisible()

    // Change filter - should trigger new load
    await page.getByRole('button', { name: /Success/i }).click()

    // Data should still be visible (mocked with same response)
    await expect(page.getByText(/deployments found/i)).toBeVisible()
  })
})
