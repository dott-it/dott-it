import assert from 'node:assert/strict'
import { test } from 'node:test'
import { findIngestedAssessment } from '../lib/library/ingest/load-manifest.ts'
import {
  getPackageItem,
  hasLiveGoogleFormUrl,
  isGoogleFormExportOnly,
  materialContextFromIngested,
  packageItemAllowsQuickLook,
  packageItemAvailability,
  packageItemStatusLabel,
} from '../lib/library/materials/index.ts'

test('should mark google-form export-only when handout exists without Form URL', () => {
  const row = findIngestedAssessment('8.1', '81-6-ao-1')
  assert.ok(row)
  assert.equal(row.files.googleForm, null)
  assert.ok(row.files.studentHandout)

  const context = materialContextFromIngested(row)
  const form = getPackageItem(context, 'google-form')
  assert.ok(form?.available)
  assert.equal(form.url ?? null, null)
  assert.equal(isGoogleFormExportOnly(form), true)
  assert.equal(hasLiveGoogleFormUrl(form), false)
  assert.equal(packageItemAvailability(form), 'planned')
  assert.equal(packageItemStatusLabel(form), 'Not digitized yet — teacher-ready Form required for Drive export')
  assert.equal(packageItemAllowsQuickLook(form), false)
  assert.equal(packageItemAllowsQuickLook(form, 'some excerpt'), false)
})

test('should allow Quick look for live google-form URLs', () => {
  const row = findIngestedAssessment('8.1', '81-6-soccer-assessment')
  assert.ok(row)

  const context = materialContextFromIngested(row)
  const form = getPackageItem(context, 'google-form')
  assert.ok(form?.available)
  assert.equal(isGoogleFormExportOnly(form), false)
  assert.equal(hasLiveGoogleFormUrl(form), true)
  assert.equal(packageItemAvailability(form), 'available')
  assert.equal(
    packageItemStatusLabel(form),
    'Digitized — add an editable copy to your Google Forms',
  )
  assert.equal(packageItemAllowsQuickLook(form), true)
})

test('should keep google-form unavailable for TE opportunity without handout', () => {
  const row = findIngestedAssessment('8.1', '81-6-ao-2')
  assert.ok(row)

  const context = materialContextFromIngested(row)
  const form = getPackageItem(context, 'google-form')
  assert.equal(form?.available, false)
  assert.equal(isGoogleFormExportOnly(form!), false)
  assert.equal(packageItemAllowsQuickLook(form!), false)
})
