import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { chromium, type Browser, type BrowserContext, type Page } from '@playwright/test'
import { FILE_RESPONSE_MARKER, stripFileResponseHint } from './file-response-marker'

const AUTH_STATE_PATH = path.join(process.cwd(), '.cache', 'forms-google-auth.json')

export interface PlaywrightFileUploadConvertResult {
  formId: string
  converted: number
  titles: string[]
  method: 'playwright-ui'
}

/**
 * Convert `[File response]` paragraph items to native File upload via the Forms editor UI.
 * Google does not allow creating File upload through Forms API or Apps Script.
 */
export async function convertFileUploadItemsViaPlaywright(args: {
  formId: string
  titles: string[]
  headed?: boolean
}): Promise<PlaywrightFileUploadConvertResult> {
  if (args.titles.length === 0) {
    return { formId: args.formId, converted: 0, titles: [], method: 'playwright-ui' }
  }

  const browser = await chromium.launch({
    headless: args.headed === true ? false : true,
  })

  try {
    const context = await openFormsContext(browser, { headed: args.headed })
    const page = await context.newPage()
    await page.goto(`https://docs.google.com/forms/d/${args.formId}/edit`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    })
    await dismissDialogs(page)
    await page.waitForTimeout(2000)

    if (await looksLikeLogin(page)) {
      throw new Error(
        'Google session missing for forms@. Run: pnpm digitize:form -- --forms-ui-login',
      )
    }
    if (await looksLikeAccessDenied(page)) {
      throw new Error(
        `forms@ cannot edit Form ${args.formId} (need owner or writer). Check Drive sharing.`,
      )
    }

    // Email collection is set via Forms API before Playwright runs; skip Settings UI
    // (it slows export and can leave the editor in a bad selection state).
    await dismissDialogs(page)
    await assertFileResponseMarkersPresent(page)

    const maxPasses = Math.max(args.titles.length + 2, 6)
    let converted = 0
    for (let pass = 0; pass < maxPasses; pass += 1) {
      await page.keyboard.press('Escape').catch(() => {
        /* ignore */
      })
      await page.waitForTimeout(200)
      const remaining = await countFileResponseMarkers(page)
      console.error(`[convert] pass=${pass + 1} remainingMarkers=${remaining}`)
      if (remaining === 0) {
        break
      }

      let changed = false
      try {
        changed = await convertNextFileResponseMarker(page)
      } catch (error) {
        console.warn(`[convert] pass error: ${(error as Error).message}`)
        changed = false
      }
      if (!changed) {
        console.warn(`[convert] stopping after failed pass with ${remaining} marker(s) left`)
        break
      }
      converted += 1
      await page.waitForTimeout(600)
    }

    await context.storageState({ path: AUTH_STATE_PATH })
    return {
      formId: args.formId,
      converted,
      titles: args.titles.slice(0, converted),
      method: 'playwright-ui',
    }
  } finally {
    await browser.close()
  }
}

/**
 * One-time headed login as forms@; saves Playwright storage state for later headless runs.
 */
export async function loginFormsUiSession(options?: {
  email?: string
  password?: string
}): Promise<string> {
  mkdirSync(path.dirname(AUTH_STATE_PATH), { recursive: true })
  const email =
    options?.email?.trim() ||
    process.env.GOOGLE_FORMS_UI_EMAIL?.trim() ||
    process.env.GOOGLE_FORMS_IMPERSONATE_USER?.trim() ||
    'forms@eddolearning.com'
  const password =
    options?.password?.trim() || process.env.GOOGLE_FORMS_UI_PASSWORD?.trim() || ''

  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    await page.goto(
      'https://accounts.google.com/ServiceLogin?hl=en&continue=https%3A%2F%2Fdocs.google.com%2Fforms%2F',
      {
        waitUntil: 'domcontentloaded',
        timeout: 120_000,
      },
    )

    if (password) {
      await fillGoogleLogin(page, email, password)
    } else {
      console.log(
        `\nSign in as ${email} in the browser window.` +
          `\nOptional: set GOOGLE_FORMS_UI_PASSWORD to auto-fill.` +
          `\nWhen you reach Google Forms (not the accounts login page), leave the window open — waiting up to 5 minutes…\n`,
      )
      // Do not use page.waitForFunction — Google Accounts enforces Trusted Types.
      await waitForFormsHome(page, 300_000)
    }

    await page.goto('https://docs.google.com/forms/u/0/', {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    })
    await page.waitForTimeout(2000)
    if (await looksLikeLogin(page)) {
      throw new Error('Login did not complete — forms.google.com still shows a sign-in page')
    }

    await context.storageState({ path: AUTH_STATE_PATH })
    return AUTH_STATE_PATH
  } finally {
    await browser.close()
  }
}

