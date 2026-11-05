import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'

const files = [
  'components/assessment-card.tsx',
  'app/(dashboard)/workspace/assessments/[id]/page.tsx',
]

test('should use workspace paths for session links', async () => {
  for (const file of files) {
    const contents = await readFile(file, 'utf8')
    expect(contents).not.toContain('/workspace/units/')
  }
})
