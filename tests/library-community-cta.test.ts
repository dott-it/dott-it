import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DOTT_COMMUNITY_DEMO_URL } from '../lib/library/site-url.ts'

test('should point the Dott.it community CTA to the marketing demo page', () => {
  assert.equal(DOTT_COMMUNITY_DEMO_URL, 'https://dott-it.vercel.app')
})
