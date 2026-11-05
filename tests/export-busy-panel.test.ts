import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  estimateExportProgressPercent,
  expectedUnitExportSeconds,
  formatExportElapsed,
} from '../app/lib/components/library/export-busy-panel.tsx'

test('should format elapsed export time as m:ss', () => {
  assert.equal(formatExportElapsed(0), '0:00')
  assert.equal(formatExportElapsed(75), '1:15')
})

test('should cap soft progress below 100% while waiting', () => {
  assert.equal(estimateExportProgressPercent(0, 100), 0)
  assert.ok(estimateExportProgressPercent(50, 100) > 0)
  assert.ok(estimateExportProgressPercent(50, 100) < 100)
  assert.equal(estimateExportProgressPercent(10_000, 100), 92)
})

test('should scale expected unit export duration with assessment count', () => {
  assert.equal(expectedUnitExportSeconds(1), 90)
  assert.equal(expectedUnitExportSeconds(8), 200)
})
