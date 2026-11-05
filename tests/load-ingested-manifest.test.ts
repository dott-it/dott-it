import assert from 'node:assert/strict'
import { test } from 'node:test'
import { hasIngestedManifest, listIngestedUnitCodes, loadIngestedManifest } from '../lib/library/ingest/load-manifest.ts'

test('should load ingested manifest for unit 8.1', () => {
  assert.equal(hasIngestedManifest('8.1'), true)
  const manifest = loadIngestedManifest('8.1')
  assert.ok(manifest)
  assert.equal(manifest.unitId, '8.1')
  assert.equal(manifest.lessonCount, 16)
  assert.ok(manifest.assessments.length > 0)
})

test('should list ingested unit codes including 8.1, 7.1', () => {
  const codes = listIngestedUnitCodes()
  assert.ok(codes.includes('8.1'))
  assert.ok(codes.includes('7.1'))
})

test('should return null for units without ingested manifest', () => {
  assert.equal(loadIngestedManifest('99.9'), null)
})
