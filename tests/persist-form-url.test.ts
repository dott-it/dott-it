import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { persistGoogleFormTeacherReadyUrl, persistGoogleFormUrl } from '../lib/library/digitize/persist-form-url.ts'

test('should write googleForm URL onto the matching assessment only', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'eddo-ingest-'))
  const ingestedDir = path.join(root, 'data', 'ingested')
  mkdirSync(ingestedDir, { recursive: true })
  const manifestPath = path.join(ingestedDir, 'unit-8.1.json')

  writeFileSync(
    manifestPath,
    `${JSON.stringify(
      {
        unitId: '8.1',
        assessments: [
          {
            id: '81-10-baseball-assessment-1',
            title: 'Baseball Assessment 1',
            files: { googleForm: null, studentHandout: 'a.docx' },
          },
          {
            id: '81-10-baseball-assessment-2',
            title: 'Baseball Assessment 2',
            files: { googleForm: null, studentHandout: 'b.docx' },
          },
        ],
      },
      null,
      2,
    )}\n`,
  )

  const result = persistGoogleFormUrl({
    unitCode: '8.1',
    assessmentId: '81-10-baseball-assessment-1',
    formUrl: 'https://docs.google.com/forms/d/e/abc/viewform',
    repoRoot: root,
  })

  assert.equal(result.updated, true)
  assert.equal(result.previousUrl, null)

  const updated = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
    assessments: Array<{ id: string; files: { googleForm: string | null } }>
  }
  assert.equal(
    updated.assessments[0].files.googleForm,
    'https://docs.google.com/forms/d/e/abc/viewform',
  )
  assert.equal(updated.assessments[1].files.googleForm, null)
})

test('should write googleFormTeacherReady without changing preview googleForm', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'eddo-ingest-'))
  const ingestedDir = path.join(root, 'data', 'ingested')
  mkdirSync(ingestedDir, { recursive: true })
  const manifestPath = path.join(ingestedDir, 'unit-8.1.json')
  const preview = 'https://docs.google.com/forms/d/previewFormId/viewform'
  const ready = 'https://docs.google.com/forms/d/teacherReadyId/viewform'

  writeFileSync(
    manifestPath,
    `${JSON.stringify(
      {
        unitId: '8.1',
        assessments: [
          {
            id: '81-10-baseball-assessment-1',
            files: { googleForm: preview, googleFormTeacherReady: null },
          },
        ],
      },
      null,
      2,
    )}\n`,
  )

  const result = persistGoogleFormTeacherReadyUrl({
    unitCode: '8.1',
    assessmentId: '81-10-baseball-assessment-1',
    formUrl: ready,
    repoRoot: root,
  })

  assert.equal(result.updated, true)
  assert.equal(result.field, 'googleFormTeacherReady')

  const updated = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
    assessments: Array<{
      files: { googleForm: string | null; googleFormTeacherReady?: string | null }
    }>
  }
  assert.equal(updated.assessments[0].files.googleForm, preview)
  assert.equal(updated.assessments[0].files.googleFormTeacherReady, ready)
})

test('should clear googleFormTeacherReady when formUrl is null', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'eddo-ingest-'))
  const ingestedDir = path.join(root, 'data', 'ingested')
  mkdirSync(ingestedDir, { recursive: true })
  const manifestPath = path.join(ingestedDir, 'unit-8.1.json')
  const preview = 'https://docs.google.com/forms/d/previewFormId/viewform'
  const ready = 'https://docs.google.com/forms/d/teacherReadyId/viewform'

  writeFileSync(
    manifestPath,
    `${JSON.stringify(
      {
        unitId: '8.1',
        assessments: [
          {
            id: '81-6-soccer-assessment',
            files: { googleForm: preview, googleFormTeacherReady: ready },
          },
        ],
      },
      null,
      2,
    )}\n`,
  )

  const result = persistGoogleFormTeacherReadyUrl({
    unitCode: '8.1',
    assessmentId: '81-6-soccer-assessment',
    formUrl: null,
    repoRoot: root,
  })

  assert.equal(result.updated, true)
  assert.equal(result.previousUrl, ready)

  const updated = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
    assessments: Array<{
      files: { googleForm: string | null; googleFormTeacherReady?: string | null }
    }>
  }
  assert.equal(updated.assessments[0].files.googleForm, preview)
  assert.equal(updated.assessments[0].files.googleFormTeacherReady, null)
})

test('should no-op when the same Form URL is already stored', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'eddo-ingest-'))
  const ingestedDir = path.join(root, 'data', 'ingested')
  mkdirSync(ingestedDir, { recursive: true })
  const manifestPath = path.join(ingestedDir, 'unit-8.1.json')
  const url = 'https://docs.google.com/forms/d/e/same/viewform'

  writeFileSync(
    manifestPath,
    `${JSON.stringify(
      {
        unitId: '8.1',
        assessments: [
          {
            id: '81-10-baseball-assessment-1',
            files: { googleForm: url },
          },
        ],
      },
      null,
      2,
    )}\n`,
  )

  const result = persistGoogleFormUrl({
    unitCode: '8.1',
    assessmentId: '81-10-baseball-assessment-1',
    formUrl: url,
    repoRoot: root,
  })

  assert.equal(result.updated, false)
  assert.equal(result.previousUrl, url)
})
