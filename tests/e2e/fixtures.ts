import { test as base, expect, Page } from '@playwright/test'

/**
 * Extended test fixtures for SpillNova E2E tests
 */

// Test data constants
export const TEST_DATA = {
  // Test user credentials
  testUser: {
    email: 'test@spillnova.test',
    password: 'TestPassword123!',
    displayName: 'TestReporter',
  },
  // Advertiser credentials
  advertiser: {
    email: 'advertiser@spillnova.test',
    phone: '+27123456789',
    businessName: 'Test Plumbing Services',
  },
  // Sample post content
  samplePost: {
    content: 'Breaking: This is a test post for E2E testing purposes',
    category: 'breaking-news',
    province: 'Gauteng',
    city: 'Johannesburg',
  },
  // Business profile data
  businessProfile: {
    name: 'Test Business',
    description: 'A test business for E2E testing',
    category: 'Plumber',
    phone: '+27123456789',
    email: 'business@test.com',
    province: 'Gauteng',
    city: 'Springs',
    serviceAreas: ['Springs', 'Brakpan', 'Benoni'],
  },
  // Countries for testing
  countries: ['sa', 'ng', 'ke', 'gh'],
  defaultCountry: 'sa',
}

// Helper functions
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle')
}

export async function dismissPopups(page: Page) {
  // Dismiss any popups that might appear (cookie consent, user profile questions, etc.)
  const closeButtons = page.locator('[aria-label="Close"], [aria-label="Dismiss"]')
  const count = await closeButtons.count()
  for (let i = 0; i < count; i++) {
    try {
      await closeButtons.nth(i).click({ timeout: 1000 })
    } catch {
      // Ignore if popup already closed
    }
  }
}

export async function navigateToCountry(page: Page, country: string) {
  await page.goto(`/${country}`)
  await waitForPageLoad(page)
}

export async function navigateToLive(page: Page, country: string = 'sa') {
  await page.goto(`/${country}/live`)
  await waitForPageLoad(page)
}

export async function navigateToDirectory(page: Page, country: string = 'sa') {
  await page.goto(`/${country}/directory`)
  await waitForPageLoad(page)
}

export async function navigateToAdvertise(page: Page, country: string = 'sa') {
  await page.goto(`/${country}/advertise`)
  await waitForPageLoad(page)
}

export async function fillInput(page: Page, selector: string, value: string) {
  const input = page.locator(selector)
  await input.waitFor({ state: 'visible' })
  await input.fill(value)
}

export async function selectOption(page: Page, selector: string, value: string) {
  const select = page.locator(selector)
  await select.waitFor({ state: 'visible' })
  await select.selectOption(value)
}

export async function clickButton(page: Page, text: string) {
  const button = page.getByRole('button', { name: text })
  await button.waitFor({ state: 'visible' })
  await button.click()
}

export async function expectToastMessage(page: Page, message: string) {
  const toast = page.locator(`text=${message}`)
  await expect(toast).toBeVisible({ timeout: 10000 })
}

// Check if element exists without throwing
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  try {
    await page.locator(selector).waitFor({ state: 'visible', timeout: 2000 })
    return true
  } catch {
    return false
  }
}

// Generate unique test data
export function generateUniqueEmail(): string {
  return `test_${Date.now()}@spillnova.test`
}

export function generateUniquePhone(): string {
  return `+2712345${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
}

// Extended test with custom fixtures
export const test = base.extend<{
  authenticatedPage: Page
}>({
  authenticatedPage: async ({ page }, use) => {
    // This would handle authentication if we had a proper auth flow
    // For now, just pass the page through
    await use(page)
  },
})

export { expect }
