import assert from 'node:assert/strict'
import test from 'node:test'

import {
  hasDisplayableAiFeedback,
  needsAiFeedbackGeneration,
} from '../lib/forms/ai-feedback-presence.ts'

test('should treat missing suggestions and empty feedback rows as needing generation', () => {
  assert.equal(needsAiFeedbackGeneration(null), true)
  assert.equal(needsAiFeedbackGeneration([]), true)
  assert.equal(needsAiFeedbackGeneration([{ feedback: [] }]), true)
})

test('should regenerate when every stored section is an error', () => {
  assert.equal(
    needsAiFeedbackGeneration([
      { feedback: [{ type: 'error', content: 'Unable to generate AI feedback. Please review manually.' }] },
    ]),
    true,
  )
})

test('should keep a general placeholder and any visible strength or suggestion', () => {
  assert.equal(
    needsAiFeedbackGeneration([
      { feedback: [{ type: 'general', content: 'No valid responses were found to evaluate.' }] },
    ]),
    false,
  )
  assert.equal(
    needsAiFeedbackGeneration([
      {
        feedback: [
          {
            type: 'general',
            content: 'Please review this submission and provide manual feedback.',
          },
        ],
      },
    ]),
    false,
  )
  assert.equal(
    needsAiFeedbackGeneration([{ feedback: [{ type: 'strength', content: 'Clear claim.' }] }]),
    false,
  )
  assert.equal(
    hasDisplayableAiFeedback([{ feedback: [{ type: 'suggestion', content: 'Add evidence.' }] }]),
    true,
  )
  assert.equal(
    hasDisplayableAiFeedback([{ feedback: [{ type: 'strength', content: '   ' }] }]),
    false,
  )
})
