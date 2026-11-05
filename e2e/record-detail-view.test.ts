import { test, expect } from '@playwright/test';
import { setupNextJsTest, waitForNextJsLoading, waitForNextJsData } from './nextjs-test-helpers';

test.describe.skip('Record Detail View', () => {
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
                    },
                    {
                        id: 'record-2',
                        assessmentId: 'assessment-1',
                        studentName: 'Bob Smith',
                        studentId: 'student-2',
                        status: 'feedback generated',
                        submittedDate: 'Jan 15, 2024',
                        score: 7,
                        flagged: false,
                        feedback: [],
                        content: 'This is a simple text response.'
                    }
                ])
            });
        });
    });

    test('should load record detail page with student information', async ({ page }) => {
        await setupNextJsTest(page, '/workspace/assessments/assessment-1/student-1');

        // Wait for the page to load completely
        await waitForNextJsLoading(page);
        await waitForNextJsData(page);

        // Check page title
        await expect(page).toHaveTitle(/Alice Johnson's Response/);

        // Check main content is displayed
        await expect(page.locator('h1')).toContainText("Alice Johnson's Response");
        await expect(page.locator('text=Assessment Record • Jan 15, 2024')).toBeVisible();

        // Check record details card
        await expect(page.locator('text=Record Details')).toBeVisible();
        await expect(page.locator('text=Alice Johnson')).toBeVisible();
        await expect(page.locator('text=Submitted: Jan 15, 2024')).toBeVisible();
        await expect(page.locator('text=Reviewed: Jan 16, 2024')).toBeVisible();
        await expect(page.locator('text=Score: 8/10')).toBeVisible();

        // Check status badge
        await expect(page.locator('text=Reviewed')).toBeVisible();

        // Check tabs
        await expect(page.locator('text=Student Response')).toBeVisible();
        await expect(page.locator('text=Feedback')).toBeVisible();
    });

    test('should toggle anonymous view correctly', async ({ page }) => {
        await setupNextJsTest(page, '/workspace/assessments/assessment-1/student-1');
        await waitForNextJsLoading(page);
        await waitForNextJsData(page);

        // Initially should show student name
        await expect(page.locator('h1')).toContainText("Alice Johnson's Response");
        await expect(page.locator('text=Alice Johnson')).toBeVisible();

        // Click hide info button
        await page.click('button:has-text("Hide Info")');

        // Should now show anonymous
        await expect(page.locator('h1')).toContainText("Anonymous Student's Response");
        await expect(page.locator('text=Anonymous Student')).toBeVisible();

        // Click show info button
        await page.click('button:has-text("Show Info")');

        // Should show student name again
        await expect(page.locator('h1')).toContainText("Alice Johnson's Response");
        await expect(page.locator('text=Alice Johnson')).toBeVisible();
    });

    test('should display student response content correctly', async ({ page }) => {
        await setupNextJsTest(page, '/workspace/assessments/assessment-1/student-1');
        await waitForNextJsLoading(page);
        await waitForNextJsData(page);

        // Click on Student Response tab
        await page.click('text=Student Response');

        // Check that the formatted response is displayed
        await expect(page.locator('text=Explanation')).toBeVisible();
        await expect(page.locator('text=The process of photosynthesis converts light energy into chemical energy.')).toBeVisible();
        await expect(page.locator('text=Observations')).toBeVisible();
        await expect(page.locator('text=I observed that plants need sunlight to grow properly.')).toBeVisible();
    });

    test('should display feedback tab by default', async ({ page }) => {
        await setupNextJsTest(page, '/workspace/assessments/assessment-1/student-1');
        await waitForNextJsLoading(page);
        await waitForNextJsData(page);

        // Feedback tab should be active by default
        await expect(page.locator('[data-state="active"]')).toContainText('Feedback');

        // Feedback content should be visible
        await expect(page.locator('text=Great work on explaining the scientific concepts!')).toBeVisible();
    });

    test('should handle simple text responses', async ({ page }) => {
        await setupNextJsTest(page, '/workspace/assessments/assessment-1/student-2');
        await waitForNextJsLoading(page);
        await waitForNextJsData(page);

        // Click on Student Response tab
        await page.click('text=Student Response');

        // Should display simple text content
        await expect(page.locator('text=This is a simple text response.')).toBeVisible();
    });

    test('should show loading state while fetching data', async ({ page }) => {
        // Mock a slow API response
        await page.route('/api/assessment-records', async route => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([])
            });
        });

        await page.goto('/workspace/assessments/assessment-1/student-1');

        // Should show loading state
        await expect(page.locator('text=Loading assessment record...')).toBeVisible();
        await expect(page.locator('.animate-pulse')).toBeVisible();
    });

    test('should show 404 error for non-existent record', async ({ page }) => {
        // Mock empty response
        await page.route('/api/assessment-records', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([])
            });
        });

        await setupNextJsTest(page, '/workspace/assessments/assessment-1/non-existent-student');
        await waitForNextJsLoading(page);
        await waitForNextJsData(page);

        // Should show 404 error
        await expect(page.locator('text=Record Not Found')).toBeVisible();
        await expect(page.locator('text=The requested assessment record could not be found.')).toBeVisible();
        await expect(page.locator('a:has-text("Back to Workspace")')).toBeVisible();
    });

    test('should display different status badges correctly', async ({ page }) => {
        // Test AI Reviewed status
        await page.route('/api/assessment-records', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    {
                        id: 'record-2',
                        assessmentId: 'assessment-1',
                        studentName: 'Bob Smith',
                        studentId: 'student-2',
                        status: 'feedback generated',
                        submittedDate: 'Jan 15, 2024',
                        score: 7,
                        flagged: false,
                        feedback: [],
                        content: 'Test content'
                    }
                ])
            });
        });

        await setupNextJsTest(page, '/workspace/assessments/assessment-1/student-2');
        await waitForNextJsLoading(page);
        await waitForNextJsData(page);

        // Should show AI Reviewed badge
        await expect(page.locator('text=AI Reviewed')).toBeVisible();
    });

    test('should navigate back to assessment list', async ({ page }) => {
        await setupNextJsTest(page, '/workspace/assessments/assessment-1/student-1');
        await waitForNextJsLoading(page);
        await waitForNextJsData(page);

        // Click back button
        await page.click('a:has-text("Back to Assessment")');

        // Should navigate to assessment detail page
        await expect(page).toHaveURL(/\/workspace\/assessments\/assessment-1$/);
    });

    test('should display breadcrumbs correctly', async ({ page }) => {
        await setupNextJsTest(page, '/workspace/assessments/assessment-1/student-1');
        await waitForNextJsLoading(page);
        await waitForNextJsData(page);

        // Check breadcrumbs: Workspace, Assessments, assessment title, student name
        await expect(page.locator('text=Workspace')).toBeVisible();
        await expect(page.locator('text=Assessments')).toBeVisible();
        await expect(page.locator('text=Alice Johnson')).toBeVisible();
    });

    test('should maintain anonymous view state across page interactions', async ({ page }) => {
        await setupNextJsTest(page, '/workspace/assessments/assessment-1/student-1');
        await waitForNextJsLoading(page);
        await waitForNextJsData(page);

        // Toggle to anonymous view
        await page.click('button:has-text("Hide Info")');
        await expect(page.locator('text=Anonymous Student')).toBeVisible();

        // Switch tabs - should maintain anonymous state
        await page.click('text=Student Response');
        await expect(page.locator('text=Anonymous Student')).toBeVisible();

        // Switch back to feedback tab
        await page.click('text=Feedback');
        await expect(page.locator('text=Anonymous Student')).toBeVisible();
    });

    test('should handle records without optional fields', async ({ page }) => {
        // Mock record without score and reviewed date
        await page.route('/api/assessment-records', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    {
                        id: 'record-3',
                        assessmentId: 'assessment-1',
                        studentName: 'Charlie Brown',
                        studentId: 'student-3',
                        status: 'submitted',
                        submittedDate: 'Jan 15, 2024',
                        flagged: false,
                        feedback: [],
                        content: 'Simple response'
                    }
                ])
            });
        });

        await setupNextJsTest(page, '/workspace/assessments/assessment-1/student-3');
        await waitForNextJsLoading(page);
        await waitForNextJsData(page);

        // Should show submitted date but not score or reviewed date
        await expect(page.locator('text=Submitted: Jan 15, 2024')).toBeVisible();
        await expect(page.locator('text=Score:')).not.toBeVisible();
        await expect(page.locator('text=Reviewed:')).not.toBeVisible();
        await expect(page.locator('text=Pending')).toBeVisible();
    });

    test('should handle malformed JSON content gracefully', async ({ page }) => {
        // Mock record with malformed JSON
        await page.route('/api/assessment-records', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    {
                        id: 'record-4',
                        assessmentId: 'assessment-1',
                        studentName: 'Diana Prince',
                        studentId: 'student-4',
                        status: 'reviewed',
                        submittedDate: 'Jan 15, 2024',
                        score: 9,
                        flagged: false,
                        feedback: [],
                        content: '{"invalid": json}'
                    }
                ])
            });
        });

        await setupNextJsTest(page, '/workspace/assessments/assessment-1/student-4');
        await waitForNextJsLoading(page);
        await waitForNextJsData(page);

        // Click on Student Response tab
        await page.click('text=Student Response');

        // Should display the raw content as text
        await expect(page.locator('text={"invalid": json}')).toBeVisible();
    });
}); 