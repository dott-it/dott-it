import assert from 'node:assert/strict'
import { test } from 'node:test'
import { GoogleApiRequestError, googleApiJson } from '../lib/library/export/google-api-fetch.ts'

test('should accept empty successful Google API responses (e.g. Drive DELETE)', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = (async () =>
    new Response('', { status: 200 })) as typeof fetch

  try {
    const result = await googleApiJson<{ ok?: boolean }>('token', 'https://example.test/files/1', {
      method: 'DELETE',
    })
    assert.deepEqual(result, {})
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('should surface Google API error messages from JSON error bodies', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ error: { message: 'Permission denied', code: 403 } }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })) as typeof fetch

  try {
    await assert.rejects(
      () => googleApiJson('token', 'https://example.test/files/1'),
      (error: unknown) =>
        error instanceof GoogleApiRequestError &&
        error.status === 403 &&
        error.message === 'Permission denied',
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})
