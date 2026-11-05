import { test, expect } from '@playwright/test';

test.describe.skip('Celebration Animation', () => {
    test('should show celebration animation with somersaulting Eddo icon when sending a message', async ({ page }) => {
        // Navigate to a feedback history page
        await page.goto('/workspace/assessments/assess-1/sub-1');

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Click on the Feedback tab to access the feedback history thread view
        await page.click('text=Feedback');

        // Wait for the feedback history component to load
        await page.waitForTimeout(1000);

        // Find the message input field
        const inputField = page.locator('input[placeholder*="Your message"]');
        await expect(inputField).toBeVisible();

        // Type a message
        await inputField.fill('Test message for celebration animation');

        // Click the send button
        const sendButton = page.locator('button[aria-label="Send message"]');
        await expect(sendButton).toBeEnabled();
        await sendButton.click();

        // Check that the celebration animation appears
        const celebrationOverlay = page.locator('.fixed.inset-0.z-50');
        await expect(celebrationOverlay).toBeVisible();

        // Check that the confetti animation is present
        const confettiDots = page.locator('.animate-bounce');
        await expect(confettiDots).toHaveCount(12);

        // Check that the somersaulting Eddo icon is present
        const eddoIcon = page.locator('.animate-somersault img[src="/eddo-logo.png"]');
        await expect(eddoIcon).toBeVisible();

        // Wait for the animation to complete (should auto-hide after 2 seconds)
        await page.waitForTimeout(2500);

        // Check that the celebration animation has disappeared
        await expect(celebrationOverlay).not.toBeVisible();
    });

    test('should trigger Eddo icon somersault in sidebar when sending a message', async ({ page }) => {
        // Navigate to a feedback history page
        await page.goto('/workspace/assessments/assess-1/sub-1');

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Click on the Feedback tab
        await page.click('text=Feedback');

        // Wait for the feedback history component to load
        await page.waitForTimeout(1000);

        // Find the sidebar Eddo icon
        const sidebarEddoIcon = page.locator('button[aria-label*="sidebar"] img[src="/eddo-logo.png"]');
        await expect(sidebarEddoIcon).toBeVisible();

        // Type and send a message
        const inputField = page.locator('input[placeholder*="Your message"]');
        await inputField.fill('Test message for sidebar animation');

        const sendButton = page.locator('button[aria-label="Send message"]');
        await sendButton.click();

        // Check that the sidebar Eddo icon gets the somersault animation class
        await expect(sidebarEddoIcon).toHaveClass(/animate-somersault/);

        // Wait for the animation to complete
        await page.waitForTimeout(1500);

        // Check that the animation class is removed
        await expect(sidebarEddoIcon).not.toHaveClass(/animate-somersault/);
    });

    test('should not show celebration for empty messages', async ({ page }) => {
        // Navigate to a feedback history page
        await page.goto('/workspace/assessments/assess-1/sub-1');

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Click on the Feedback tab
        await page.click('text=Feedback');

        // Wait for the feedback history component to load
        await page.waitForTimeout(1000);

        // Try to send an empty message
        const sendButton = page.locator('button[aria-label="Send message"]');
        await expect(sendButton).toBeDisabled();

        // Click the disabled button (should not trigger celebration)
        await sendButton.click();

        // Check that no celebration animation appears
        const celebrationOverlay = page.locator('.fixed.inset-0.z-50');
        await expect(celebrationOverlay).not.toBeVisible();
    });
}); 