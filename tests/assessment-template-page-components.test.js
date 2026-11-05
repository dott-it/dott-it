import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import assert from 'node:assert/strict'

test('AssessmentTemplatePageLayout should wrap children with shared spacing', async () => {
  const contents = await readFile(
    '/home/ocarlosfelix/Repos/eddo-workspace/app/lib/components/assessment/assessment-template-page-layout.tsx',
    'utf8',
  )

  assert.match(contents, /export function AssessmentTemplatePageLayout/)
  assert.match(contents, /className="space-y-6"/)
})

test('AssessmentTemplateDetailsSection should render template metadata and info', async () => {
  const contents = await readFile(
    '/home/ocarlosfelix/Repos/eddo-workspace/app/lib/components/assessment/assessment-template-details-section.tsx',
    'utf8',
  )

  assert.match(contents, /export function AssessmentTemplateDetailsSection/)
  assert.match(contents, /Template Information/)
  assert.match(contents, /Metadata/)
  assert.match(contents, /Thematic Analysis Reviewer Instructions/)
  assert.match(contents, /curriculumTeachersEdition/)
  assert.match(contents, /curriculumAnswerKey/)
  assert.match(contents, /template\.title/)
  assert.match(contents, /template\.createdAt/)
})

test('AssessmentTemplateDetailPage should use shared template helpers', async () => {
  const contents = await readFile(
    '/home/ocarlosfelix/Repos/eddo-workspace/app/(dashboard)/backoffice/assessment-templates/[id]/page.tsx',
    'utf8',
  )

  assert.match(contents, /AssessmentTemplateDetailsSection/)
})

test('Assessment component index should re-export template helpers', async () => {
  const contents = await readFile(
    '/home/ocarlosfelix/Repos/eddo-workspace/app/lib/components/assessment/index.ts',
    'utf8',
  )

  assert.match(contents, /AssessmentTemplateDetailsSection/)
  assert.match(contents, /AssessmentTemplatePageLayout/)
})

test('Template usage section exposes load more control', async () => {
  const contents = await readFile(
    '/home/ocarlosfelix/Repos/eddo-workspace/app/(dashboard)/backoffice/assessment-templates/[id]/page.tsx',
    'utf8',
  )

  // Check for usage-related functionality (load more, pagination, etc.)
  assert.ok(
    contents.includes('usageAssessments') ||
    contents.includes('usageHasMore') ||
    contents.includes('loadMoreUsage') ||
    contents.includes('Load more') ||
    contents.includes('load more'),
  )
})

