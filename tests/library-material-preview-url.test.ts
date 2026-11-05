import assert from 'node:assert/strict'
import test from 'node:test'
import {
  isDriveDocumentPreviewKind,
  libraryMaterialPreviewUrl,
} from '../lib/library/materials/library-material-preview-url.ts'

test('should build material preview URL for Drive-backed package kinds', () => {
  assert.equal(
    libraryMaterialPreviewUrl({
      unitCode: '8.1',
      assessmentId: '81-6-soccer-assessment',
      kind: 'teacher-guide',
    }),
    '/api/library/material-preview?unitCode=8.1&assessmentId=81-6-soccer-assessment&kind=teacher-guide',
  )
})

test('should mark handout and teacher guide as Drive document preview kinds', () => {
  assert.equal(isDriveDocumentPreviewKind('teacher-guide'), true)
  assert.equal(isDriveDocumentPreviewKind('student-handout'), true)
  assert.equal(isDriveDocumentPreviewKind('google-form'), false)
  assert.equal(isDriveDocumentPreviewKind('guidance-sheet'), false)
})
