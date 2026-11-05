import assert from 'node:assert/strict'
import { test } from 'node:test'
import jwt from 'jsonwebtoken'
import {
  signLibraryExportGoogleToken,
  verifyLibraryExportGoogleToken,
} from '../lib/library/export/google-export-session.ts'
import { LIBRARY_EXPORT_DRIVE_SCOPE } from '../lib/library/export/google-oauth.ts'

const SECRET = 'test-library-export-session-secret'

test('should keep full Drive scope for Shared Drive ACL-aligned copy', () => {
  assert.equal(LIBRARY_EXPORT_DRIVE_SCOPE, 'https://www.googleapis.com/auth/drive')
})

test('should sign only access-session fields and verify them', () => {
  process.env.NEXTAUTH_SECRET = SECRET

  const token = signLibraryExportGoogleToken({
    accessToken: 'ya29.access',
    expiryDate: Date.now() + 60 * 60 * 1000,
    email: 'teacher@example.com',
    dottUserId: 'user-1',
  })

  const payload = verifyLibraryExportGoogleToken(token)
  assert.deepEqual(payload, {
    accessToken: 'ya29.access',
    expiryDate: payload?.expiryDate,
    email: 'teacher@example.com',
    dottUserId: 'user-1',
  })
  assert.ok(payload?.expiryDate && payload.expiryDate > Date.now())

  const decoded = jwt.decode(token) as Record<string, unknown>
  assert.equal('refreshToken' in decoded, false)
})

test('should reject cookies that still embed a Google refresh token', () => {
  process.env.NEXTAUTH_SECRET = SECRET

  const legacy = jwt.sign(
    {
      accessToken: 'ya29.access',
      refreshToken: '1//refresh',
      expiryDate: Date.now() + 60 * 60 * 1000,
    },
    SECRET,
    { expiresIn: '1h' },
  )

  assert.equal(verifyLibraryExportGoogleToken(legacy), null)
})

test('should reject expired access tokens', () => {
  process.env.NEXTAUTH_SECRET = SECRET

  const token = signLibraryExportGoogleToken({
    accessToken: 'ya29.access',
    expiryDate: Date.now() - 1000,
  })

  assert.equal(verifyLibraryExportGoogleToken(token), null)
})

test('should round-trip dottUserId binding on export cookies', () => {
  process.env.NEXTAUTH_SECRET = SECRET

  const token = signLibraryExportGoogleToken({
    accessToken: 'ya29.access',
    expiryDate: Date.now() + 60 * 60 * 1000,
    dottUserId: 'dott-it-user-42',
  })

  const payload = verifyLibraryExportGoogleToken(token)
  assert.equal(payload?.dottUserId, 'dott-it-user-42')
})
