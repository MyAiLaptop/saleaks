import { test, expect, TEST_DATA, waitForPageLoad, dismissPopups } from './fixtures'

test.describe('Navigation & Homepage Tests', () => {
  test.describe('Landing Page', () => {
    test('should load the landing page', async ({ page }) => {
      await page.goto('/')
      await waitForPageLoad(page)

      // Check for SpillNova branding
      await expect(page.locator('text=SpillNova')).toBeVisible()
    })

    test('should display country selection on landing page', async ({ page }) => {
      await page.goto('/')
      await waitForPageLoad(page)

      // Look for country selector or flags
      const countryElements = page.locator('[data-testid="country-selector"], .flag, [class*="flag"]')
      const hasCountrySelection = await countryElements.count() > 0

      // If not on landing, might redirect to default country
      if (!hasCountrySelection) {
        await expect(page).toHaveURL(/\/(sa|ng|ke|gh|us|uk)/)
      }
    })

    test('should redirect to country-specific page', async ({ page }) => {
      await page.goto('/')
      await waitForPageLoad(page)

      // Either shows country selection or redirects
      const url = page.url()
      expect(url).toMatch(/localhost:3000\/?(\?|$|sa|ng|ke)/)
    })
  })

  test.describe('Header Navigation', () => {
    test('should display header with navigation links', async ({ page }) => {
      await page.goto('/sa')
      await waitForPageLoad(page)

      // Check header exists
      const header = page.locator('header')
      await expect(header).toBeVisible()

      // Check logo
      await expect(page.locator('text=SpillNova').first()).toBeVisible()
    })

    test('should navigate to Live page from header', async ({ page }) => {
      await page.goto('/sa')
      await waitForPageLoad(page)

      // Click Live link
      await page.click('a[href*="/live"]')
      await waitForPageLoad(page)

      await expect(page).toHaveURL(/\/sa\/live/)
    })

    test('should navigate to Browse page from header', async ({ page }) => {
      await page.goto('/sa')
      await waitForPageLoad(page)

      await page.click('a[href*="/browse"]')
      await waitForPageLoad(page)

      await expect(page).toHaveURL(/\/sa\/browse/)
    })

    test('should navigate to Directory page from header', async ({ page }) => {
      await page.goto('/sa')
      await waitForPageLoad(page)

      await page.click('a[href*="/directory"]')
      await waitForPageLoad(page)

      await expect(page).toHaveURL(/\/sa\/directory/)
    })

    test('should navigate to Discussions page from header', async ({ page }) => {
      await page.goto('/sa')
      await waitForPageLoad(page)

      await page.click('a[href*="/discussions"]')
      await waitForPageLoad(page)

      await expect(page).toHaveURL(/\/sa\/discussions/)
    })

    test('should navigate to Suggestions page from header', async ({ page }) => {
      await page.goto('/sa')
      await waitForPageLoad(page)

      await page.click('a[href*="/suggestions"]')
      await waitForPageLoad(page)

      await expect(page).toHaveURL(/\/sa\/suggestions/)
    })

    test('should navigate to How It Works page from header', async ({ page }) => {
      await page.goto('/sa')
      await waitForPageLoad(page)

      await page.click('a[href*="/how-it-works"]')
      await waitForPageLoad(page)

      await expect(page).toHaveURL(/\/sa\/how-it-works/)
    })

    test('should navigate to Account page from header', async ({ page }) => {
      await page.goto('/sa')
      await waitForPageLoad(page)

      await page.click('a[href*="/account"]')
      await waitForPageLoad(page)

      await expect(page).toHaveURL(/\/sa\/account/)
    })
  })

  test.describe('Mobile Navigation', () => {
    test.use({ viewport: { width: 375, height: 667 } })

    test('should show mobile menu button', async ({ page }) => {
      await page.goto('/sa')
      await waitForPageLoad(page)

      // Mobile menu button should be visible
      const menuButton = page.locator('button[aria-label*="menu" i], button[aria-label*="Menu" i], [aria-label="Toggle menu"]')
      await expect(menuButton).toBeVisible()
    })

    test('should open mobile menu on click', async ({ page }) => {
      await page.goto('/sa')
      await waitForPageLoad(page)

      // Click mobile menu button
      const menuButton = page.locator('button[aria-label*="menu" i], button[aria-label*="Menu" i], [aria-label="Toggle menu"]')
      await menuButton.click()

      // Menu should now be visible
      await page.waitForTimeout(500) // Wait for animation

      // Check for nav links in mobile menu
      const mobileNav = page.locator('nav')
      await expect(mobileNav).toBeVisible()
    })

    test('should close mobile menu when link clicked', async ({ page }) => {
      await page.goto('/sa')
      await waitForPageLoad(page)

      // Open menu
      const menuButton = page.locator('button[aria-label*="menu" i], button[aria-label*="Menu" i], [aria-label="Toggle menu"]')
      await menuButton.click()
      await page.waitForTimeout(500)

      // Click a link
      await page.click('a[href*="/live"]')
      await waitForPageLoad(page)

      // Should have navigated
      await expect(page).toHaveURL(/\/sa\/live/)
    })
  })

  test.describe('Country Switching', () => {
    test('should maintain navigation when switching countries', async ({ page }) => {
      await page.goto('/sa/live')
      await waitForPageLoad(page)

      // Navigate to Nigeria
      await page.goto('/ng/live')
      await waitForPageLoad(page)

      await expect(page).toHaveURL(/\/ng\/live/)
    })

    for (const country of TEST_DATA.countries) {
      test(`should load ${country} country page`, async ({ page }) => {
        await page.goto(`/${country}`)
        await waitForPageLoad(page)

        // Page should load without errors
        await expect(page.locator('body')).toBeVisible()

        // Check for SpillNova branding
        await expect(page.locator('text=SpillNova').first()).toBeVisible()
      })
    }
  })

  test.describe('Footer & Static Pages', () => {
    test('should load Terms page', async ({ page }) => {
      await page.goto('/terms')
      await waitForPageLoad(page)

      await expect(page).toHaveURL(/\/terms/)
    })

    test('should load Pricing page', async ({ page }) => {
      await page.goto('/pricing')
      await waitForPageLoad(page)

      await expect(page).toHaveURL(/\/pricing/)
    })
  })

  test.describe('404 Error Page', () => {
    test('should show 404 for non-existent pages', async ({ page }) => {
      const response = await page.goto('/sa/non-existent-page-12345')

      // Should return 404 status or show error page
      expect(response?.status()).toBe(404)
    })

    test('should show 404 for invalid country codes', async ({ page }) => {
      const response = await page.goto('/xyz/live')

      // Should return 404 or redirect
      const status = response?.status()
      expect([404, 302, 307].includes(status || 0)).toBeTruthy()
    })
  })
})
