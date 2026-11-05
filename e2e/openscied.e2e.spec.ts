import { test, expect } from '@playwright/test'
import { gotoLibrary, assertLibraryStructure, assertStatistics, openGrade } from './utils/openscied'

// Consolidated OpenSciEd E2E suite

test.describe.skip('OpenSciEd Library E2E Suite', () => {
    test('library page loads with correct structure and statistics', async ({ page }) => {
        await gotoLibrary(page)
        await assertLibraryStructure(page)
        await assertStatistics(page)
    })

    test('navigate to Grade 6 and verify units', async ({ page }) => {
        await gotoLibrary(page)
        await openGrade(page, 0) // Grade-6 (first card)

        await expect(page).toHaveURL(/\/library\/OpenSciEd\/grade-6/)
        await expect(page.getByRole('heading', { name: /OpenSciEd Grade 6/ })).toBeVisible()
        await expect(page.getByRole('heading', { name: '6.1 Light & Matter' })).toBeVisible()
        await expect(page.getByRole('heading', { name: '6.2 Thermal Energy' })).toBeVisible()
    })

    test('navigate to High-School Biology subject page', async ({ page }) => {
        await gotoLibrary(page)
        // Biology is fourth "View Units" button (after 3 middle-school grades)
        await page.getByRole('link', { name: 'View Units' }).nth(3).click()

        await expect(page).toHaveURL(/\/library\/HighSchool\/biology/)
        await expect(page.getByRole('heading', { name: /Biology Units/ })).toBeVisible()
    })

    test('breadcrumb navigation is correct on grade pages', async ({ page }) => {
        await page.goto('/library/OpenSciEd/grade-6')
        await page.waitForLoadState('domcontentloaded')

        await expect(page.getByRole('navigation', { name: 'breadcrumb' })).toBeVisible()
        await expect(page.getByRole('link', { name: 'Library' })).toBeVisible()
        await expect(page.getByRole('link', { name: 'OpenSciEd' })).toBeVisible()
        await expect(page.getByText('Grade 6').first()).toBeVisible()
    })

    test('external curriculum links exist and open in new tab', async ({ page }) => {
        await gotoLibrary(page)
        const externalLink = page.getByRole('link', { name: 'Curriculum Site' }).first()
        await expect(externalLink).toBeVisible()
        await expect(externalLink).toHaveAttribute('target', '_blank')
    })

    test('mobile viewport renders essential content', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 })
        await gotoLibrary(page)
        await assertLibraryStructure(page)
    })
}) 