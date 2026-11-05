import assert from 'node:assert/strict'
import { test } from 'node:test'
import { findIngestedAssessment } from '../lib/library/ingest/load-manifest.ts'
import { isDigitizeEligible } from '../lib/library/digitize/eligibility.ts'

test('should accept formal assessments with handout and no Google Form', () => {
  const row = findIngestedAssessment('8.1', '81-10-baseball-assessment-1')
  assert.ok(row)
  const result = isDigitizeEligible({
    ...row,
    files: {
      ...row.files,
      googleForm: null,
      googleFormTeacherReady: null,
    },
  })
  assert.equal(result.eligible, true)
  assert.equal(result.reason, undefined)
})

test('should skip when a Google Form URL is already present', () => {
  const row = findIngestedAssessment('8.1', '81-10-baseball-assessment-1')
  assert.ok(row)
  assert.ok(row.files.googleForm?.trim() || row.files.googleFormTeacherReady?.trim())
  const result = isDigitizeEligible(row)
  assert.equal(result.eligible, false)
  assert.equal(result.reason, 'google-form-already-present')
})

test('should allow force regenerate when a Google Form URL is already present', () => {
  const row = findIngestedAssessment('8.1', '81-10-baseball-assessment-1')
  assert.ok(row)
  const result = isDigitizeEligible(row, { force: true })
  assert.equal(result.eligible, true)
})

test('should reject TE opportunities as digitize candidates', () => {
  const row = findIngestedAssessment('8.1', '81-6-ao-2')
  assert.ok(row)
  const result = isDigitizeEligible(row)
  assert.equal(result.eligible, false)
  assert.equal(result.reason, 'not-formal-assessment')
})

test('should reject formal assessments without a student handout', () => {
  const row = findIngestedAssessment('8.1', '81-10-baseball-assessment-1')
  assert.ok(row)
  const result = isDigitizeEligible({
    ...row,
    files: { ...row.files, studentHandout: null },
  })
  assert.equal(result.eligible, false)
  assert.equal(result.reason, 'missing-student-handout')
})
