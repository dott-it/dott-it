import assert from 'node:assert/strict'
import { test } from 'node:test'
import { distinctTeacherReadyFormId } from '../lib/library/workspace/parse-google-form.ts'
import { findIngestedAssessment } from '../lib/library/ingest/load-manifest.ts'
import {
  resolveUnitExportTargets,
  summarizeUnitExport,
} from '../lib/library/export/resolve-unit-export-targets.ts'

test('should resolve exportable unit assessments for Unit 8.1', () => {
  const summary = summarizeUnitExport('8.1')

  assert.equal(summary.ready, true)
  assert.ok(summary.assessmentCount > 0)
  assert.ok(summary.materialCount > summary.assessmentCount)

  const { assessments, materialCount } = resolveUnitExportTargets('8.1')
  assert.equal(assessments.length, summary.assessmentCount)
  assert.equal(materialCount, summary.materialCount)
  assert.ok(assessments.some((row) => row.assessmentId === '81-6-soccer-assessment'))
  assert.ok(
    assessments.every(
      (row) =>
        row.driveCopies.length > 0 ||
        row.externalLinks.length > 0 ||
        row.formsToGenerate.length > 0,
    ),
  )
  assert.ok(
    assessments.every((row) =>
      row.driveCopies.every((copy) => copy.kind !== 'guidance-sheet'),
    ),
  )
})

test('should only queue teacher-ready Forms on unit export (no generate-on-export)', () => {
  const { assessments } = resolveUnitExportTargets('8.1')

  for (const row of assessments) {
    if (row.formsToGenerate.length === 0) {
      continue
    }
    const ingested = findIngestedAssessment('8.1', row.assessmentId)
    assert.ok(ingested)
    assert.ok(
      distinctTeacherReadyFormId(
        ingested.files.googleFormTeacherReady,
        ingested.files.googleForm,
      ),
      `unit export Form for ${row.assessmentId} must be teacher-ready`,
    )
  }

  // Export-only opportunity with handout but no live Form must not appear as formsToGenerate.
  const exportOnly = assessments.find((row) => row.assessmentId === '81-9-ao-3')
  assert.equal(exportOnly?.formsToGenerate.length ?? 0, 0)
})

test('should report unit export as not ready without drive index', () => {
  const summary = summarizeUnitExport('99.9')
  assert.equal(summary.ready, false)
  assert.equal(summary.assessmentCount, 0)
  assert.equal(summary.materialCount, 0)
})
