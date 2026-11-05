import assert from 'node:assert/strict'
import { test } from 'node:test'
import { findIngestedAssessment } from '../lib/library/ingest/load-manifest.ts'
import {
  hasPublishedFormWithoutWorkspaceFormId,
  isWorkspaceEligible,
  materialContextFromIngested,
} from '../lib/library/materials/index.ts'

const PUBLISHED_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLScugdqNekHK_7a9AB84eFGp2kSkUVNsdOI-w1-2ZzBnXhgk5Q/viewform'

test('should mark assessment as workspace-eligible with Forms API formId URL and answer key', () => {
  const row = findIngestedAssessment('8.1', '81-6-soccer-assessment')
  assert.ok(row)

  const context = materialContextFromIngested({
    ...row,
    files: {
      ...row.files,
      googleForm: 'https://docs.google.com/forms/d/1SoccerFormIdABC123/viewform',
    },
  })
  assert.equal(isWorkspaceEligible(context), true)
})

test('should mark Soccer eligible when ingest already has a Forms API formId URL', () => {
  const row = findIngestedAssessment('8.1', '81-6-soccer-assessment')
  assert.ok(row)
  assert.match(row.files.googleForm ?? '', /\/forms\/d\/(?!e\/)/)

  const context = materialContextFromIngested(row)
  assert.equal(isWorkspaceEligible(context), true)
})

test('should mark Baseball eligible when ingest already has a Forms API formId URL', () => {
  const row = findIngestedAssessment('8.1', '81-10-baseball-assessment-1')
  assert.ok(row)
  assert.match(row.files.googleForm ?? '', /\/forms\/d\/(?!e\/)/)

  const context = materialContextFromIngested(row)
  assert.equal(isWorkspaceEligible(context), true)
})

test('should not mark Soccer as workspace-eligible with published /d/e/ Form URL only', () => {
  const row = findIngestedAssessment('8.1', '81-6-soccer-assessment')
  assert.ok(row)

  const context = materialContextFromIngested({
    ...row,
    files: {
      ...row.files,
      googleForm: PUBLISHED_FORM_URL,
      googleFormTeacherReady: null,
    },
  })
  assert.ok(context.package.find((item) => item.kind === 'google-form')?.available)
  assert.equal(isWorkspaceEligible(context), false)
})

test('should not mark Baseball as workspace-eligible with published /d/e/ Form URL only', () => {
  const row = findIngestedAssessment('8.1', '81-10-baseball-assessment-1')
  assert.ok(row)

  const context = materialContextFromIngested({
    ...row,
    files: {
      ...row.files,
      googleForm: PUBLISHED_FORM_URL,
      googleFormTeacherReady: null,
    },
  })
  assert.ok(context.package.find((item) => item.kind === 'google-form')?.available)
  assert.equal(isWorkspaceEligible(context), false)
})

test('should not mark Baseball as workspace-eligible without a live Form URL', () => {
  const row = findIngestedAssessment('8.1', '81-10-baseball-assessment-1')
  assert.ok(row)

  const context = materialContextFromIngested({
    ...row,
    files: {
      ...row.files,
      googleForm: null,
      googleFormTeacherReady: null,
    },
  })
  assert.equal(isWorkspaceEligible(context), false)
})

test('should detect published /d/e/ Form URLs that are not Workspace-attachable', () => {
  const row = findIngestedAssessment('8.1', '81-6-soccer-assessment')
  assert.ok(row)

  const published = materialContextFromIngested({
    ...row,
    files: {
      ...row.files,
      googleForm: PUBLISHED_FORM_URL,
      googleFormTeacherReady: null,
    },
  })
  assert.equal(hasPublishedFormWithoutWorkspaceFormId(published), true)
  assert.equal(isWorkspaceEligible(published), false)

  const withFormId = materialContextFromIngested({
    ...row,
    files: {
      ...row.files,
      googleForm: 'https://docs.google.com/forms/d/1SoccerFormIdABC123/viewform',
      googleFormTeacherReady: null,
    },
  })
  assert.equal(hasPublishedFormWithoutWorkspaceFormId(withFormId), false)
})

test('should not mark TE opportunities as workspace-eligible', () => {
  const row = findIngestedAssessment('8.1', '81-6-ao-2')
  assert.ok(row)

  const context = materialContextFromIngested(row)
  assert.equal(isWorkspaceEligible(context), false)
})

test('should not mark assessments without scoring as workspace-eligible', () => {
  const row = findIngestedAssessment('8.1', '81-6-soccer-assessment')
  assert.ok(row)

  const context = materialContextFromIngested({
    ...row,
    files: {
      ...row.files,
      googleForm: 'https://docs.google.com/forms/d/1SoccerFormIdABC123/viewform',
      answerKey: null,
      rubric: null,
    },
  })
  assert.equal(isWorkspaceEligible(context), false)
})
