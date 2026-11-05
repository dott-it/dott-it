import { test, expect } from '@playwright/test'
import { setupNextJsTest } from './nextjs-test-helpers'
import {
  assessmentDetailPath,
  buildRecord,
  setupThematicAnalysisPageMocks,
  THEMATIC_E2E_ASSESSMENT_ID,
} from './utils/thematic-analysis-fixtures'

test.describe('Assessment thematic analysis tab', () => {
  test('should show empty state when the assessment has no student responses', async ({
    page,
  }) => {
    await setupThematicAnalysisPageMocks(page, {
      records: [
        buildRecord('record-aaa', 'learner-aaa', 'Lucas Anderson', false),
        buildRecord('record-bbb', 'learner-bbb', 'Morgan Lee', false),
      ],
      thematicAnalysis: null,
    })

    await setupNextJsTest(page, assessmentDetailPath())

    await expect(page.getByRole('tab', { name: /Thematic Analysis/i })).toBeVisible()
    await expect(
      page.getByText('We will generate thematic patterns once student responses are in!'),
    ).toBeVisible()
  })

  test('should display completed thematic analysis on the default tab', async ({ page }) => {
    await setupThematicAnalysisPageMocks(page)

    await setupNextJsTest(page, assessmentDetailPath())

    await expect(page.getByRole('tab', { name: /Thematic Analysis/i })).toHaveAttribute(
      'data-state',
      'active',
    )
    await expect(
      page.getByRole('heading', { name: 'What Students Are Working On' }),
    ).toBeVisible()
    await expect(page.getByText('2 Student Responses')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Re-run analysis' })).toBeVisible()
    await expect(page.getByText('COMMON NEEDS')).toBeVisible()
    await expect(page.getByText('COMMON STRENGTHS')).toBeVisible()
    await expect(page.getByText('Biological Accuracy')).toBeVisible()
    await expect(page.getByText('Evidence Use')).toBeVisible()
  })

  test('should expand a theme to show student quote citations', async ({ page }) => {
    await setupThematicAnalysisPageMocks(page)
    await setupNextJsTest(page, assessmentDetailPath())

    await page.getByRole('button', { name: /Biological Accuracy/i }).click()

    await expect(page.getByText(/Cancer steals resources from the body/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /View full response for/i })).toBeVisible()
  })

  test('should switch between thematic analysis and student records tabs', async ({
    page,
  }) => {
    await setupThematicAnalysisPageMocks(page)
    await setupNextJsTest(page, assessmentDetailPath())

    await expect(page.getByText('Biological Accuracy')).toBeVisible()

    await page.getByRole('tab', { name: /Student Records/i }).click()
    await expect(page.getByPlaceholder('Search students...')).toBeVisible()
    await expect(page.getByRole('tab', { name: /Student Records \(2\)/i })).toBeVisible()

    await page.getByRole('tab', { name: /Thematic Analysis/i }).click()
    await expect(page.getByText('COMMON NEEDS')).toBeVisible()
  })

  test('should show run analysis when responses exist but analysis is missing', async ({
    page,
  }) => {
    await setupThematicAnalysisPageMocks(page, { thematicAnalysis: null })
    await setupNextJsTest(page, assessmentDetailPath())

    await expect(page.getByRole('button', { name: 'Run analysis' })).toBeVisible()
    await expect(page.getByText('No Analysis Yet')).toBeVisible()
  })

  test('should POST to trigger analysis when Run analysis is clicked', async ({ page }) => {
    const processingPayload = {
      id: 'thematic-analysis-processing',
      assessmentId: THEMATIC_E2E_ASSESSMENT_ID,
      status: 'processing' as const,
      responsesCount: 2,
      summary: null,
      items: [],
      createdAt: new Date('2026-05-20T14:00:00.000Z'),
      updatedAt: new Date('2026-05-20T14:00:00.000Z'),
    }

    let fetchPhase: 'none' | 'processing' = 'none'
    await setupThematicAnalysisPageMocks(page, {
      thematicAnalysis: null,
      getThematicAnalysis: () =>
        fetchPhase === 'processing' ? processingPayload : null,
      onTriggerPost: () => {
        fetchPhase = 'processing'
        return processingPayload
      },
    })

    await setupNextJsTest(page, assessmentDetailPath())

    const postRequest = page.waitForRequest(
      (req) =>
        req.method() === 'POST' &&
        req.url().includes(`/api/thematic-analysis/${THEMATIC_E2E_ASSESSMENT_ID}`),
    )

    await page.getByRole('button', { name: 'Run analysis' }).click()
    await postRequest

    await expect(page.getByText('Generating Analysis...')).toBeVisible()
  })

  test('should show generating state when analysis status is processing', async ({ page }) => {
    await setupThematicAnalysisPageMocks(page, {
      thematicAnalysis: {
        id: 'thematic-analysis-processing',
        assessmentId: THEMATIC_E2E_ASSESSMENT_ID,
        status: 'processing',
        responsesCount: 2,
        summary: null,
        items: [],
        createdAt: new Date('2026-05-20T14:00:00.000Z'),
        updatedAt: new Date('2026-05-20T14:00:00.000Z'),
      },
    })

    await setupNextJsTest(page, assessmentDetailPath())

    await expect(page.getByText('Generating Analysis...')).toBeVisible()
    await expect(
      page.getByText('We are generating the assessment patterns right now, stay tuned!'),
    ).toBeVisible()
  })
})
