import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

test('record list includes show names toggle and class filter', async () => {
  const contents = await readFile('components/assessment-record-list.tsx', 'utf8')
  assert.ok(contents.includes('Show Names'), 'show names label missing')
  assert.ok(contents.includes('classFilter'), 'class filter state missing')
})
