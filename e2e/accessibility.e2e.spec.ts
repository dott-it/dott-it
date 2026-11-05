import { test, expect, type APIRequestContext, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

function seriousOrCriticalViolations(violations: { impact?: string; id: string }[]) {
  return violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
}

async function skipIfDemoLoginUnavailable(request: APIRequestContext) {
  const res = await request.post('/api/auth/login', {
    data: { email: 'test@example.com', password: 'password123' },
  })
  test.skip(
    !res.ok(),
    `Skipped: demo credentials login returned ${res.status()} (needs reachable DB; see docs/ACCESSIBILITY_REVIEW_BACKLOG.md).`,
  )
}

async function signInWithDemoCredentials(page: Page) {
  await page.goto('/login')
  await page.getByPlaceholder('teacher@school.edu').fill('test@example.com')
  await page.getByPlaceholder('Enter your password').fill('password123')
  await page.getByRole('button', { name: /Login/i }).click()
  await expect(page).toHaveURL('/workspace')
}

test.describe('Accessibility (axe-core)', () => {
  test('login page has no serious or critical axe violations', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('button', { name: /Continue with Google/ })).toBeVisible()
    const { violations } = await new AxeBuilder({ page }).analyze()
    expect(seriousOrCriticalViolations(violations)).toEqual([])
  })

  test('workspace after demo sign-in', async ({ page, request }) => {
    await skipIfDemoLoginUnavailable(request)
    await signInWithDemoCredentials(page)
    await expect(page).toHaveTitle(/Eddo Workspace/)
    const { violations } = await new AxeBuilder({ page }).analyze()
    expect(seriousOrCriticalViolations(violations)).toEqual([])
  })

  test('backoffice after demo sign-in', async ({ page, request }) => {
    await skipIfDemoLoginUnavailable(request)
    await signInWithDemoCredentials(page)
    await page.goto('/backoffice', { waitUntil: 'domcontentloaded' })
    await expect(
      page.getByRole('heading', { name: /Backoffice|Access Denied/i }).first(),
    ).toBeVisible({ timeout: 25_000 })
    const { violations } = await new AxeBuilder({ page }).analyze()
    expect(seriousOrCriticalViolations(violations)).toEqual([])
  })
})