export function formsUiAuthStatePath(): string {
  return AUTH_STATE_PATH
}

async function openFormsContext(
  browser: Browser,
  options?: { headed?: boolean },
): Promise<BrowserContext> {
  mkdirSync(path.dirname(AUTH_STATE_PATH), { recursive: true })
  try {
    return await browser.newContext({ storageState: AUTH_STATE_PATH })
  } catch {
    if (options?.headed) {
      return browser.newContext()
    }
    throw new Error(
      `Missing Forms UI auth state at ${AUTH_STATE_PATH}. Run: pnpm digitize:form -- --forms-ui-login`,
    )
  }
}

async function waitForFormsHome(page: Page, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const url = page.url()
    if (/docs\.google\.com\/forms/.test(url) && !/accounts\.google\.com/.test(url)) {
      return
    }
    await page.waitForTimeout(1000)
  }
  throw new Error(`Timed out waiting for Google Forms login (${timeoutMs}ms)`)
}

async function fillGoogleLogin(page: Page, email: string, password: string): Promise<void> {
  const emailInput = page.locator('input[type="email"]').first()
  await emailInput.waitFor({ state: 'visible', timeout: 60_000 })
  await emailInput.fill(email)
  await page.locator('#identifierNext, button:has-text("Next")').first().click()

  const passwordInput = page.locator('input[type="password"]').first()
  await passwordInput.waitFor({ state: 'visible', timeout: 60_000 })
  await passwordInput.fill(password)
  await page.locator('#passwordNext, button:has-text("Next")').first().click()

  await page.waitForURL(/docs\.google\.com|myaccount\.google\.com|google\.com\/forms/, {
    timeout: 120_000,
  })
}

async function looksLikeLogin(page: Page): Promise<boolean> {
  const url = page.url()
  if (/accounts\.google\.com/.test(url)) {
    return true
  }
  const signIn = page.getByRole('button', { name: /sign in/i })
  return (await signIn.count()) > 0 && (await signIn.first().isVisible().catch(() => false))
}

async function looksLikeAccessDenied(page: Page): Promise<boolean> {
  const denied = page.getByText(/you need access|request access|precisa de acesso|ask for access/i)
  return (await denied.count()) > 0 && (await denied.first().isVisible().catch(() => false))
}

async function assertFileResponseMarkersPresent(page: Page): Promise<void> {
  try {
    await page
      .getByText(FILE_RESPONSE_MARKER, { exact: false })
      .first()
      .waitFor({ state: 'attached', timeout: 60_000 })
  } catch {
    const title = await page.title().catch(() => '')
    const body = ((await page.locator('body').textContent().catch(() => '')) || '').slice(0, 400)
    throw new Error(
      `Forms editor did not show [File response] markers. url=${page.url()} title=${title} body=${body}`,
    )
  }
}

async function dismissDialogs(page: Page): Promise<void> {
  for (const name of ['Got it', 'OK', 'Accept', 'I understand', 'Continue', 'Allow']) {
    const button = page.getByRole('button', { name: new RegExp(`^${name}$`, 'i') })
    if ((await button.count()) > 0 && (await button.first().isVisible().catch(() => false))) {
      await button.first().click().catch(() => {
        /* ignore */
      })
      await page.waitForTimeout(300)
    }
  }
}

/**
 * Click Google Forms “Restore” for Missing File Upload folders.
 * Drive API folderId updates are not recognized by Forms; only this UI action binds folders.
 */
export async function restoreFileUploadFoldersViaPlaywright(args: {
  formId: string
  headed?: boolean
}): Promise<{ formId: string; restored: boolean; method: 'playwright-ui' }> {
  const browser = await chromium.launch({
    headless: args.headed === true ? false : true,
  })

  try {
    const context = await openFormsContext(browser, { headed: args.headed })
    const page = await context.newPage()
    await page.goto(`https://docs.google.com/forms/d/${args.formId}/edit`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    })
    await dismissDialogs(page)
    await page.waitForTimeout(2000)

    if (await looksLikeLogin(page)) {
      throw new Error(
        'Google session missing for forms@. Run: pnpm digitize:form -- --forms-ui-login',
      )
    }
    if (await looksLikeAccessDenied(page)) {
      throw new Error(
        `forms@ cannot edit Form ${args.formId} (need owner or writer). Check Drive sharing.`,
      )
    }

    const restored = await clickRestoreMissingFileUploadFolders(page)
    await context.storageState({ path: AUTH_STATE_PATH })
    return { formId: args.formId, restored, method: 'playwright-ui' }
  } finally {
    await browser.close()
  }
}

