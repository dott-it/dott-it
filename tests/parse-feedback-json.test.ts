import assert from 'node:assert/strict'
import test from 'node:test'

import { parseModelFeedbackJson } from '../lib/langsmith/parse-feedback-json.ts'

test('should parse a feedback object wrapped in a markdown fence', () => {
  const parsed = parseModelFeedbackJson(
    'Here is the feedback:\n```json\n{"strengths":["Clear claim."],"suggestions":["Add evidence."]}\n```',
  )
  assert.deepEqual(parsed?.strengths, ['Clear claim.'])
  assert.deepEqual(parsed?.suggestions, ['Add evidence.'])
})

test('should parse a feedback object that follows a prose preamble', () => {
  const parsed = parseModelFeedbackJson(
    'Sure — feedback below.\n{"strengths":["You used because."],"suggestions":[]}\nThanks.',
  )
  assert.deepEqual(parsed?.strengths, ['You used because.'])
})

test('should return null when the model reply is not JSON', () => {
  assert.equal(parseModelFeedbackJson('I could not review this response.'), null)
  assert.equal(parseModelFeedbackJson(''), null)
  assert.equal(parseModelFeedbackJson('{"strengths":'), null)
})
