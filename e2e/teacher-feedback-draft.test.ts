import { test } from '@playwright/test'

/**
 * Smoke: teacher feedback actions persist immediately after each action.
 * Enable when e2e env has a logged-in teacher and a seeded assessment record with pending feedback.
 */
test.describe.skip('Teacher feedback direct persistence', () => {
  test('should persist custom strength after add and page reload', async ({ page: _page }) => {
    // Implement with real tenant URL, auth storage state, and assessment record ids when enabling this suite.
  })
})
