import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  checkLibraryFormGenerationRateLimit,
  recordLibraryFormGenerationRateLimit,
  resetLibraryFormGenerationRateLimitForTests,
} from '../lib/library/export/form-generation-rate-limit.ts'

test('should allow Form generation under the rate limit', () => {
  resetLibraryFormGenerationRateLimitForTests()
  const first = checkLibraryFormGenerationRateLimit({ key: 't1', limit: 2, windowMs: 60_000 })
  assert.equal(first.allowed, true)
  if (first.allowed) {
    assert.equal(first.remaining, 1)
  }
})

test('should reject Form generation after the sliding window fills', () => {
  resetLibraryFormGenerationRateLimitForTests()
  const now = 1_000_000
  assert.equal(
    checkLibraryFormGenerationRateLimit({ key: 't2', limit: 2, windowMs: 60_000, nowMs: now })
      .allowed,
    true,
  )
  assert.equal(
    checkLibraryFormGenerationRateLimit({
      key: 't2',
      limit: 2,
      windowMs: 60_000,
      nowMs: now + 1000,
    }).allowed,
    true,
  )

  const blocked = checkLibraryFormGenerationRateLimit({
    key: 't2',
    limit: 2,
    windowMs: 60_000,
    nowMs: now + 2000,
  })
  assert.equal(blocked.allowed, false)
  if (!blocked.allowed) {
    assert.ok(blocked.retryAfterSeconds >= 1)
  }
})

test('should isolate rate limit buckets by key', () => {
  resetLibraryFormGenerationRateLimitForTests()
  const now = 2_000_000
  assert.equal(
    checkLibraryFormGenerationRateLimit({ key: 'a', limit: 1, windowMs: 60_000, nowMs: now })
      .allowed,
    true,
  )
  assert.equal(
    checkLibraryFormGenerationRateLimit({ key: 'b', limit: 1, windowMs: 60_000, nowMs: now })
      .allowed,
    true,
  )
  assert.equal(
    checkLibraryFormGenerationRateLimit({ key: 'a', limit: 1, windowMs: 60_000, nowMs: now + 1 })
      .allowed,
    false,
  )
})

test('should not consume quota on peek when export later fails', () => {
  resetLibraryFormGenerationRateLimitForTests()
  const now = 3_000_000
  const peek = checkLibraryFormGenerationRateLimit({
    key: 'peek',
    limit: 1,
    windowMs: 60_000,
    nowMs: now,
    consume: false,
  })
  assert.equal(peek.allowed, true)
  if (peek.allowed) {
    assert.equal(peek.remaining, 1)
  }

  // Transient failure: do not record — next peek still allowed.
  const again = checkLibraryFormGenerationRateLimit({
    key: 'peek',
    limit: 1,
    windowMs: 60_000,
    nowMs: now + 1,
    consume: false,
  })
  assert.equal(again.allowed, true)

  recordLibraryFormGenerationRateLimit({ key: 'peek', windowMs: 60_000, nowMs: now + 2 })
  const afterSuccess = checkLibraryFormGenerationRateLimit({
    key: 'peek',
    limit: 1,
    windowMs: 60_000,
    nowMs: now + 3,
    consume: false,
  })
  assert.equal(afterSuccess.allowed, false)
})
