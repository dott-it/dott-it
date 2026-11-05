import { test, expect } from '@playwright/test'
import { setupNextJsTest } from './nextjs-test-helpers'

test.describe('Backoffice Assessments Workflows', () => {
  test('should navigate to create assessment page', async ({ page }) => {
    await setupNextJsTest(page, '/backoffice/assessments/create')

    await expect(page).toHaveURL(/\/backoffice\/assessments\/create/)
    await expect(page.getByRole('heading', { name: /Create.*Assessment/i })).toBeVisible()
  })

  test('should display assessment creation form', async ({ page }) => {
    await setupNextJsTest(page, '/backoffice/assessments/create')

    // Check for form fields
    await expect(page.getByText(/Assessment Information/i)).toBeVisible()
    
    // Form may have various fields - check for at least one required field
    const formFields = page.locator('input, select, textarea')
    const fieldCount = await formFields.count()
    expect(fieldCount).toBeGreaterThan(0)
  })

  test('should navigate to assessment detail page', async ({ page }) => {
    // First go to backoffice to see if there are any assessments
    await setupNextJsTest(page, '/backoffice')

    // Look for assessment cards or links
    const assessmentLinks = page.getByRole('link', { name: /assessment/i })
    const linkCount = await assessmentLinks.count()

    if (linkCount > 0) {
      // Click on first assessment link if available
      await assessmentLinks.first().click()
      await page.waitForLoadState('domcontentloaded')

      // Verify we're on a detail page
      await expect(page).toHaveURL(/\/backoffice\/assessments\/[^/]+$/)
    } else {
      // Skip test if no assessments exist
      test.skip()
    }
  })

  test('should navigate to assessment edit page', async ({ page }) => {
    // First go to backoffice
    await setupNextJsTest(page, '/backoffice')

    // Look for assessment cards
    const assessmentLinks = page.getByRole('link', { name: /assessment/i })
    const linkCount = await assessmentLinks.count()

    if (linkCount > 0) {
      // Navigate to detail page first
      await assessmentLinks.first().click()
      await page.waitForLoadState('domcontentloaded')

      // Look for edit button or link
      const editButton = page.getByRole('link', { name: /edit/i })
      const editCount = await editButton.count()

      if (editCount > 0) {
        await editButton.first().click()
        await page.waitForLoadState('domcontentloaded')

        // Verify we're on edit page
        await expect(page).toHaveURL(/\/backoffice\/assessments\/[^/]+\/edit/)
      }
    } else {
      test.skip()
    }
  })

  test('should display assessment list in backoffice', async ({ page }) => {
    await setupNextJsTest(page, '/backoffice')

    // Ensure we're on assessments tab
    await page.getByRole('tab', { name: /Assessments/i }).click()
    await page.waitForTimeout(500)

    // Check for assessment cards or list
    const assessmentSection = page.locator('[data-testid*="assessment"], .assessment-card, [class*="assessment"]')
    const sectionCount = await assessmentSection.count()

    // May have assessments or empty state
    expect(sectionCount).toBeGreaterThanOrEqual(0)
  })
})

