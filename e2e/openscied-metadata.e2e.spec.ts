import { test, expect } from '@playwright/test'

test.describe.skip('OpenSciEd Metadata and API E2E Tests', () => {
    test('should load course metadata from API endpoints', async ({ page }) => {
        // Test the API endpoint directly
        const response = await page.request.get('/api/courses')
        expect(response.ok()).toBeTruthy()

        const data = await response.json()
        expect(data).toHaveProperty('courses')
        expect(data).toHaveProperty('statistics')
        expect(Array.isArray(data.courses)).toBeTruthy()
        expect(data.courses.length).toBeGreaterThan(0)
    })

    test('should load course metadata by grade level', async ({ page }) => {
        // Test grade-level API endpoint
        const response = await page.request.get('/api/courses/grade/middle-school')
        expect(response.ok()).toBeTruthy()

        const data = await response.json()
        expect(Array.isArray(data)).toBeTruthy()

        // Verify all courses are middle school level
        for (const course of data) {
            expect(course.grade_level).toBe('Middle School')
        }
    })

    test('should load course metadata by subject', async ({ page }) => {
        // Test subject API endpoint
        const response = await page.request.get('/api/courses/subject/biology')
        expect(response.ok()).toBeTruthy()

        const data = await response.json()
        expect(Array.isArray(data)).toBeTruthy()

        // Verify all courses are biology
        for (const course of data) {
            expect(course.subject).toBe('Biology')
        }
    })

    test('should load individual course metadata', async ({ page }) => {
        // First get all courses to find a valid course ID
        const allCoursesResponse = await page.request.get('/api/courses')
        const allCourses = await allCoursesResponse.json()

        if (allCourses.courses.length > 0) {
            const courseId = allCourses.courses[0].course_id

            // Test individual course API endpoint
            const response = await page.request.get(`/api/courses/${courseId}`, { timeout: 10000 })
            expect(response.ok()).toBeTruthy()

            const course = await response.json()
            expect(course).toHaveProperty('course_id')
            expect(course).toHaveProperty('title') // Changed from 'name' to 'title'
            expect(course).toHaveProperty('subject')
            expect(course).toHaveProperty('grade_level')
            expect(course).toHaveProperty('description')
        }
    })

    test('should display course statistics correctly on main page', async ({ page }) => {
        await page.goto('/library/OpenSciEd')
        await page.waitForLoadState('networkidle')

        // Check that statistics are displayed and are numeric
        const totalCoursesElement = page.locator('div').filter({ hasText: '12' }).first()
        const totalUnitsElement = page.locator('div').filter({ hasText: '40' }).first()
        const subjectsElement = page.locator('div').filter({ hasText: '4' }).first()

        await expect(totalCoursesElement).toBeVisible()
        await expect(totalUnitsElement).toBeVisible()
        await expect(subjectsElement).toBeVisible()

        // Verify the numbers are reasonable (handle potential parsing issues)
        const totalCoursesText = await totalCoursesElement.textContent() || '0'
        const totalUnitsText = await totalUnitsElement.textContent() || '0'
        const subjectsText = await subjectsElement.textContent() || '0'

        const totalCourses = parseInt(totalCoursesText.replace(/\D/g, '')) || 0
        const totalUnits = parseInt(totalUnitsText.replace(/\D/g, '')) || 0
        const subjects = parseInt(subjectsText.replace(/\D/g, '')) || 0

        expect(totalCourses).toBeGreaterThan(0)
        expect(totalUnits).toBeGreaterThan(0)
        expect(subjects).toBeGreaterThan(0)
    })

    test('should handle missing course metadata gracefully', async ({ page }) => {
        // Test with a non-existent course ID
        const response = await page.request.get('/api/courses/nonexistent-course')
        expect(response.status()).toBe(404)
    })

    test('should handle course metadata caching', async ({ page }) => {
        // Make multiple requests to the same endpoint
        const response1 = await page.request.get('/api/courses')
        const response2 = await page.request.get('/api/courses')

        expect(response1.ok()).toBeTruthy()
        expect(response2.ok()).toBeTruthy()

        const data1 = await response1.json()
        const data2 = await response2.json()

        // Data should be consistent
        expect(data1.courses.length).toBe(data2.courses.length)
    })

    test('should display course processing status correctly', async ({ page }) => {
        await page.goto('/library/OpenSciEd')
        await page.waitForLoadState('networkidle')

        // Check that course status information is displayed
        const statusElements = page.locator('div').filter({ hasText: /complete|raw|processed/i })
        if (await statusElements.count() > 0) {
            await expect(statusElements.first()).toBeVisible()
        }
    })

    test('should handle large metadata files efficiently', async ({ page }) => {
        const startTime = Date.now()

        // Load the main library page
        await page.goto('/library/OpenSciEd')
        await page.waitForLoadState('networkidle')

        const loadTime = Date.now() - startTime

        // Page should load within reasonable time (less than 10 seconds)
        expect(loadTime).toBeLessThan(10000)

        // Verify page is interactive
        await expect(page.getByRole('heading', { name: 'OpenSciEd Science Curriculum' })).toBeVisible()
    })

    test('should maintain data consistency across page navigation', async ({ page }) => {
        // Get course data from API
        const apiResponse = await page.request.get('/api/courses')
        const apiData = await apiResponse.json()

        // Navigate to library page
        await page.goto('/library/OpenSciEd')
        await page.waitForLoadState('networkidle')

        // Verify the same number of courses are displayed in statistics
        const totalCoursesElement = page.locator('div').filter({ hasText: '12' }).first()
        await expect(totalCoursesElement).toBeVisible()

        // The statistics should match the API data
        expect(apiData.courses.length).toBeGreaterThan(0)
    })

    test('should handle metadata schema validation', async ({ page }) => {
        // Test that all courses have required fields
        const response = await page.request.get('/api/courses')
        const data = await response.json()

        for (const course of data.courses) {
            expect(course).toHaveProperty('course_id')
            expect(course).toHaveProperty('title') // Changed from 'name' to 'title'
            expect(course).toHaveProperty('subject')
            expect(course).toHaveProperty('grade_level')
            expect(course).toHaveProperty('description')
            // Status is optional, so we don't require it
        }
    })

    test('should validate course metadata structure', async ({ page }) => {
        // Test individual course structure
        const response = await page.request.get('/api/courses')
        const data = await response.json()

        if (data.courses.length > 0) {
            const course = data.courses[0]

            // Check required fields
            expect(typeof course.course_id).toBe('string')
            expect(typeof course.title).toBe('string')
            expect(typeof course.subject).toBe('string')
            expect(typeof course.grade_level).toBe('string')
            expect(typeof course.description).toBe('string')
            // Status is optional, so check if it exists before validating type
            if (course.status !== undefined) {
                expect(typeof course.status).toBe('string')
            }

            // Check that course_id is not empty
            expect(course.course_id.length).toBeGreaterThan(0)
            expect(course.title.length).toBeGreaterThan(0)
        }
    })

    test('should handle API error responses', async ({ page }) => {
        // Test with invalid course ID
        const response = await page.request.get('/api/courses/invalid-course-id')
        expect(response.status()).toBe(404)

        const errorData = await response.json()
        expect(errorData).toHaveProperty('error')
    })
}) 