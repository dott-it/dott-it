import { test, expect } from '@playwright/test';

test.describe.skip('Record Detail View Unit Tests', () => {
  test('formatStudentResponse should handle valid JSON with explanation and observation', async ({ page }) => {
    // Mock the formatStudentResponse function behavior
    const validJsonContent = JSON.stringify({
      rawAnswer: {
        explanationQuestion: 'The process of photosynthesis converts light energy into chemical energy.',
        observationQuestion: 'I observed that plants need sunlight to grow properly.'
      }
    });

    // Navigate to a page that uses this function
    await page.goto('/workspace/assessments/test/test');
    
    // Mock the API response
    await page.route('/api/assessment-records', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'test-record',
          assessmentId: 'test',
          studentName: 'Test Student',
          studentId: 'test',
          status: 'reviewed',
          submittedDate: 'Jan 15, 2024',
          content: validJsonContent,
          feedback: []
        }])
      });
    });

    await page.waitForLoadState('domcontentloaded');
    
    // Click on Student Response tab to trigger the formatting
    await page.click('text=Student Response');
    
    // Check that the formatted content is displayed correctly
    await expect(page.locator('text=Explanation')).toBeVisible();
    await expect(page.locator('text=The process of photosynthesis converts light energy into chemical energy.')).toBeVisible();
    await expect(page.locator('text=Observations')).toBeVisible();
    await expect(page.locator('text=I observed that plants need sunlight to grow properly.')).toBeVisible();
  });

  test('formatStudentResponse should handle simple text content', async ({ page }) => {
    const simpleTextContent = 'This is a simple text response.';

    await page.route('/api/assessment-records', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'test-record',
          assessmentId: 'test',
          studentName: 'Test Student',
          studentId: 'test',
          status: 'reviewed',
          submittedDate: 'Jan 15, 2024',
          content: simpleTextContent,
          feedback: []
        }])
      });
    });

    await page.goto('/workspace/assessments/test/test');
    await page.waitForLoadState('domcontentloaded');
    
    // Click on Student Response tab
    await page.click('text=Student Response');
    
    // Should display the simple text as-is
    await expect(page.locator('text=This is a simple text response.')).toBeVisible();
  });

  test('formatStudentResponse should handle malformed JSON gracefully', async ({ page }) => {
    const malformedJson = '{"invalid": json}';

    await page.route('/api/assessment-records', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'test-record',
          assessmentId: 'test',
          studentName: 'Test Student',
          studentId: 'test',
          status: 'reviewed',
          submittedDate: 'Jan 15, 2024',
          content: malformedJson,
          feedback: []
        }])
      });
    });

    await page.goto('/workspace/assessments/test/test');
    await page.waitForLoadState('domcontentloaded');
    
    // Click on Student Response tab
    await page.click('text=Student Response');
    
    // Should display the raw content as text
    await expect(page.locator('text={"invalid": json}')).toBeVisible();
  });

  test('formatStudentResponse should handle JSON without rawAnswer', async ({ page }) => {
    const jsonWithoutRawAnswer = JSON.stringify({
      someOtherField: 'some value'
    });

    await page.route('/api/assessment-records', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'test-record',
          assessmentId: 'test',
          studentName: 'Test Student',
          studentId: 'test',
          status: 'reviewed',
          submittedDate: 'Jan 15, 2024',
          content: jsonWithoutRawAnswer,
          feedback: []
        }])
      });
    });

    await page.goto('/workspace/assessments/test/test');
    await page.waitForLoadState('domcontentloaded');
    
    // Click on Student Response tab
    await page.click('text=Student Response');
    
    // Should display the JSON string as text
    await expect(page.locator('text={"someOtherField":"some value"}')).toBeVisible();
  });

  test('formatStudentResponse should handle empty content', async ({ page }) => {
    await page.route('/api/assessment-records', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'test-record',
          assessmentId: 'test',
          studentName: 'Test Student',
          studentId: 'test',
          status: 'reviewed',
          submittedDate: 'Jan 15, 2024',
          content: '',
          feedback: []
        }])
      });
    });

    await page.goto('/workspace/assessments/test/test');
    await page.waitForLoadState('domcontentloaded');
    
    // Click on Student Response tab
    await page.click('text=Student Response');
    
    // Should display empty content gracefully
    await expect(page.locator('text=No response content available.')).toBeVisible();
  });

  test('formatStudentResponse should handle null content', async ({ page }) => {
    await page.route('/api/assessment-records', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'test-record',
          assessmentId: 'test',
          studentName: 'Test Student',
          studentId: 'test',
          status: 'reviewed',
          submittedDate: 'Jan 15, 2024',
          content: null,
          feedback: []
        }])
      });
    });

    await page.goto('/workspace/assessments/test/test');
    await page.waitForLoadState('domcontentloaded');
    
    // Click on Student Response tab
    await page.click('text=Student Response');
    
    // Should display no content message
    await expect(page.locator('text=No response content available.')).toBeVisible();
  });

  test('formatStudentResponse should handle whitespace-only content', async ({ page }) => {
    await page.route('/api/assessment-records', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'test-record',
          assessmentId: 'test',
          studentName: 'Test Student',
          studentId: 'test',
          status: 'reviewed',
          submittedDate: 'Jan 15, 2024',
          content: '   \n\t   ',
          feedback: []
        }])
      });
    });

    await page.goto('/workspace/assessments/test/test');
    await page.waitForLoadState('domcontentloaded');
    
    // Click on Student Response tab
    await page.click('text=Student Response');
    
    // Should display the whitespace content (preserved with whitespace-pre-wrap)
    const contentElement = page.locator('.prose p');
    await expect(contentElement).toBeVisible();
  });

  test('formatStudentResponse should handle JSON with only explanation', async ({ page }) => {
    const jsonWithOnlyExplanation = JSON.stringify({
      rawAnswer: {
        explanationQuestion: 'Only explanation is provided.'
      }
    });

    await page.route('/api/assessment-records', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'test-record',
          assessmentId: 'test',
          studentName: 'Test Student',
          studentId: 'test',
          status: 'reviewed',
          submittedDate: 'Jan 15, 2024',
          content: jsonWithOnlyExplanation,
          feedback: []
        }])
      });
    });

    await page.goto('/workspace/assessments/test/test');
    await page.waitForLoadState('domcontentloaded');
    
    // Click on Student Response tab
    await page.click('text=Student Response');
    
    // Should display only explanation
    await expect(page.locator('text=Explanation')).toBeVisible();
    await expect(page.locator('text=Only explanation is provided.')).toBeVisible();
    await expect(page.locator('text=Observations')).not.toBeVisible();
  });

  test('formatStudentResponse should handle JSON with only observation', async ({ page }) => {
    const jsonWithOnlyObservation = JSON.stringify({
      rawAnswer: {
        observationQuestion: 'Only observation is provided.'
      }
    });

    await page.route('/api/assessment-records', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'test-record',
          assessmentId: 'test',
          studentName: 'Test Student',
          studentId: 'test',
          status: 'reviewed',
          submittedDate: 'Jan 15, 2024',
          content: jsonWithOnlyObservation,
          feedback: []
        }])
      });
    });

    await page.goto('/workspace/assessments/test/test');
    await page.waitForLoadState('domcontentloaded');
    
    // Click on Student Response tab
    await page.click('text=Student Response');
    
    // Should display only observation
    await expect(page.locator('text=Observations')).toBeVisible();
    await expect(page.locator('text=Only observation is provided.')).toBeVisible();
    await expect(page.locator('text=Explanation')).not.toBeVisible();
  });
}); 