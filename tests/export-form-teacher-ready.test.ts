import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  LibraryFormTeacherReadyMissingError,
  resolveTeacherReadyGoogleFormId,
} from '../lib/library/export/create-form-in-folder.ts'

test('should resolve teacher-ready id for Soccer Assessment', () => {
  const formId = resolveTeacherReadyGoogleFormId('8.1', '81-6-soccer-assessment')
  assert.ok(formId)
})

test('should report missing teacher-ready for export-only opportunity', () => {
  const formId = resolveTeacherReadyGoogleFormId('8.1', '81-9-ao-3')
  assert.equal(formId, null)

  const error = new LibraryFormTeacherReadyMissingError('Assessment Opportunity 3')
  assert.equal(error.code, 'TEACHER_READY_MISSING')
  assert.match(error.message, /Teacher-ready Google Form is missing/)
  assert.match(error.message, /Playwright convert is not run/)
})
