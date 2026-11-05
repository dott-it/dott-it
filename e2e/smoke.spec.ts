import { test, expect } from '@playwright/test'

// A fast smoke test to verify that the Next.js app starts and the homepage renders.

test.skip('@smoke homepage loads', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Dott.it Workspace/)
})
