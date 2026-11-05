import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'

test('AssessmentTemplateCard should be exported and render minimal fields', async () => {
  const contents = await readFile('app/lib/components/assessment/assessment-template-card.tsx', 'utf8')
  assert.match(contents, /export function AssessmentTemplateCard\(/)
  assert.ok(contents.includes('CardHeader'))
  assert.ok(contents.includes('CardContent'))
  assert.ok(contents.includes('Badge'))
  assert.ok(contents.includes('template.title'))
  assert.ok(contents.includes('Link'))
})

test('AssessmentTemplateCard should be used in backoffice', async () => {
  // Check if component is exported from index
  const indexContents = await readFile('app/lib/components/assessment/index.ts', 'utf8')
  assert.ok(indexContents.includes('AssessmentTemplateCard'))
  
  // Check if component is used in backoffice templates list
  const listContents = await readFile(
    'app/(dashboard)/backoffice/_components/assessment-template-list.tsx',
    'utf8',
  )
  assert.ok(listContents.includes('AssessmentTemplateCard'))
})


