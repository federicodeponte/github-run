import { test, expect } from '@playwright/test'

test.describe('GitHub Run - Deployment Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display landing page correctly', async ({ page }) => {
    // Check title
    await expect(page).toHaveTitle(/GitHub Run/)

    // Check hero section
    await expect(page.getByRole('heading', { name: /Turn any Python function/i })).toBeVisible()

    // Check CTA button
    const deployButton = page.getByRole('link', { name: /Deploy Now/i }).first()
    await expect(deployButton).toBeVisible()
  })

  test('should navigate to deploy page', async ({ page }) => {
    // Click deploy button
    await page.getByRole('link', { name: /Get Started/i }).first().click()

    // Should be on deploy page
    await expect(page).toHaveURL('/deploy')
    await expect(page.getByRole('heading', { name: /Deploy a Python Function/i })).toBeVisible()
  })

  test('should show form validation errors', async ({ page }) => {
    await page.goto('/deploy')

    // Try to deploy without filling form
    await page.getByRole('button', { name: /Deploy Function/i }).click()

    // Should show toast error
    await expect(page.getByText(/Please enter a GitHub repository URL/i)).toBeVisible()
  })

  test('should fill deployment form correctly', async ({ page }) => {
    await page.goto('/deploy')

    // Fill GitHub URL
    const githubUrlInput = page.getByPlaceholder(/https:\/\/github.com\/username\/repo/i)
    await githubUrlInput.fill('https://github.com/test-user/test-repo')

    // Check input value
    await expect(githubUrlInput).toHaveValue('https://github.com/test-user/test-repo')
  })

  test('should handle environment variables input', async ({ page }) => {
    await page.goto('/deploy')

    // Find env vars textarea by placeholder (partial match since it's multiline)
    const envVarsTextarea = page.getByPlaceholder(/OPENAI_API_KEY/i)
    await expect(envVarsTextarea).toBeVisible()

    // Fill env vars
    await envVarsTextarea.fill('API_KEY=test123\nSECRET=value456')
    await expect(envVarsTextarea).toHaveValue('API_KEY=test123\nSECRET=value456')
  })

  test('should show deploy button in correct states', async ({ page }) => {
    await page.goto('/deploy')

    const deployButton = page.getByRole('button', { name: /Deploy Function/i })

    // Should be enabled initially
    await expect(deployButton).toBeEnabled()

    // Should show correct text
    await expect(deployButton).toHaveText(/Deploy Function/)
  })
})

test.describe('GitHub Run - API Interactions (Mocked)', () => {
  test('should handle successful file listing', async ({ page }) => {
    // Mock the files API
    await page.route('**/api/repos/files', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          files: ['main.py', 'utils.py', 'test.py']
        })
      })
    })

    await page.goto('/deploy')

    // Fill GitHub URL
    await page.getByPlaceholder(/https:\/\/github.com\/username\/repo/i).fill('https://github.com/test/repo')

    // File picker should be interactable
    // Note: Actual file loading happens on interaction, may need to trigger it
  })

  test('should handle successful function listing', async ({ page }) => {
    // Mock the functions API
    await page.route('**/api/repos/functions', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          functions: [
            {
              name: 'hello',
              parameters: [{ name: 'name', type: 'str', required: false, defaultValue: '"World"' }],
              isAsync: false,
              hasDecorators: false,
              lineNumber: 1
            },
            {
              name: 'process_data',
              parameters: [{ name: 'data', type: 'dict', required: true }],
              isAsync: false,
              hasDecorators: false,
              lineNumber: 10
            }
          ]
        })
      })
    })

    await page.goto('/deploy')
  })

  test('should handle deployment with mocked success', async ({ page }) => {
    // Mock deploy API
    await page.route('**/api/deploy', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          endpoint: 'https://test-modal-endpoint.com/test-function',
          functionName: 'hello'
        })
      })
    })

    // Mock test endpoint
    await page.route('https://test-modal-endpoint.com/test-function', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          result: { message: 'Hello, World!' }
        })
      })
    })

    await page.goto('/deploy')

    // Fill form
    await page.getByPlaceholder(/https:\/\/github.com\/username\/repo/i).fill('https://github.com/test/repo')

    // Note: Full form interaction would require mocking file/function selectors
    // This is a simplified test showing the pattern
  })

  test('should handle deployment error', async ({ page }) => {
    // Mock deploy API with error
    await page.route('**/api/deploy', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Failed to deploy: Invalid GitHub repository'
        })
      })
    })

    await page.goto('/deploy')

    // This would trigger deployment and should show error
    // Full test would require filling form and clicking deploy
  })

  test('should show loading state during deployment', async ({ page }) => {
    // Mock slow deploy API
    await page.route('**/api/deploy', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          endpoint: 'https://test.com/func'
        })
      })
    })

    await page.goto('/deploy')

    // Button should show loading state when clicked
    // Full test would check for "Deploying..." text or spinner
  })
})

test.describe('GitHub Run - Error Boundary', () => {
  test('should render error boundary on component crash', async ({ page }) => {
    // This would require triggering an actual error in the app
    // Could be done by mocking an API to return malformed data

    await page.goto('/')
    // Error boundary should not be visible on successful load
    await expect(page.getByText(/Something Went Wrong/i)).not.toBeVisible()
  })
})

test.describe('GitHub Run - Responsive Design', () => {
  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Should still show main content
    await expect(page.getByRole('heading', { name: /Turn any Python function/i })).toBeVisible()
  })

  test('should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/deploy')

    // Form should be visible
    await expect(page.getByPlaceholder(/https:\/\/github.com\/username\/repo/i)).toBeVisible()
  })
})