async function clickRestoreMissingFileUploadFolders(page: Page): Promise<boolean> {
  const banner = page.getByText(
    /Missing File Upload folders|Missing file upload folder|pastas de envio de arquivos|pastas de upload de arquivo/i,
  )
  const bannerVisible =
    (await banner.count()) > 0 && (await banner.first().isVisible().catch(() => false))
  if (!bannerVisible) {
    console.error('[restore] No “Missing File Upload folders” banner — nothing to restore')
    return false
  }

  const restore = page.getByRole('button', { name: /^(Restore|Restaurar)$/i })
  if ((await restore.count()) === 0) {
    // Some builds put Restore as a text link inside the banner.
    const link = page.getByText(/^(Restore|Restaurar)$/i)
    if ((await link.count()) === 0 || !(await link.first().isVisible().catch(() => false))) {
      throw new Error('Missing File Upload folders banner is visible but Restore control was not found')
    }
    await link.first().click()
  } else {
    await restore.first().click()
  }

  console.error('[restore] Clicked Restore for Missing File Upload folders')
  await page.waitForTimeout(2500)
  await dismissDialogs(page)

  const stillVisible =
    (await banner.count()) > 0 && (await banner.first().isVisible().catch(() => false))
  if (stillVisible) {
    console.warn('[restore] Banner still visible after Restore click')
  }
  return true
}

async function countFileResponseMarkers(page: Page): Promise<number> {
  const markers = page.getByText(FILE_RESPONSE_MARKER, { exact: false })
  const total = await markers.count()
  let visible = 0
  for (let i = 0; i < total; i += 1) {
    if (await markers.nth(i).isVisible().catch(() => false)) {
      visible += 1
    }
  }
  return visible > 0 ? visible : total
}

/**
 * Convert the first remaining `[File response]` item to File upload.
 */
async function convertNextFileResponseMarker(page: Page): Promise<boolean> {
  const clicked = await clickFileResponseMarker(page)
  if (!clicked) {
    console.warn('No [File response] marker available to click')
    return false
  }
  await page.waitForTimeout(800)

  if (!(await openQuestionTypeMenu(page))) {
    console.warn('Could not open question-type menu')
    return false
  }

  // Require a real open menu (collapsed control only shows "Paragraph").
  const fileOption = page
    .locator('[role="listbox"][aria-expanded="true"] [role="option"], [role="listbox"] [role="option"]:visible')
    .filter({ hasText: /file upload|envio de arquivo/i })
    .first()

  try {
    await fileOption.waitFor({ state: 'visible', timeout: 5000 })
  } catch {
    const labels = await readOpenQuestionTypeLabels(page)
    console.error(`Visible question type options: ${labels.join(' | ') || '(none)'}`)
    console.warn('File upload option not found in question-type menu')
    await page.keyboard.press('Escape').catch(() => {
      /* ignore */
    })
    return false
  }

  const labels = await readOpenQuestionTypeLabels(page)
  console.error(`Visible question type options: ${labels.join(' | ')}`)

  const disabled = await fileOption.getAttribute('aria-disabled', { timeout: 2000 }).catch(() => null)
  if (disabled === 'true') {
    throw new Error(
      'File upload is disabled. Form must live in My Drive (not a Shared Drive) and collect verified email.',
    )
  }

  await fileOption.click({ timeout: 5000 })
  await page.waitForTimeout(1000)
  await dismissDialogs(page)
  await chooseFileUploadMaxSizeIfPresent(page)
  await page.keyboard.press('Escape').catch(() => {
    /* ignore */
  })
  await page.waitForTimeout(200)
  await page.mouse.click(40, 120)
  await page.waitForTimeout(300)
  await stripMarkerFromVisibleDescription(page)
  return true
}

/**
 * Open the question-type dropdown for the currently selected item.
 * Success = File upload option becomes visible (not the collapsed "Paragraph" label).
 */
