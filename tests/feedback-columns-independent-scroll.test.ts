import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import {
  computeFeedbackColumnsAvailableHeight,
  FEEDBACK_COLUMNS_AVAILABLE_HEIGHT_VAR,
  FEEDBACK_COLUMNS_MIN_HEIGHT_PX,
  FEEDBACK_COLUMNS_VIEWPORT_GAP_PX,
} from '../app/lib/assessment/feedback-columns-available-height'

test('should compute available column height from sticky bottom, not a rem constant', () => {
  assert.equal(
    computeFeedbackColumnsAvailableHeight(900, 200),
    900 - 200 - FEEDBACK_COLUMNS_VIEWPORT_GAP_PX,
  )
  assert.equal(
    computeFeedbackColumnsAvailableHeight(500, 400),
    FEEDBACK_COLUMNS_MIN_HEIGHT_PX,
    'should clamp to the minimum pane height when the sticky header is tall',
  )
  assert.equal(
    computeFeedbackColumnsAvailableHeight(800, 100, { gapPx: 24, minPx: 100 }),
    676,
  )
})

test('should keep Student Response and Feedback columns scrolling independently', async () => {
  const container = await readFile(
    'components/ui/assessment-history/assessment-history-container.tsx',
    'utf8',
  )
  const studentResponse = await readFile(
    'components/ui/assessment-history/student-response-section.tsx',
    'utf8',
  )
  const feedback = await readFile(
    'components/ui/assessment-history/feedback-section.tsx',
    'utf8',
  )
  const page = await readFile(
    'app/(dashboard)/workspace/assessments/[id]/[studentEntryId]/page.tsx',
    'utf8',
  )

  assert.match(
    page,
    /useFeedbackColumnsAvailableHeight/,
    'page should measure sticky header and set available column height',
  )
  assert.match(
    page,
    /stickyHeaderRef/,
    'sticky header ref missing for height measurement',
  )
  assert.match(
    page,
    /\$\{isLoading\}:\$\{detailsExpanded\}/,
    'layoutKey should include isLoading so the effect re-runs after sticky chrome mounts',
  )

  assert.match(
    container,
    /data-feedback-columns-grid/,
    'two-column grid marker missing',
  )
  assert.match(
    container,
    /lg:max-h-\[var\(--feedback-columns-available-height,70dvh\)\]/,
    'columns should use measured available height instead of a hardcoded rem offset',
  )
  assert.equal(
    FEEDBACK_COLUMNS_AVAILABLE_HEIGHT_VAR,
    '--feedback-columns-available-height',
  )
  assert.doesNotMatch(
    container,
    /100dvh-11rem/,
    'hardcoded 11rem viewport offset should be removed',
  )
  assert.match(
    container,
    /data-feedback-column="student-response"/,
    'student response column marker missing',
  )
  assert.match(
    container,
    /data-feedback-column="feedback"/,
    'feedback column marker missing',
  )

  const shellMatch = container.match(
    /data-feedback-columns-shell[^>]*className="([^"]*)"/,
  )
  assert.ok(shellMatch, 'shared columns shell marker missing')
  assert.doesNotMatch(
    shellMatch[1],
    /overflow-auto/,
    'shared overflow-auto would couple both columns to one scroll container',
  )

  assert.match(
    studentResponse,
    /data-scroll-region="student-response"/,
    'student response scroll region missing',
  )
  assert.match(
    studentResponse,
    /data-scroll-region="student-response"[\s\S]*?overflow-y-auto/,
    'student response should scroll inside its card',
  )
  assert.doesNotMatch(
    studentResponse,
    /lg:sticky/,
    'sticky student response fights independent column scrolling',
  )

  assert.match(
    feedback,
    /data-scroll-region="feedback"/,
    'feedback scroll region missing',
  )
  assert.match(
    feedback,
    /data-scroll-region="feedback"[\s\S]*?overflow-y-auto/,
    'feedback should scroll inside its card',
  )
})
