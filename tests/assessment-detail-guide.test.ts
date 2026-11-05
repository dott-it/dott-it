import assert from 'node:assert/strict'
import { test } from 'node:test'
import { assessmentGuideFor } from '../lib/library/assessment-guide/load-guide.ts'
import { parseOseGuidanceBlocks } from '../lib/library/guidance/ose-guidance-text.ts'

test('should load Soccer Assessment guide for Unit 8.1', () => {
  const guide = assessmentGuideFor('8.1', '81-6-soccer-assessment')
  assert.ok(guide)
  assert.match(guide.progression.early, /Peak forces on the head/i)
  assert.equal(guide.alignment.lessonPe, '6.A')
  assert.ok(guide.understanding.strong.length > 0)
})

test('should synthesize a draft guide from Teacher Edition for Unit 8.2 formals', () => {
  const guide = assessmentGuideFor('8.2', '82-6-how-can-objects-make-different-sounds')
  assert.ok(guide)
  assert.match(guide.progression.target, /6\.[AB]/i)
  assert.ok(guide.understanding.strong.length > 0)
  assert.ok(guide.alignment.performanceExpectations.includes('MS-PS4-1'))
})

test('should parse TE look/listen bullets from scraped text', () => {
  const text =
    'What to look/listen for:\nPeak forces on the head and the ball are shown as the same during a header, both drawn in the diagram in question 1 and the selected answer in question 2a.\nContact forces are applied to both objects and are always equal regardless of speed or mass in question 2b.'

  const blocks = parseOseGuidanceBlocks(text, 'lookListenFor')
  assert.ok(blocks.length >= 1)
  const withBullets = blocks.find((block) => block.listItems && block.listItems.length >= 2)
  assert.ok(withBullets)
})
