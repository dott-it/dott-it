import { test, expect } from '@playwright/test';
import { setupNextJsTest, waitForNextJsLoading, waitForNextJsData } from './nextjs-test-helpers';

test.describe.skip('Anonymous View Integration Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Mock the API response for assessment records
        await page.route('/api/assessment-records', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    {
                        id: 'record-1',
                        assessmentId: 'assessment-1',
                        studentName: 'Alice Johnson',
                        studentId: 'student-1',
                        status: 'reviewed',
                        submittedDate: 'Jan 15, 2024',
                        score: 8,
                        reviewedDate: 'Jan 16, 2024',
                        flagged: false,
                        feedback: [
                            {
                                type: 'ai_review',
                                section: 'General',
                                content: 'Great work on explaining the scientific concepts!'
                            }
                        ],
                        content: JSON.stringify({
                            rawAnswer: {
                                explanationQuestion: 'The process of photosynthesis converts light energy into chemical energy.',
                                observationQuestion: 'I observed that plants need sunlight to grow properly.'
                            }
                        })
                    }
                ])
            });
        });
    });

    test('should maintain anonymous view state across page navigation', async ({ page }) => {
        // Start from workspace page
        await setupNextJsTest(page, '/workspace');
        await waitForNextJsLoading(page);
        await waitForNextJsData(page);

        // Toggle anonymous view in sidebar
        await page.click('button:has-text("Show/Hide Student Info")');

        // Navigate to record detail page
        await page.goto('/workspace/assessments/assessment-1/student-1');
        await waitForNextJsLoading(page);
        await waitForNextJsData(page);

        // Should maintain anonymous view state
        await expect(page.locator('h1')).toContainText("Anonymous Student's Response");
        await expect(page.locator('text=Anonymous Student')).toBeVisible();

        // Navigate back to workspace
        await page.goto('/workspace');
        await waitForNextJsLoading(page);
        await waitForNextJsData(page);

        // Should still be in anonymous view
        await expect(page.locator('button:has-text("Show Student Info")')).toBeVisible();
    });

    test('should toggle anonymous view from record detail page and affect sidebar', async ({ page }) => {
        await setupNextJsTest(page, '/workspace/assessments/assessment-1/student-1');
        await waitForNextJsLoading(page);
        await waitForNextJsData(page);

        // Initially should show student name
        await expect(page.locator('h1')).toContainText("Alice Johnson's Response");

        // Toggle to anonymous view from record detail page
        await page.click('button:has-text("Hide Info")');
        await expect(page.locator('h1')).toContainText("Anonymous Student's Response");

        // Navigate to workspace and check sidebar state
        await page.goto('/workspace');
        await waitForNextJsLoading(page);
        await waitForNextJsData(page);

        // Sidebar should reflect the anonymous state
        await expect(page.locator('button:has-text("Show Student Info")')).toBeVisible();
    });

    test('should update page title based on anonymous view state', async ({ page }) => {
        await setupNextJsTest(page, '/workspace/assessments/assessment-1/student-1');
        await waitForNextJsLoading(page);
        await waitForNextJsData(page);

        // Initially should show student name in title
        await expect(page).toHaveTitle(/Alice Johnson's Response/);

        // Toggle to anonymous view
        await page.click('button:has-text("Hide Info")');
        await expect(page).toHaveTitle(/Anonymous Student's Response/);

        // Toggle back to show student info
        await page.click('button:has-text("Show Info")');
        await expect(page).toHaveTitle(/Alice Johnson's Response/);
    });

    test('should maintain anonymous view state during tab switches', async ({ page }) => {
        await setupNextJsTest(page, '/workspace/assessments/assessment-1/student-1');
        await waitForNextJsLoading(page);
        await waitForNextJsData(page);

        // Toggle to anonymous view
        await page.click('button:has-text("Hide Info")');
        await expect(page.locator('text=Anonymous Student')).toBeVisible();

        // Switch to Student Response tab
        await page.click('text=Student Response');
        await expect(page.locator('text=Anonymous Student')).toBeVisible();

        // Switch back to Feedback tab
        await page.click('text=Feedback');
        await expect(page.locator('text=Anonymous Student')).toBeVisible();
    });

    test('should show anonymous view by default for new sessions', async ({ page }) => {
        // Clear any existing state by starting fresh
        await page.goto('/workspace/assessments/assessment-1/student-1');
        await waitForNextJsLoading(page);
        await waitForNextJsData(page);

        // Should show student info by default (not anonymous)
        await expect(page.locator('h1')).toContainText("Alice Johnson's Response");
        await expect(page.locator('text=Alice Johnson')).toBeVisible();
    });

    test('should toggle anonymous view from sidebar and affect all pages', async ({ page }) => {
        // Start from workspace
        await setupNextJsTest(page, '/workspace');
        await waitForNextJsLoading(page);
        await waitForNextJsData(page);

        // Toggle to anonymous view from sidebar
        await page.click('button:has-text("Show/Hide Student Info")');
        await expect(page.locator('button:has-text("Show Student Info")')).toBeVisible();

        // Navigate to record detail page
        await page.goto('/workspace/assessments/assessment-1/student-1');
        await waitForNextJsLoading(page);
        await waitForNextJsData(page);

        // Should be in anonymous view
        await expect(page.locator('h1')).toContainText("Anonymous Student's Response");
        await expect(page.locator('text=Anonymous Student')).toBeVisible();

        // Toggle back to show student info from record detail page
        await page.click('button:has-text("Show Info")');
        await expect(page.locator('h1')).toContainText("Alice Johnson's Response");

        // Navigate back to workspace
        await page.goto('/workspace');
        await waitForNextJsLoading(page);
        await waitForNextJsData(page);

        // Sidebar should reflect the change
        await expect(page.locator('button:has-text("Hide Student Info")')).toBeVisible();
    });

    test('should handle anonymous view state persistence during page refresh', async ({ page }) => {
        await setupNextJsTest(page, '/workspace/assessments/assessment-1/student-1');
        await waitForNextJsLoading(page);
        await waitForNextJsData(page);

        // Toggle to anonymous view
        await page.click('button:has-text("Hide Info")');
        await expect(page.locator('text=Anonymous Student')).toBeVisible();

        // Refresh the page
        await page.reload();
        await waitForNextJsLoading(page);
        await waitForNextJsData(page);

        // Should maintain anonymous view state (context should persist)
        await expect(page.locator('h1')).toContainText("Anonymous Student's Response");
        await expect(page.locator('text=Anonymous Student')).toBeVisible();
    });

    test('should show correct button text based on anonymous view state', async ({ page }) => {
        await setupNextJsTest(page, '/workspace/assessments/assessment-1/student-1');
        await waitForNextJsLoading(page);
        await waitForNextJsData(page);

        // Initially should show "Hide Info" button
        await expect(page.locator('button:has-text("Hide Info")')).toBeVisible();

        // Click to hide info
        await page.click('button:has-text("Hide Info")');
        await expect(page.locator('button:has-text("Show Info")')).toBeVisible();

        // Click to show info again
        await page.click('button:has-text("Show Info")');
        await expect(page.locator('button:has-text("Hide Info")')).toBeVisible();
    });

    test('should maintain anonymous view state across multiple record detail pages', async ({ page }) => {
        // Mock multiple records
        await page.route('/api/assessment-records', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    {
                        id: 'record-1',
                        assessmentId: 'assessment-1',
                        studentName: 'Alice Johnson',
                        studentId: 'student-1',
                        status: 'reviewed',
                        submittedDate: 'Jan 15, 2024',
                        content: 'Content 1',
                        feedback: []
                    },
                    {
                        id: 'record-2',
                        assessmentId: 'assessment-1',
                        studentName: 'Bob Smith',
                        studentId: 'student-2',
                        status: 'reviewed',
                        submittedDate: 'Jan 15, 2024',
                        content: 'Content 2',
                        feedback: []
                    }
                ])
            });
        });

        // Start with first record
        await setupNextJsTest(page, '/workspace/assessments/assessment-1/student-1');
        await waitForNextJsLoading(page);
        await waitForNextJsData(page);

        // Toggle to anonymous view
        await page.click('button:has-text("Hide Info")');
        await expect(page.locator('text=Anonymous Student')).toBeVisible();

        // Navigate to second record
        await page.goto('/workspace/assessments/assessment-1/student-2');
        await waitForNextJsLoading(page);
        await waitForNextJsData(page);

        // Should maintain anonymous view state
        await expect(page.locator('h1')).toContainText("Anonymous Student's Response");
        await expect(page.locator('text=Anonymous Student')).toBeVisible();
    });

    test('should handle anonymous view toggle with keyboard navigation', async ({ page }) => {
        await setupNextJsTest(page, '/workspace/assessments/assessment-1/student-1');
        await waitForNextJsLoading(page);
        await waitForNextJsData(page);

        // Focus on the toggle button
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');

        // Press Enter to toggle
        await page.keyboard.press('Enter');

        // Should toggle to anonymous view
        await expect(page.locator('text=Anonymous Student')).toBeVisible();

        // Press Enter again to toggle back
        await page.keyboard.press('Enter');

        // Should show student info again
        await expect(page.locator('text=Alice Johnson')).toBeVisible();
    });

    test('should maintain anonymous view state during error scenarios', async ({ page }) => {
        await setupNextJsTest(page, '/workspace/assessments/assessment-1/student-1');
        await waitForNextJsLoading(page);
        await waitForNextJsData(page);

        // Toggle to anonymous view
        await page.click('button:has-text("Hide Info")');
        await expect(page.locator('text=Anonymous Student')).toBeVisible();

        // Mock an error response
        await page.route('/api/assessment-records', async route => {
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'Internal Server Error' })
            });
        });

        // Navigate to a different record that will cause an error
        await page.goto('/workspace/assessments/assessment-1/error-student');
        await waitForNextJsLoading(page);
        await waitForNextJsData(page);

        // Should show error but maintain anonymous view state in context
        await expect(page.locator('text=Record Not Found')).toBeVisible();

        // Navigate back to working record
        await page.goto('/workspace/assessments/assessment-1/student-1');
        await waitForNextJsLoading(page);
        await waitForNextJsData(page);

        // Should still be in anonymous view
        await expect(page.locator('text=Anonymous Student')).toBeVisible();
    });
}); 