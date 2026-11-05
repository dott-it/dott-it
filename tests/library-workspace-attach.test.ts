import assert from 'node:assert/strict'
import { test } from 'node:test'
import { findIngestedAssessment } from '../lib/library/ingest/load-manifest.ts'
import {
  buildLibraryWorkspaceAttachPayload,
  countGoogleFormQuestionItems,
  gradeFromUnitCode,
  LibraryWorkspaceAttachError,
  parseGoogleFormId,
} from '../lib/library/workspace/index.ts'

const PUBLISHED_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLScugdqNekHK_7a9AB84eFGp2kSkUVNsdOI-w1-2ZzBnXhgk5Q/viewform'

test('should reject published /d/e/ responder URLs as Forms API formId', () => {
  assert.equal(parseGoogleFormId(PUBLISHED_FORM_URL), null)
})

test('should parse google form id from edit URL', () => {
  assert.equal(
    parseGoogleFormId('https://docs.google.com/forms/d/1abc123XYZ/edit'),
    '1abc123XYZ',
  )
})

test('should parse google form id from formId viewform URL', () => {
  assert.equal(
    parseGoogleFormId('https://docs.google.com/forms/d/1abc123XYZ/viewform'),
    '1abc123XYZ',
  )
})

test('should derive grade from unit code', () => {
  assert.equal(gradeFromUnitCode('8.1'), '8')
  assert.equal(gradeFromUnitCode('7.6'), '7')
})

test('should count only questionItem entries from Forms API items', () => {
  assert.equal(
    countGoogleFormQuestionItems([
      { questionItem: { question: { required: true } } },
      { questionItem: { question: { required: false } } },
      {},
      { questionItem: null },
    ]),
    2,
  )
  assert.equal(countGoogleFormQuestionItems([]), 0)
  assert.equal(countGoogleFormQuestionItems(undefined), 0)
})

test('should build workspace attach payload when Form URL embeds Forms API formId', () => {
  const row = findIngestedAssessment('8.1', '81-6-soccer-assessment')
  assert.ok(row)

  const withFormIdUrl = {
    ...row,
    files: {
      ...row.files,
      googleForm: 'https://docs.google.com/forms/d/1SoccerFormIdABC123/viewform',
    },
  }

  const payload = buildLibraryWorkspaceAttachPayload({
    unitCode: '8.1',
    assessmentId: row.id,
    ingestedRow: withFormIdUrl,
    numberOfQuestions: 7,
  })

  assert.equal(payload.title, 'Soccer Assessment')
  assert.equal(payload.unitCode, '8.1')
  assert.equal(payload.gradeLevel, '8')
  assert.equal(payload.googleFormId, '1SoccerFormIdABC123')
  assert.equal(payload.numberOfQuestions, 7)
  assert.match(payload.submissionUrl, /^https:\/\//)
})

test('should reject invalid question counts', () => {
  const row = findIngestedAssessment('8.1', '81-6-soccer-assessment')
  assert.ok(row)

  const withFormIdUrl = {
    ...row,
    files: {
      ...row.files,
      googleForm: 'https://docs.google.com/forms/d/1SoccerFormIdABC123/viewform',
    },
  }

  assert.throws(
    () =>
      buildLibraryWorkspaceAttachPayload({
        unitCode: '8.1',
        assessmentId: row.id,
        ingestedRow: withFormIdUrl,
        numberOfQuestions: 0,
      }),
    (error: unknown) =>
      error instanceof LibraryWorkspaceAttachError && error.code === 'INVALID_QUESTION_COUNT',
  )
})

test('should reject published-only Form URLs as not workspace-eligible', () => {
  const row = findIngestedAssessment('8.1', '81-6-soccer-assessment')
  assert.ok(row)

  assert.throws(
    () =>
      buildLibraryWorkspaceAttachPayload({
        unitCode: '8.1',
        assessmentId: row.id,
        ingestedRow: {
          ...row,
          files: {
            ...row.files,
            googleForm: PUBLISHED_FORM_URL,
          },
        },
        numberOfQuestions: 3,
      }),
    (error: unknown) =>
      error instanceof LibraryWorkspaceAttachError && error.code === 'NOT_ELIGIBLE',
  )
})

test('should reject Baseball with published /d/e/ Form URL as not workspace-eligible', () => {
  const row = findIngestedAssessment('8.1', '81-10-baseball-assessment-1')
  assert.ok(row)

  assert.throws(
    () =>
      buildLibraryWorkspaceAttachPayload({
        unitCode: '8.1',
        assessmentId: row.id,
        ingestedRow: {
          ...row,
          files: {
            ...row.files,
            googleForm: PUBLISHED_FORM_URL,
          },
        },
        numberOfQuestions: 3,
      }),
    (error: unknown) =>
      error instanceof LibraryWorkspaceAttachError && error.code === 'NOT_ELIGIBLE',
  )
})
