import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isTransientGoogleTokenFetchError } from '../lib/library/export/impersonated-access-token.ts'

describe('isTransientGoogleTokenFetchError', () => {
  it('should treat undici gzip / premature-close token failures as transient', () => {
    assert.equal(
      isTransientGoogleTokenFetchError(
        new Error('Invalid response body while trying to fetch https://oauth2.googleapis.com/token: incorrect header check'),
      ),
      true,
    )
    assert.equal(
      isTransientGoogleTokenFetchError(
        Object.assign(new Error('Premature close'), { code: 'ERR_STREAM_PREMATURE_CLOSE' }),
      ),
      true,
    )
  })

  it('should not treat permission errors as transient', () => {
    assert.equal(
      isTransientGoogleTokenFetchError(new Error('The user does not have sufficient permissions for this file.')),
      false,
    )
  })
})