async function openQuestionTypeMenu(page: Page): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const visibleTypes = page.locator(
      '[aria-label="Question types"]:visible, [aria-label="Tipos de pergunta"]:visible',
    )
    const typeCount = await visibleTypes.count()
    console.error(`[convert] question-type controls visible=${typeCount} (attempt ${attempt + 1})`)

    if (typeCount > 0) {
      await visibleTypes.first().click({ timeout: 5000 })
    } else {
      let clicked = false
      for (const name of ['Paragraph', 'Short answer', 'Parágrafo', 'Resposta curta']) {
        const nodes = page.getByText(name, { exact: true })
        const count = await nodes.count()
        for (let i = 0; i < count; i += 1) {
          const node = nodes.nth(i)
          if (!(await node.isVisible().catch(() => false))) {
            continue
          }
          await node.click({ timeout: 5000 })
          clicked = true
          break
        }
        if (clicked) {
          break
        }
      }
      if (!clicked) {
        await clickFileResponseMarker(page)
        await page.waitForTimeout(600)
        continue
      }
    }

    const fileOption = page.getByRole('option', { name: /file upload|envio de arquivo/i }).first()
    const appeared = await fileOption
      .waitFor({ state: 'visible', timeout: 4000 })
      .then(() => true)
      .catch(() => false)
    if (appeared) {
      return true
    }
    console.error('[convert] question-type listbox did not expand with File upload; retrying')
    await page.keyboard.press('Escape').catch(() => {
      /* ignore */
    })
    await page.waitForTimeout(200)
    await clickFileResponseMarker(page)
    await page.waitForTimeout(600)
  }
  return false
}

async function readOpenQuestionTypeLabels(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const boxes = [...document.querySelectorAll('[role="listbox"]')]
    for (const box of boxes.reverse()) {
      const options = [...box.querySelectorAll('[role="option"]')]
        .map((opt) => {
          const text = (opt.textContent || '').replaceAll(/\s+/g, ' ').trim()
          const disabled = opt.getAttribute('aria-disabled') === 'true'
          return text ? `${disabled ? '[disabled] ' : ''}${text}` : ''
        })
        .filter(Boolean)
      if (options.length >= 5) {
        return options
      }
    }
    return []
  })
}

async function chooseFileUploadMaxSizeIfPresent(page: Page): Promise<void> {
  const sizeOption = page.getByRole('option', { name: /^(10 MB|100 MB|1 GB|10 GB)$/i }).first()
  if (await sizeOption.isVisible().catch(() => false)) {
    await sizeOption.click({ timeout: 2000 }).catch(() => {
      /* ignore */
    })
    await page.waitForTimeout(300)
  }
}

async function stripMarkerFromVisibleDescription(page: Page): Promise<void> {
  const description = page.locator('textarea:visible, [contenteditable="true"]:visible').filter({
    hasText: FILE_RESPONSE_MARKER,
  })
  if ((await description.count()) === 0) {
    return
  }
  const field = description.first()
  const current = await field.inputValue().catch(async () => (await field.textContent()) ?? '')
  const cleaned = stripFileResponseHint(current)
  if (cleaned === current) {
    return
  }
  await field.fill(cleaned).catch(async () => {
    await field.click({ force: true })
    await page.keyboard.press('Control+A')
    await page.keyboard.type(cleaned)
  })
}

/**
 * Click a `[File response]` marker / its question card.
 */
async function clickFileResponseMarker(page: Page): Promise<boolean> {
  const markers = page.getByText(FILE_RESPONSE_MARKER, { exact: false })
  const markerCount = await markers.count()
  console.error(`[convert] [File response] markers attached=${markerCount}`)
  if (markerCount === 0) {
    return false
  }

  for (let index = 0; index < markerCount; index += 1) {
    const marker = markers.nth(index)
    if (!(await marker.isVisible().catch(() => false))) {
      continue
    }
    await marker.scrollIntoViewIfNeeded().catch(() => {
      /* ignore */
    })
    try {
      await marker.click({ force: true, timeout: 5000 })
      return true
    } catch (error) {
      console.error(
        `[convert] visible marker click failed (${(error as Error).message}); trying next`,
      )
    }
  }

  return page.evaluate((markerText) => {
    const nodes = [...document.querySelectorAll('span, div, p, label')]
    const matches = nodes.filter((node) => (node.textContent || '').includes(markerText))
    const withBox = matches.find((node) => (node as HTMLElement).getClientRects().length > 0)
    const target = (withBox || matches[0]) as HTMLElement | undefined
    if (!target) {
      return false
    }
    target.scrollIntoView({ block: 'center', inline: 'nearest' })
    target.click()
    return true
  }, FILE_RESPONSE_MARKER)
}
