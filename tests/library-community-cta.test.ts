import assert from 'node:assert/strict'
import { test } from 'node:test'
import { EDDO_COMMUNITY_DEMO_URL } from '../lib/library/site-url.ts'

test('should point the Eddo community CTA to the marketing demo page', () => {
  assert.equal(EDDO_COMMUNITY_DEMO_URL, 'https://eddolearning.com/demo')
})
