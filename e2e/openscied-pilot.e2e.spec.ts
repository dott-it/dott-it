import { test, expect } from '@playwright/test'

test.describe('OpenSciEd Library pilot (Unit 8.1)', () => {
  test('should browse Unit 8.1 and expand opportunities', async ({ page }) => {
    await page.goto('/library/openscied/middle-school/grade-8/units/8.1')
    await page.waitForLoadState('domcontentloaded')

    await expect(page.getByRole('heading', { name: 'Unit 8.1: Contact Forces' })).toBeVisible()
    await expect(
      page.getByText(/16 lessons · \d+ assessment opportunities · \d+ assessments · length: 33 days/),
    ).toBeVisible()

    await expect(page.getByRole('button', { name: /Assessments only \(\d+\)/ })).toBeVisible()
    await expect(page.getByRole('button', { name: "What's in this table?" })).toBeVisible()

    const lesson6Row = page.getByRole('row').filter({ hasText: 'Peak forces in soccer collisions' })
    const lesson6Toggle = lesson6Row.getByRole('button', { name: /assessment opportunit(y|ies)/i })

    await expect(lesson6Toggle).toBeVisible()
    await lesson6Toggle.click()

    await expect(page.getByRole('link', { name: 'Review driving question progress' })).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Soccer assessment (in TE block)' }),
    ).toBeVisible()
    await expect(
      page.getByText('Assessment opportunity · Formative assessment').first(),
    ).toBeVisible()

    await page.getByRole('link', { name: 'Soccer assessment (in TE block)' }).click()
    await expect(page.getByRole('heading', { name: 'What to look / listen for' })).toBeVisible()
    await expect(page.getByText(/6\.A Apply science ideas/i)).toBeVisible()
    await expect(page.getByText(/Peak forces on the head/i)).toBeVisible()
  })

  test('should hide opportunity summaries in Assessments only view', async ({ page }) => {
    await page.goto('/library/openscied/middle-school/grade-8/units/8.1')
    await page.waitForLoadState('domcontentloaded')

    await page.getByRole('button', { name: /Assessments only \(\d+\)/ }).click()

    await expect(page.getByRole('button', { name: /assessment opportunit(y|ies)/i })).toHaveCount(0)
    await expect(page.getByText('Motion and shape in collisions')).not.toBeVisible()
    await expect(page.getByText('Soccer Assessment')).toBeVisible()
  })

  test('should expand lesson driving question and terminology help', async ({ page }) => {
    await page.goto('/library/openscied/middle-school/grade-8/units/8.1')
    await page.waitForLoadState('domcontentloaded')

    await page
      .getByRole('button', { name: 'Things hitting each other' })
      .click()
    await expect(
      page.getByText(
        'What happens when objects collide, and how can we represent those interactions?',
      ),
    ).toBeVisible()

    await page.getByRole('button', { name: "What's in this table?" }).click()
    await expect(page.getByText('In OpenSciEd, an assessment is a standalone document')).toBeVisible()
    await expect(
      page.getByText('An assessment opportunity is a facilitation call-out from the Teacher Edition'),
    ).toBeVisible()
    await expect(page.getByText('Assessment category', { exact: true })).toBeVisible()
    await expect(page.getByText('Assessment guide', { exact: true })).toBeVisible()
    await expect(
      page.getByText(/\d+ assessment opportunities from the Teacher Edition \+ \d+ assessments/),
    ).toBeVisible()
  })

  test('should load ingested browse data for another MS unit (7.1)', async ({ page }) => {
    await page.goto('/library/openscied/middle-school/grade-7/units/7.1')
    await page.waitForLoadState('domcontentloaded')

    await expect(
      page.getByRole('heading', { name: 'Unit 7.1: Chemical Reactions & Matter' }),
    ).toBeVisible()
    await expect(
      page.getByText(/\d+ lessons · \d+ assessment opportunities · \d+ assessments/),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /Assessments only \(\d+\)/ })).toBeVisible()
  })

  test('should show linked TE facilitation on Soccer Assessment detail', async ({ page }) => {
    await page.goto(
      '/library/openscied/middle-school/grade-8/units/8.1/assessments/soccer-assessment-81-6-soccer-assessment',
    )
    await page.waitForLoadState('domcontentloaded')

    await expect(page.getByRole('heading', { name: 'Soccer Assessment', level: 1 })).toBeVisible()
    await expect(
      page.getByRole('navigation', { name: 'breadcrumb' }).getByRole('link', { name: 'Library' }),
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Assessment guide' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Learning progression' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Standards alignment' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'From Teacher Edition' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Building towards' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Materials' })).toBeVisible()
    await expect(page.getByText('Student handout', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Google Form', { exact: true }).first()).toBeVisible()
    await expect(page.getByText(/6\.A Apply science ideas/i).first()).toBeVisible()
    await expect(
      page.getByRole('region', { name: 'From Teacher Edition' }).getByText(/Peak forces on the head/i),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'View assessment opportunity →' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Download / export materials' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add to Dott.it workspace' })).toBeVisible()
  })

  test('should show opportunity detail with TE facilitation and export when handout exists', async ({
    page,
  }) => {
    await page.goto(
      '/library/openscied/middle-school/grade-8/units/8.1/opportunities/review-driving-question-progress-81-6-ao-1',
    )
    await page.waitForLoadState('domcontentloaded')

    await expect(
      page.getByRole('heading', { name: 'Review driving question progress', level: 1 }),
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: 'From Teacher Edition' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'What to look / listen for' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Download / export materials' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add to Dott.it workspace' })).toHaveCount(0)
  })

  test('should filter the unit table with within-unit search', async ({ page }) => {
    await page.goto('/library/openscied/middle-school/grade-8/units/8.1')
    await page.waitForLoadState('domcontentloaded')

    await page.getByRole('textbox', { name: 'Search within unit' }).fill('Soccer')
    await expect(page.getByText('Soccer Assessment')).toBeVisible()
    await expect(page.getByText('Motion and shape in collisions')).not.toBeVisible()
  })

  test('should keep empty lessons visible as sequence context', async ({ page }) => {
    await page.goto('/library/openscied/middle-school/grade-8/units/8.5')
    await page.waitForLoadState('domcontentloaded')

    await expect(page.getByText('No assessments in this lesson — sequence context only.')).toBeVisible()
  })
})
