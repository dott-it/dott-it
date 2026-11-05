import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  libraryGoogleFormEmbedUrl,
  libraryGoogleFormUrl,
} from '../lib/library/materials/library-form-url.ts'

test('should prefer teacher-ready Form URL for Open', () => {
  const preview = 'https://docs.google.com/forms/d/previewId/viewform'
  const ready = 'https://docs.google.com/forms/d/readyId/viewform'
  assert.equal(
    libraryGoogleFormUrl({ googleForm: preview, googleFormTeacherReady: ready }),
    ready,
  )
})

test('should prefer Shared Drive Form URL for modal iframe embed', () => {
  const preview = 'https://docs.google.com/forms/d/previewId/viewform'
  const ready = 'https://docs.google.com/forms/d/readyId/viewform'
  assert.equal(
    libraryGoogleFormEmbedUrl({ googleForm: preview, googleFormTeacherReady: ready }),
    preview,
  )
})

test('should fall back to Shared Drive googleForm when teacher-ready is missing', () => {
  const preview = 'https://docs.google.com/forms/d/previewId/viewform'
  assert.equal(libraryGoogleFormUrl({ googleForm: preview }), preview)
  assert.equal(libraryGoogleFormUrl({ googleForm: null, googleFormTeacherReady: null }), null)
})
