import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  isPreviewLoginEnabled,
  matchPreviewLogin,
} from '../lib/preview-login.js'

test('preview login should be enabled for preview deployments and local development with credentials configured', () => {
  assert.equal(
    isPreviewLoginEnabled({
      VERCEL_ENV: 'preview',
      PREVIEW_LOGIN_EMAIL: 'preview@eddolearning.com',
      PREVIEW_LOGIN_PASSWORD: 'secret-password',
    }),
    true,
  )

  assert.equal(
    isPreviewLoginEnabled({
      VERCEL_ENV: 'production',
      PREVIEW_LOGIN_EMAIL: 'preview@eddolearning.com',
      PREVIEW_LOGIN_PASSWORD: 'secret-password',
    }),
    false,
  )

  assert.equal(
    isPreviewLoginEnabled({
      NODE_ENV: 'development',
      PREVIEW_LOGIN_EMAIL: 'preview@eddolearning.com',
      PREVIEW_LOGIN_PASSWORD: 'secret-password',
    }),
    true,
  )

  assert.equal(
    isPreviewLoginEnabled({
      VERCEL_ENV: 'preview',
      PREVIEW_LOGIN_EMAIL: 'preview@eddolearning.com',
    }),
    false,
  )
})

test('preview login should match configured email case-insensitively and password exactly', () => {
  const env = {
    VERCEL_ENV: 'preview',
    PREVIEW_LOGIN_EMAIL: 'Preview@EddoLearning.com',
    PREVIEW_LOGIN_PASSWORD: 'secret-password',
    PREVIEW_LOGIN_NAME: 'Preview Teacher',
  }

  assert.deepEqual(
    matchPreviewLogin(
      { email: ' preview@eddolearning.com ', password: 'secret-password' },
      env,
    ),
    {
      email: 'preview@eddolearning.com',
      name: 'Preview Teacher',
    },
  )

  assert.equal(
    matchPreviewLogin(
      { email: 'preview@eddolearning.com', password: 'Secret-Password' },
      env,
    ),
    null,
  )
})

test('preview credential auth should not reactivate existing users', async () => {
  const contents = await readFile(
    new URL('../lib/credential-auth.ts', import.meta.url),
    'utf8',
  )

  assert.equal(contents.includes('userPrisma.user.upsert'), false)
  assert.match(contents, /existingUser && !existingUser\.active/)
  assert.match(contents, /ACCOUNT_INACTIVE/)
  assert.match(contents, /userPrisma\.user\.create\(\{[\s\S]*active: true/)
})
