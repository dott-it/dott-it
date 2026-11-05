import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import assert from 'node:assert/strict'

test('login route should reject inactive accounts', async () => {
  const contents = await readFile(
    '/home/ocarlosfelix/Repos/eddo-workspace/app/api/auth/login/route.ts',
    'utf8',
  )

  assert.match(contents, /ACCOUNT_INACTIVE/)
  assert.match(contents, /user\.active/)
})

test('user list API should expose the active flag', async () => {
  const contents = await readFile(
    '/home/ocarlosfelix/Repos/eddo-workspace/app/api/users/route.ts',
    'utf8',
  )

  assert.match(contents, /active:\s*user\.active/)
  assert.match(contents, /active:\s*active\s*\?\?/ )
})

test('user detail API should soft delete by toggling active', async () => {
  const contents = await readFile(
    '/home/ocarlosfelix/Repos/eddo-workspace/app/api/users/[id]/route.ts',
    'utf8',
  )

  assert.match(contents, /userPrisma\.user\.update/)
  assert.match(contents, /active:\s*false/)
})

