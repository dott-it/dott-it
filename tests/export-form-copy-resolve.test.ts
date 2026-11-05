import assert from 'node:assert/strict'
import { test } from 'node:test'
import { findIngestedAssessment } from '../lib/library/ingest/load-manifest.ts'
import {
  resolveCurriculumGoogleFormId,
  resolveTeacherReadyGoogleFormId,
} from '../lib/library/export/create-form-in-folder.ts'
import { parseGoogleFormId, distinctTeacherReadyFormId } from '../lib/library/workspace/parse-google-form.ts'

test('should resolve preview googleForm id from ingest', () => {
  const formId = resolveCurriculumGoogleFormId('8.1', '81-10-baseball-assessment-1')
  const row = findIngestedAssessment('8.1', '81-10-baseball-assessment-1')
  assert.ok(row?.files.googleForm)
  const expected = parseGoogleFormId(row.files.googleForm)
  assert.equal(formId, expected)
})

test('should resolve teacher-ready id when googleFormTeacherReady is set', () => {
  const ready = resolveTeacherReadyGoogleFormId('8.1', '81-10-baseball-assessment-1')
  const row = findIngestedAssessment('8.1', '81-10-baseball-assessment-1')
  assert.ok(ready)
  assert.equal(ready, parseGoogleFormId(row?.files.googleFormTeacherReady ?? ''))
  assert.notEqual(ready, parseGoogleFormId(row?.files.googleForm ?? ''))
})

test('should ignore teacher-ready URL that is the same Form as the preview', () => {
  const same = 'https://docs.google.com/forms/d/1QML1FQHFrLeuchHIeUS9kT402Yr1z51YaHq7nebcAEY/viewform'
  assert.equal(distinctTeacherReadyFormId(same, same), null)
  assert.equal(
    distinctTeacherReadyFormId(
      'https://docs.google.com/forms/d/1fJGljBvSwuTbl4dzTiauzbaKN76IUpuLmzdHpsg-X1Y/viewform',
      'https://docs.google.com/forms/d/1hKoV04JbO1wXOKTFBgGiY7RsOf6BJlhzbLyNtc3TzBg/viewform',
    ),
    '1fJGljBvSwuTbl4dzTiauzbaKN76IUpuLmzdHpsg-X1Y',
  )
})

test('should return null when the assessment has no digitized googleForm yet', () => {
  const formId = resolveCurriculumGoogleFormId('8.1', '81-1-ao-1')
  const row = findIngestedAssessment('8.1', '81-1-ao-1')
  assert.ok(row)
  assert.equal(row.files.googleForm, null)
  assert.equal(formId, null)
  assert.equal(resolveTeacherReadyGoogleFormId('8.1', '81-1-ao-1'), null)
})
