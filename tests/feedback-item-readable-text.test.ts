import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

test('should render strength and suggestion feedback body text at readable size', async () => {
  const contents = await readFile(
    'components/ui/assessment-history/feedback-item-row.tsx',
    'utf8',
  )

  assert.match(
    contents,
    /flex-1 text-sm leading-relaxed/,
    'feedback item body should use text-sm for readability',
  )
  assert.doesNotMatch(
    contents,
    /flex-1 text-xs/,
    'feedback item body should not stay at text-xs',
  )
})
