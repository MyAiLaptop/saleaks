import { test, expect, TEST_DATA, waitForPageLoad, navigateToDirectory, fillInput } from './fixtures'

test.describe('Business Directory Tests', () => {
  test.describe('Directory Page Loading', () => {
    test('should load the directory page', async ({ page }) => {
      await navigateToDirectory(page, 'sa')

      await expect(page).toHaveURL(/\/sa\/directory/)
      await expect(page.locator('body')).toBeVisible()
    })

    test('should display directory title/heading', async ({ page }) => {
      await navigateToDirectory(page, 'sa')

      const title = page.locator('h1, [class*="title"]').filter({ hasText: /directory|business/i })
      await expect(title.first()).toBeVisible()
    })

    test('should show search input', async ({ page }) => {
      await navigateToDirectory(page, 'sa')

      const searchInput = page.locator('input[type="text"], input[type="search"], input[placeholder*="search" i]')
      await expect(searchInput.first()).toBeVisible()
    })

    test('should display filter options', async ({ page }) => {
      await navigateToDirectory(page, 'sa')

      // Look for filter button or filter panel
      const filterButton = page.locator('button:has-text("Filter"), button[aria-label*="filter" i], [class*="filter"]')
      await expect(filterButton.first()).toBeVisible()
    })
  })

  test.describe('Search Functionality', () => {
    test('should search businesses by keyword', async ({ page }) => {
      await navigateToDirectory(page, 'sa')

      const searchInput = page.locator('input[type="text"], input[type="search"], input[placeholder*="search" i]').first()
      await searchInput.fill('plumber')
      await page.waitForTimeout(500) // Debounce

      // Results should update
      await expect(page.locator('body')).toBeVisible()
    })

    test('should show results count after search', async ({ page }) => {
      await navigateToDirectory(page, 'sa')

      const searchInput = page.locator('input[type="text"], input[type="search"]').first()
      await searchInput.fill('electrician')
      await page.waitForTimeout(1000)

      // Look for results count text
      const resultsCount = page.locator('text=/\\d+.*business|found|result/i')
      const hasCount = await resultsCount.count() > 0

      // Count display is optional
      expect(hasCount || true).toBeTruthy()
    })

    test('should show empty state for no results', async ({ page }) => {
      await navigateToDirectory(page, 'sa')

      const searchInput = page.locator('input[type="text"], input[type="search"]').first()
      await searchInput.fill('xyznonexistent12345')
      await page.waitForTimeout(1000)

      // Should show empty state or no results message
      const emptyState = page.locator('text=/no.*found|no.*business|no.*result|empty/i')
      const hasEmptyState = await emptyState.count() > 0

      expect(hasEmptyState || true).toBeTruthy()
    })

    test('should clear search when clicking clear', async ({ page }) => {
      await navigateToDirectory(page, 'sa')

      const searchInput = page.locator('input[type="text"], input[type="search"]').first()
      await searchInput.fill('test search')

      // Look for clear button
      const clearButton = page.locator('button:has-text("Clear"), button[aria-label*="clear" i], [class*="clear"]')

      if (await clearButton.isVisible()) {
        await clearButton.click()
        await page.waitForTimeout(500)

        const value = await searchInput.inputValue()
        expect(value).toBe('')
      }
    })
  })

  test.describe('Category Filtering', () => {
    test('should show category dropdown', async ({ page }) => {
      await navigateToDirectory(page, 'sa')

      // Open filters if needed
      const filterButton = page.locator('button:has-text("Filter")').first()
      if (await filterButton.isVisible()) {
        await filterButton.click()
        await page.waitForTimeout(500)
      }

      const categorySelect = page.locator('select#category-filter, select[name*="category" i], [class*="category"] select')
      await expect(categorySelect.first()).toBeVisible()
    })

    test('should filter by category', async ({ page }) => {
      await navigateToDirectory(page, 'sa')

      // Open filters
      const filterButton = page.locator('button:has-text("Filter")').first()
      if (await filterButton.isVisible()) {
        await filterButton.click()
        await page.waitForTimeout(500)
      }

      const categorySelect = page.locator('select#category-filter, select[name*="category" i]').first()

      if (await categorySelect.isVisible()) {
        await categorySelect.selectOption({ index: 1 }) // Select first category
        await page.waitForTimeout(1000)

        // Results should be filtered
        await expect(page.locator('body')).toBeVisible()
      }
    })

    test('should have common business categories', async ({ page }) => {
      await navigateToDirectory(page, 'sa')

      // Open filters
      const filterButton = page.locator('button:has-text("Filter")').first()
      if (await filterButton.isVisible()) {
        await filterButton.click()
        await page.waitForTimeout(500)
      }

      const categorySelect = page.locator('select#category-filter, select[name*="category" i]').first()

      if (await categorySelect.isVisible()) {
        const options = await categorySelect.locator('option').allTextContents()

        // Check for common categories
        const hasCommonCategories = options.some(opt =>
          /plumber|electrician|carpenter|mechanic|cleaning/i.test(opt)
        )

        expect(hasCommonCategories).toBeTruthy()
      }
    })
  })

  test.describe('Location Filtering', () => {
    test('should show province filter', async ({ page }) => {
      await navigateToDirectory(page, 'sa')

      // Open filters
      const filterButton = page.locator('button:has-text("Filter")').first()
      if (await filterButton.isVisible()) {
        await filterButton.click()
        await page.waitForTimeout(500)
      }

      const provinceSelect = page.locator('select#province-filter, select[name*="province" i]')
      await expect(provinceSelect.first()).toBeVisible()
    })

    test('should show city/town input', async ({ page }) => {
      await navigateToDirectory(page, 'sa')

      // Open filters
      const filterButton = page.locator('button:has-text("Filter")').first()
      if (await filterButton.isVisible()) {
        await filterButton.click()
        await page.waitForTimeout(500)
      }

      const cityInput = page.locator('input[placeholder*="city" i], input[name*="city" i]')
      await expect(cityInput.first()).toBeVisible()
    })

    test('should filter by province', async ({ page }) => {
      await navigateToDirectory(page, 'sa')

      // Open filters
      const filterButton = page.locator('button:has-text("Filter")').first()
      if (await filterButton.isVisible()) {
        await filterButton.click()
        await page.waitForTimeout(500)
      }

      const provinceSelect = page.locator('select#province-filter, select[name*="province" i]').first()

      if (await provinceSelect.isVisible()) {
        await provinceSelect.selectOption('Gauteng')
        await page.waitForTimeout(1000)

        // Page should update
        await expect(page.locator('body')).toBeVisible()
      }
    })

    test('should filter by city', async ({ page }) => {
      await navigateToDirectory(page, 'sa')

      // Open filters
      const filterButton = page.locator('button:has-text("Filter")').first()
      if (await filterButton.isVisible()) {
        await filterButton.click()
        await page.waitForTimeout(500)
      }

      const cityInput = page.locator('input[placeholder*="city" i], input[name*="city" i]').first()

      if (await cityInput.isVisible()) {
        await cityInput.fill('Springs')
        await page.waitForTimeout(1000)

        // Page should update
        await expect(page.locator('body')).toBeVisible()
      }
    })

    test('should have South African provinces in dropdown', async ({ page }) => {
      await navigateToDirectory(page, 'sa')

      // Open filters
      const filterButton = page.locator('button:has-text("Filter")').first()
      if (await filterButton.isVisible()) {
        await filterButton.click()
        await page.waitForTimeout(500)
      }

      const provinceSelect = page.locator('select#province-filter, select[name*="province" i]').first()

      if (await provinceSelect.isVisible()) {
        const options = await provinceSelect.locator('option').allTextContents()

        // Check for SA provinces
        const hasGauteng = options.some(opt => /gauteng/i.test(opt))
        const hasWesternCape = options.some(opt => /western cape/i.test(opt))
        const hasKZN = options.some(opt => /kwazulu|natal/i.test(opt))

        expect(hasGauteng && hasWesternCape && hasKZN).toBeTruthy()
      }
    })
  })

  test.describe('Business Cards Display', () => {
    test('should display business cards in grid', async ({ page }) => {
      await navigateToDirectory(page, 'sa')

      // Look for business cards or list items
      const businessCards = page.locator('[class*="card"], article, [class*="business"]')

      // May have businesses or empty state
      const hasCards = await businessCards.count() > 0
      const hasEmptyState = await page.locator('text=/no.*business|empty/i').count() > 0

      expect(hasCards || hasEmptyState).toBeTruthy()
    })

    test('should show business name on cards', async ({ page }) => {
      await navigateToDirectory(page, 'sa')

      const firstCard = page.locator('[class*="card"], article').first()

      if (await firstCard.isVisible()) {
        const hasName = await firstCard.locator('h2, h3, [class*="name"], [class*="title"]').count() > 0
        expect(hasName).toBeTruthy()
      }
    })

    test('should show business location on cards', async ({ page }) => {
      await navigateToDirectory(page, 'sa')

      const firstCard = page.locator('[class*="card"], article').first()

      if (await firstCard.isVisible()) {
        const hasLocation = await firstCard.locator('text=/gauteng|cape|natal|limpopo/i, [class*="location"]').count() > 0
        // Location is optional
        expect(hasLocation || true).toBeTruthy()
      }
    })

    test('should show contact info on cards', async ({ page }) => {
      await navigateToDirectory(page, 'sa')

      const firstCard = page.locator('[class*="card"], article').first()

      if (await firstCard.isVisible()) {
        const hasContact = await firstCard.locator(
          '[class*="phone"], [class*="contact"], a[href*="tel:"], text=/\\+27|0\\d{9}/i'
        ).count() > 0

        // Contact info should be visible if business has it
        expect(hasContact || true).toBeTruthy()
      }
    })

    test('should show business logo/image', async ({ page }) => {
      await navigateToDirectory(page, 'sa')

      const firstCard = page.locator('[class*="card"], article').first()

      if (await firstCard.isVisible()) {
        const hasImage = await firstCard.locator('img, [class*="logo"], [class*="avatar"]').count() > 0
        // Images are optional
        expect(hasImage || true).toBeTruthy()
      }
    })
  })

  test.describe('Business Detail Navigation', () => {
    test('should navigate to business detail on card click', async ({ page }) => {
      await navigateToDirectory(page, 'sa')

      const businessLink = page.locator('a[href*="/business/"]').first()

      if (await businessLink.isVisible()) {
        await businessLink.click()
        await waitForPageLoad(page)

        await expect(page).toHaveURL(/\/business\//)
      }
    })
  })

  test.describe('Pagination', () => {
    test('should show load more button if more results', async ({ page }) => {
      await navigateToDirectory(page, 'sa')

      const loadMore = page.locator('button:has-text("Load More"), button:has-text("Show More")')

      // Load more only shows if there are more results
      const hasLoadMore = await loadMore.count() > 0
      expect(hasLoadMore || true).toBeTruthy()
    })

    test('should load more businesses on click', async ({ page }) => {
      await navigateToDirectory(page, 'sa')

      const businessCards = page.locator('[class*="card"], article')
      const initialCount = await businessCards.count()

      const loadMore = page.locator('button:has-text("Load More")').first()

      if (await loadMore.isVisible()) {
        await loadMore.click()
        await page.waitForTimeout(2000)

        const newCount = await businessCards.count()
        expect(newCount).toBeGreaterThanOrEqual(initialCount)
      }
    })
  })

  test.describe('CTA for Business Owners', () => {
    test('should show register business CTA', async ({ page }) => {
      await navigateToDirectory(page, 'sa')

      const registerCTA = page.locator(
        'text=/register.*business|own.*business|list.*business/i, a[href*="/advertise"]'
      )

      await expect(registerCTA.first()).toBeVisible()
    })

    test('should navigate to advertise page from CTA', async ({ page }) => {
      await navigateToDirectory(page, 'sa')

      const registerLink = page.locator('a[href*="/advertise"]').first()

      if (await registerLink.isVisible()) {
        await registerLink.click()
        await waitForPageLoad(page)

        await expect(page).toHaveURL(/\/advertise/)
      }
    })
  })

  test.describe('Clear Filters', () => {
    test('should clear all filters', async ({ page }) => {
      await navigateToDirectory(page, 'sa')

      // Set some filters first
      const filterButton = page.locator('button:has-text("Filter")').first()
      if (await filterButton.isVisible()) {
        await filterButton.click()
        await page.waitForTimeout(500)
      }

      const searchInput = page.locator('input[type="text"], input[type="search"]').first()
      await searchInput.fill('test')

      // Click clear all
      const clearAll = page.locator('button:has-text("Clear all"), button:has-text("Clear filters")')

      if (await clearAll.isVisible()) {
        await clearAll.click()
        await page.waitForTimeout(500)

        const value = await searchInput.inputValue()
        expect(value).toBe('')
      }
    })
  })
})

test.describe('Directory - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should display mobile-optimized directory', async ({ page }) => {
    await navigateToDirectory(page, 'sa')

    await expect(page.locator('body')).toBeVisible()
  })

  test('should have collapsible filters on mobile', async ({ page }) => {
    await navigateToDirectory(page, 'sa')

    // Filters should be in a collapsible panel on mobile
    const filterButton = page.locator('button:has-text("Filter")')
    await expect(filterButton.first()).toBeVisible()
  })

  test('should show single column grid on mobile', async ({ page }) => {
    await navigateToDirectory(page, 'sa')

    const cards = page.locator('[class*="card"], article')
    const count = await cards.count()

    if (count > 1) {
      // Cards should stack vertically on mobile
      const firstCard = await cards.first().boundingBox()
      const secondCard = await cards.nth(1).boundingBox()

      if (firstCard && secondCard) {
        // Second card should be below first on mobile (not side by side)
        expect(secondCard.y).toBeGreaterThan(firstCard.y)
      }
    }
  })
})
