import { Page, expect } from '@playwright/test'

/**
 * Navigate to the OpenSciEd library root and wait until the network is idle.
 */
export async function gotoLibrary(page: Page) {
    await page.goto('/library/openscied')
    await page.waitForLoadState('networkidle')
}

/**
 * Assert that the main OpenSciEd heading and grade-level sections are visible.
 */
export async function assertLibraryStructure(page: Page) {
    await expect(page.getByRole('heading', { name: 'OpenSciEd Assessment Library' })).toBeVisible()
}

/**
 * Assert the statistics cards are visible.
 */
export async function assertStatistics(page: Page) {
    await expect(page.getByText('Total Courses')).toBeVisible()
    await expect(page.getByText('Total Units')).toBeVisible()
    await expect(page.getByText('Subjects')).toBeVisible()
}

/**
 * Click the nth "View Units" link (default first / grade 6).
 */
export async function openGrade(page: Page, gradeIndex = 0) {
    await page.getByRole('link', { name: 'View Units' }).nth(gradeIndex).click()
    await page.waitForLoadState('domcontentloaded')
}