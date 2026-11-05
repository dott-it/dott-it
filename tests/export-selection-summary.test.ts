import assert from 'node:assert/strict'
import { test } from 'node:test'
import { exportSelectionSummary } from '../lib/library/materials/export-selection-summary.ts'

test('should describe empty export selection', () => {
  assert.equal(
    exportSelectionSummary(0),
    'Select materials to export to your Google Drive.',
  )
})

test('should describe single and multiple export selections', () => {
  assert.equal(
    exportSelectionSummary(1),
    '1 material selected — copies will be placed in your Drive.',
  )
  assert.equal(
    exportSelectionSummary(4),
    '4 materials selected — copies will be placed in your Drive.',
  )
})
