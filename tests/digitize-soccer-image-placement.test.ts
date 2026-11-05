import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  applyAssessment1QualityPostProcess,
  reattachImageIndexesFromDocumentMarkers,
} from '../lib/library/digitize/quality-postprocess.ts'
import type { DigitizeFormBlock } from '../lib/library/digitize/types.ts'

/** Minimal Soccer-like handout fragment with the real IMAGE marker positions. */
const SOCCER_DOC = `
Soccer Assessment
Soccer is becoming more popular. A concussion is a type of traumatic brain injury.[IMAGE:1]
A concussion can result from a force of 400–1,000 N on the head.
1. How would the forces from a header with such a light soccer ball cause a concussion?
There are three types of collisions that tend to happen frequently in soccer.
[IMAGE:2]
2a. How would the amount of force on the head compare to the amount of force on the object it collides with in each system A, B, and C?
2b. Explain in words or pictures your choice in 2a.
3a. Which system would you predict to have the least amount of total kinetic energy?
3b. Explain in words and pictures using the images below why the system you chose in 3a would have the least amount of total kinetic energy.
[IMAGE:3]
4. Based on your answer in 3b, which system should have the least amount of peak forces during the collision? Why?
[IMAGE:4]
5. The brain is an organ made of interconnected cells called neurons. Write an argument: During a head collision, which system (A, B, or C) would be most likely to cause damage to some of the axons in the brain?
`.trim()

test('should put the intro photo on the assessment header and the neuron diagram on Q5', () => {
  const misplaced: DigitizeFormBlock[] = [
    { kind: 'question', title: 'Name', type: 'text', required: true },
    { kind: 'question', title: 'Hour', type: 'text', required: true },
    { kind: 'question', title: 'Teacher', type: 'text', required: true },
    {
      kind: 'text',
      title: 'Soccer Assessment1905019050',
      description: 'Soccer is becoming more popular.',
      // LLM forgot the player photo
    },
    {
      kind: 'question',
      title: '1. How would the forces from a header cause a concussion?',
      type: 'file',
      required: true,
      imageIndexes: [1], // wrongly on Q1
    },
    {
      kind: 'text',
      title: 'There are three types of collisions',
      imageIndexes: [2],
    },
    {
      kind: 'question',
      title: '2a. How would the amount of force on the head compare?',
      type: 'radio',
      required: true,
      options: ['same', 'different'],
    },
    {
      kind: 'question',
      title: '3b. Explain in words and pictures using the images below',
      type: 'paragraph',
      required: true,
    },
    {
      kind: 'question',
      title: '4. Based on your answer in 3b, which system should have the least peak forces?',
      type: 'paragraph',
      required: true,
      imageIndexes: [4], // neuron wrongly on Q4
    },
    {
      kind: 'question',
      title:
        '5. Write an argument: During a head collision, which system would damage axons?',
      type: 'paragraph',
      required: true,
    },
  ]

  const fixed = applyAssessment1QualityPostProcess(misplaced, {
    documentText: SOCCER_DOC,
    assessmentTitle: 'Soccer Assessment',
  })

  const intro = fixed.find(
    (block) => block.kind === 'text' && /soccer assessment/i.test(block.title),
  )
  assert.ok(intro && intro.kind === 'text')
  assert.equal(intro.title, 'Soccer Assessment')
  assert.deepEqual(intro.imageIndexes, [1])

  const q4 = fixed.find(
    (block) => block.kind === 'question' && /^4\./.test(block.title),
  )
  assert.ok(q4 && q4.kind === 'question')
  assert.equal(q4.imageIndexes, undefined)

  const q5 = fixed.find(
    (block) => block.kind === 'question' && /^5\./.test(block.title),
  )
  assert.ok(q5 && q5.kind === 'question')
  assert.deepEqual(q5.imageIndexes, [4])

  const q3b = fixed.find(
    (block) => block.kind === 'question' && /^3b\./i.test(block.title),
  )
  assert.ok(q3b && q3b.kind === 'question')
  assert.deepEqual(q3b.imageIndexes, [3])
})

test('should keep images-below figures on the prior prompt, not the next question number', () => {
  const blocks: DigitizeFormBlock[] = [
    {
      kind: 'question',
      title: '3b. Explain using the images below',
      type: 'paragraph',
      required: true,
    },
    {
      kind: 'question',
      title: '4. Which system has the least peak force?',
      type: 'paragraph',
      required: true,
      imageIndexes: [3],
    },
  ]

  const fixed = reattachImageIndexesFromDocumentMarkers(
    blocks,
    '3b. Explain using the images below why.\n[IMAGE:3]\n4. Which system has the least peak force?',
  )

  assert.deepEqual(fixed[0]?.imageIndexes, [3])
  assert.equal(fixed[1] && 'imageIndexes' in fixed[1] ? fixed[1].imageIndexes : undefined, undefined)
})
