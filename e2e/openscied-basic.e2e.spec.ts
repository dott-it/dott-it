import { test, expect } from '@playwright/test'
import {
    waitForNextJsPage,
    waitForNextJsLoading,
    waitForNextJsData,
    setupNextJsTest,
    measureNextJsPerformance
} from './nextjs-test-helpers'

test.describe.skip('OpenSciEd Basic E2E Tests', () => {
    test('should load OpenSciEd library page successfully', async ({ page }) => {
        // Use optimized Next.js test setup
        await setupNextJsTest(page, '/library/OpenSciEd')

        // Check that the page loads with the correct title
        await expect(page).toHaveTitle(/Eddo Workspace/)

        // Verify the main heading is present
        await expect(page.getByRole('heading', { name: 'OpenSciEd Science Curriculum' })).toBeVisible()
    })

    test('should display Hight School and Middle School course sections', async ({ page }) => {
        await setupNextJsTest(page, '/library/OpenSciEd')

        // Check that all grade level sections are present
        await expect(page.getByRole('heading', { name: 'Middle School' })).toBeVisible()
        await expect(page.getByRole('heading', { name: 'High School' })).toBeVisible()
    })

    test('should display course statistics', async ({ page }) => {
        await page.goto('/library/OpenSciEd')

        // Check that statistics are displayed
        await expect(page.getByText('Total Courses')).toBeVisible()
        await expect(page.getByText('Total Units')).toBeVisible()
        // Use more specific selector for Subjects to avoid strict mode violation
        await expect(page.locator('p').filter({ hasText: 'Subjects' }).first()).toBeVisible()

        // Check that statistics have numeric values
        const statsContainer = page.locator('div').filter({ hasText: '12' }).first()
        await expect(statsContainer).toBeVisible()
    })

    test('should display course cards', async ({ page }) => {
        await setupNextJsTest(page, '/library/OpenSciEd')

        // Check that course cards are displayed
        const courseCards = page.locator('div').filter({ hasText: 'Grade 6' })
        await expect(courseCards.first()).toBeVisible()

        // Check that "View Units" buttons are present
        const viewUnitsButtons = page.getByRole('link', { name: 'View Units' })
        const buttonCount = await viewUnitsButtons.count()
        expect(buttonCount).toBeGreaterThan(0)
    })

    test('should display external curriculum links', async ({ page }) => {
        await setupNextJsTest(page, '/library/OpenSciEd')

        // Check that external curriculum site links are present
        const externalLinks = page.getByRole('link', { name: 'Curriculum Site' })
        const linkCount = await externalLinks.count()
        expect(linkCount).toBeGreaterThan(0)

        // Verify external links have proper attributes
        for (const link of await externalLinks.all()) {
            await expect(link).toHaveAttribute('target', '_blank')
            await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
        }
    })

    test('should display course descriptions', async ({ page }) => {
        await setupNextJsTest(page, '/library/OpenSciEd')

        // Check that course descriptions are displayed (more flexible selector)
        const descriptions = page.locator('p, div').filter({ hasText: /science curriculum|comprehensive|OpenSciEd/ })
        await expect(descriptions.first()).toBeVisible()
    })

    test('should handle responsive design', async ({ page }) => {
        await page.goto('/library/OpenSciEd')
        await page.waitForLoadState('domcontentloaded')

        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 })

        // Verify page still loads correctly
        await expect(page.getByRole('heading', { name: 'OpenSciEd Science Curriculum' })).toBeVisible()

        // Check that content is still accessible on mobile
        await expect(page.getByText('Total Courses')).toBeVisible()
    })

    test('should load API endpoints successfully', async ({ page }) => {
        // Test the main API endpoint
        const response = await page.request.get('/api/courses')
        expect(response.ok()).toBeTruthy()

        const data = await response.json()
        expect(data).toHaveProperty('courses')
        expect(data).toHaveProperty('statistics')
        expect(Array.isArray(data.courses)).toBeTruthy()
        expect(data.courses.length).toBeGreaterThan(0)
    })

    test('should display breadcrumb navigation', async ({ page }) => {
        await setupNextJsTest(page, '/library/OpenSciEd')

        // Check that breadcrumb navigation is present
        const breadcrumbNav = page.getByRole('navigation', { name: 'breadcrumb' })
        await expect(breadcrumbNav).toBeVisible()

        // Check that breadcrumb links are present
        const breadcrumbLinks = breadcrumbNav.getByRole('link')
        const linkCount = await breadcrumbLinks.count()
        expect(linkCount).toBeGreaterThan(0)
    })

    test('should display course metadata correctly', async ({ page }) => {
        await setupNextJsTest(page, '/library/OpenSciEd')

        // Check that unit counts are displayed
        const unitCounts = page.locator('div').filter({ hasText: /\d+ Units/ })
        await expect(unitCounts.first()).toBeVisible()

        // Check that course titles are displayed
        const courseTitles = page.locator('div').filter({ hasText: 'OpenSciEd' })
        await expect(courseTitles.first()).toBeVisible()
    })

    test('should handle page load performance', async ({ page }) => {
        // Navigate to page and measure performance
        await page.goto('/library/OpenSciEd')
        await measureNextJsPerformance(page, 'OpenSciEd Library Page Load')

        // Verify page is interactive
        await expect(page.getByRole('heading', { name: 'OpenSciEd Science Curriculum' })).toBeVisible()
    })
}) 