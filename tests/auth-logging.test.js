import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import assert from 'node:assert/strict'

test('auth logging should not include submitted credentials', async () => {
  const contents = await readFile(
    new URL('../lib/auth.config.ts', import.meta.url),
    'utf8',
  )

  assert.equal(contents.includes('credentials: _credentials'), false)
  assert.equal(contents.includes('_credentials'), false)
})
