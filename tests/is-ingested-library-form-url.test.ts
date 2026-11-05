import assert from 'node:assert/strict'
import { test } from 'node:test'
import { findIngestedAssessment } from '../lib/library/ingest/load-manifest.ts'
import { isIngestedLibraryGoogleFormUrl } from '../lib/library/materials/is-ingested-library-form-url.ts'
import { parseGoogleFormId } from '../lib/library/workspace/parse-google-form.ts'

test('should accept Form URLs whose formId is on an ingested library assessment', () => {
  const row = findIngestedAssessment('8.1', '81-10-baseball-assessment-1')
  assert.ok(row?.files.googleForm)
  assert.equal(isIngestedLibraryGoogleFormUrl(row.files.googleForm), true)
})

test('should reject arbitrary Google Form URLs not in the ingest catalog', () => {
  assert.equal(
    isIngestedLibraryGoogleFormUrl('https://docs.google.com/forms/d/1NotInCatalogFormIdXYZ/viewform'),
    false,
  )
})

test('should reject published /d/e/ URLs that cannot map to a catalog formId', () => {
  assert.equal(parseGoogleFormId('https://docs.google.com/forms/d/e/1FAIpQLSx/viewform'), null)
  assert.equal(
    isIngestedLibraryGoogleFormUrl('https://docs.google.com/forms/d/e/1FAIpQLSx/viewform'),
    false,
  )
})
