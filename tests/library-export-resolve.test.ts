import assert from 'node:assert/strict'
import { test } from 'node:test'
import { loadDriveIndex } from '../lib/library/drive-index/load-drive-index.ts'
import { resolveExportTargets } from '../lib/library/export/resolve-export-targets.ts'

test('should resolve Soccer Assessment drive copies and generate Form target', () => {
  const driveIndex = loadDriveIndex('8.1')
  assert.ok(driveIndex)

  const { driveCopies, externalLinks, formsToGenerate } = resolveExportTargets({
    unitCode: '8.1',
    assessmentId: '81-6-soccer-assessment',
    kinds: ['student-handout', 'answer-key', 'teacher-guide', 'google-form'],
    driveIndex,
  })

  assert.equal(driveCopies.length, 3)
  assert.equal(externalLinks.length, 0)
  assert.equal(formsToGenerate.length, 1)
  assert.ok(driveCopies.some((row) => row.kind === 'student-handout'))
  assert.equal(formsToGenerate[0]?.kind, 'google-form')
  assert.match(formsToGenerate[0]?.assessmentTitle ?? '', /Soccer/i)
})

test('should resolve Baseball Assessment google-form export target when Form URL exists', () => {
  const driveIndex = loadDriveIndex('8.1')
  assert.ok(driveIndex)

  const { driveCopies, externalLinks, formsToGenerate } = resolveExportTargets({
    unitCode: '8.1',
    assessmentId: '81-10-baseball-assessment-1',
    kinds: ['student-handout', 'google-form'],
    driveIndex,
  })

  assert.equal(driveCopies.length, 1)
  assert.equal(externalLinks.length, 0)
  assert.equal(formsToGenerate.length, 1)
  assert.equal(formsToGenerate[0]?.assessmentTitle, 'Baseball Assessment 1')
})

test('should reject unavailable material kinds', () => {
  const driveIndex = loadDriveIndex('8.1')
  assert.ok(driveIndex)

  assert.throws(
    () =>
      resolveExportTargets({
        unitCode: '8.1',
        assessmentId: '81-6-ao-2',
        kinds: ['student-handout'],
        driveIndex,
      }),
    /not available/i,
  )
})
