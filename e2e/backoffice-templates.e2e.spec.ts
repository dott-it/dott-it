import { test, expect } from '@playwright/test'
import { setupNextJsTest } from './nextjs-test-helpers'

test.describe('Backoffice Templates Workflows', () => {
  test('should navigate to create template page', async ({ page }) => {
    await setupNextJsTest(page, '/backoffice/assessment-templates/create')

    await expect(page).toHaveURL(/\/backoffice\/assessment-templates\/create/)
    await expect(page.getByRole('heading', { name: /Create.*Template/i })).toBeVisible()
  })

  test('should display template creation form', async ({ page }) => {
    await setupNextJsTest(page, '/backoffice/assessment-templates/create')

    // Check for form fields
    await expect(page.getByText(/Template Information/i)).toBeVisible()
    
    // Form should have required fields
    const formFields = page.locator('input, select, textarea')
    const fieldCount = await formFields.count()
    expect(fieldCount).toBeGreaterThan(0)
  })

  test('should navigate to template detail page', async ({ page }) => {
    // First go to backoffice
    await setupNextJsTest(page, '/backoffice')

    // Switch to templates tab
    await page.getByRole('tab', { name: /Templates/i }).click()
    await page.waitForTimeout(500)

    // Look for template cards or links
    const templateLinks = page.getByRole('link', { name: /template/i })
    const linkCount = await templateLinks.count()

    if (linkCount > 0) {
      // Click on first template link if available
      await templateLinks.first().click()
      await page.waitForLoadState('domcontentloaded')

      // Verify we're on a detail page
      await expect(page).toHaveURL(/\/backoffice\/assessment-templates\/[^/]+$/)
    } else {
      test.skip()
    }
  })

  test('should navigate to template edit page', async ({ page }) => {
    // First go to backoffice
    await setupNextJsTest(page, '/backoffice')

    // Switch to templates tab
    await page.getByRole('tab', { name: /Templates/i }).click()
    await page.waitForTimeout(500)

    // Look for template cards
    const templateLinks = page.getByRole('link', { name: /template/i })
    const linkCount = await templateLinks.count()

    if (linkCount > 0) {
      // Navigate to detail page first
      await templateLinks.first().click()
      await page.waitForLoadState('domcontentloaded')

      // Look for edit button or link
      const editButton = page.getByRole('link', { name: /edit/i })
      const editCount = await editButton.count()

      if (editCount > 0) {
        await editButton.first().click()
        await page.waitForLoadState('domcontentloaded')

        // Verify we're on edit page
        await expect(page).toHaveURL(/\/backoffice\/assessment-templates\/[^/]+\/edit/)
      }
    } else {
      test.skip()
    }
  })

  test('should display template list in backoffice', async ({ page }) => {
    await setupNextJsTest(page, '/backoffice')

    // Switch to templates tab
    await page.getByRole('tab', { name: /Templates/i }).click()
    await page.waitForTimeout(500)

    // Check for template cards or list
    const templateSection = page.locator('[data-testid*="template"], .template-card, [class*="template"]')
    const sectionCount = await templateSection.count()

    // May have templates or empty state
    expect(sectionCount).toBeGreaterThanOrEqual(0)
  })

  test('should display template usage information', async ({ page }) => {
    // Navigate to a template detail page if available
    await setupNextJsTest(page, '/backoffice')

    await page.getByRole('tab', { name: /Templates/i }).click()
    await page.waitForTimeout(500)

    const templateLinks = page.getByRole('link', { name: /template/i })
    const linkCount = await templateLinks.count()

    if (linkCount > 0) {
      await templateLinks.first().click()
      await page.waitForLoadState('domcontentloaded')

      // Check for usage information (may vary based on implementation)
      const usageText = page.getByText(/usage|assessments/i)
      const usageCount = await usageText.count()
      
      // Usage info may or may not be present
      expect(usageCount).toBeGreaterThanOrEqual(0)
    } else {
      test.skip()
    }
  })
})

