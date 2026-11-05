import assert from 'node:assert/strict'
import { test } from 'node:test'
import { findIngestedAssessment } from '../lib/library/ingest/load-manifest.ts'
import {
  getAvailablePackageItems,
  getBulkExportPackageItems,
  getDisplayPackageItems,
  getPackageItem,
  isBulkExportReady,
  isExportReady,
  materialContextFromIngested,
  shouldShowOpportunityMaterials,
} from '../lib/library/materials/index.ts'

test('should build Soccer Assessment materials with handout, form, and key', () => {
  const row = findIngestedAssessment('8.1', '81-6-soccer-assessment')
  assert.ok(row)

  const context = materialContextFromIngested(row)
  assert.equal(isExportReady(context), true)
  assert.equal(isBulkExportReady(context), true)

  const handout = getPackageItem(context, 'student-handout')
  const form = getPackageItem(context, 'google-form')
  const key = getPackageItem(context, 'answer-key')

  assert.ok(handout?.available)
  assert.match(handout.fileName ?? '', /Soccer Assessment/i)
  assert.ok(form?.available)
  assert.match(form.url ?? '', /^https:\/\//)
  // Open uses forms@ teacher-ready; modal iframe uses Shared Drive (Google blocks File upload embeds).
  assert.equal(form.url, row.files.googleFormTeacherReady)
  assert.equal(form.embedUrl, row.files.googleForm)
  assert.notEqual(form.url, form.embedUrl)
  assert.ok(key?.available)

  const displayItems = getDisplayPackageItems(context)
  assert.ok(displayItems.some((item) => item.kind === 'student-handout'))
  assert.ok(displayItems.some((item) => item.kind === 'google-form'))
  assert.equal(getAvailablePackageItems(context).length, 4)
  assert.equal(
    getBulkExportPackageItems(context).some((item) => item.kind === 'google-form'),
    false,
  )
  assert.ok(getBulkExportPackageItems(context).length >= 3)
})

test('should not show opportunity materials without a linked handout', () => {
  const row = findIngestedAssessment('8.1', '81-6-ao-2')
  assert.ok(row)

  const context = materialContextFromIngested(row)
  assert.equal(shouldShowOpportunityMaterials(context), false)
})

test('should show opportunity materials when a handout is linked', () => {
  const row = findIngestedAssessment('8.1', '81-6-ao-1')
  assert.ok(row)

  const context = materialContextFromIngested(row)
  assert.equal(shouldShowOpportunityMaterials(context), true)
  assert.ok(getPackageItem(context, 'student-handout')?.available)
})
