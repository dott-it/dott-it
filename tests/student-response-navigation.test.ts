import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  buildStudentDetailUrl,
  getAdjacentStudentRecordId,
  getStudentNavigationState,
  isAssessmentRecordMismatch,
  isStudentPageLoadError,
  resolveMismatchedRecordRedirect,
} from '../app/lib/assessment/student-response-navigation.ts'

test('should prefer record.assessmentId over a stale route prop', () => {
  const url = buildStudentDetailUrl(
    { id: 'record-b', assessmentId: 'assessment-b' },
    'assessment-a-stale',
  )
  assert.equal(url, '/workspace/assessments/assessment-b/record-b')
})

test('should fall back to route assessmentId when record omits it', () => {
  const url = buildStudentDetailUrl(
    { id: 'record-1', assessmentId: '' },
    'assessment-route',
  )
  assert.equal(url, '/workspace/assessments/assessment-route/record-1')
})

test('should return null when neither record nor route has an assessment id', () => {
  assert.equal(
    buildStudentDetailUrl({ id: 'record-1', assessmentId: '' }, undefined),
    null,
  )
})

test('should never treat the record id as an assessment id', () => {
  const url = buildStudentDetailUrl(
    { id: 'record-only', assessmentId: 'assessment-ok' },
    undefined,
  )
  assert.equal(url, '/workspace/assessments/assessment-ok/record-only')
  assert.ok(!url?.startsWith('/workspace/assessments/record-only'))
})

test('should preserve list filters on the detail url', () => {
  const url = buildStudentDetailUrl(
    { id: 'record-1', assessmentId: 'assessment-1' },
    'assessment-1',
    {
      statusFilter: 'ready_for_review',
      classFilter: 'Period 2',
      searchTerm: 'Jamie',
      sortColumn: 'name',
      sortDirection: 'desc',
    },
  )
  assert.equal(
    url,
    '/workspace/assessments/assessment-1/record-1?status=ready_for_review&class=Period+2&search=Jamie&sortColumn=name&sortDirection=desc',
  )
})

test('should detect URL assessment vs record assessment mismatch', () => {
  assert.equal(isAssessmentRecordMismatch('assessment-a', 'assessment-b'), true)
  assert.equal(isAssessmentRecordMismatch('assessment-a', 'assessment-a'), false)
  assert.equal(isAssessmentRecordMismatch('assessment-a', null), false)
  assert.equal(isAssessmentRecordMismatch('assessment-a', undefined), false)
})

test('should keep list filters when redirecting a record to its assessment', () => {
  const url = resolveMismatchedRecordRedirect({
    routeAssessmentId: 'assessment-a',
    routeStudentEntryId: 'record-b',
    record: { id: 'record-b', assessmentId: 'assessment-b' },
    filters: {
      statusFilter: 'ready_for_review',
      classFilter: 'Period 2',
      searchTerm: 'Jamie',
      sortColumn: 'name',
      sortDirection: 'desc',
    },
  })
  assert.equal(
    url,
    '/workspace/assessments/assessment-b/record-b?status=ready_for_review&class=Period+2&search=Jamie&sortColumn=name&sortDirection=desc',
  )
})

test('should not redirect a cached record that is not the student in the URL', () => {
  assert.equal(
    resolveMismatchedRecordRedirect({
      routeAssessmentId: 'assessment-a',
      routeStudentEntryId: 'record-b',
      record: { id: 'record-other', assessmentId: 'assessment-c' },
    }),
    null,
  )
})

test('should not redirect when the record already belongs to the route assessment', () => {
  assert.equal(
    resolveMismatchedRecordRedirect({
      routeAssessmentId: 'assessment-a',
      routeStudentEntryId: 'record-a',
      record: { id: 'record-a', assessmentId: 'assessment-a' },
    }),
    null,
  )
})

test('should not treat a failed assessment fetch as final while redirecting', () => {
  assert.equal(
    isStudentPageLoadError({
      assessmentFailed: true,
      recordFailed: false,
      redirectingToOwningAssessment: true,
    }),
    false,
  )
  assert.equal(
    isStudentPageLoadError({
      assessmentFailed: true,
      recordFailed: false,
      redirectingToOwningAssessment: false,
    }),
    true,
  )
  assert.equal(
    isStudentPageLoadError({
      assessmentFailed: true,
      recordFailed: true,
      redirectingToOwningAssessment: true,
    }),
    true,
  )
})

test('should disable next and previous when current student is outside the filter', () => {
  const state = getStudentNavigationState(['r1', 'r2', 'r3'], 'not-in-list')
  assert.deepEqual(state, {
    isFirst: true,
    isLast: true,
    currentPosition: 0,
    totalCount: 3,
  })
  assert.equal(getAdjacentStudentRecordId(['r1', 'r2', 'r3'], 'not-in-list', 'next'), null)
  assert.equal(getAdjacentStudentRecordId(['r1', 'r2', 'r3'], 'not-in-list', 'previous'), null)
})

test('should navigate to adjacent ids only when current is in the list', () => {
  const ids = ['r1', 'r2', 'r3']
  assert.equal(getAdjacentStudentRecordId(ids, 'r2', 'previous'), 'r1')
  assert.equal(getAdjacentStudentRecordId(ids, 'r2', 'next'), 'r3')
  assert.equal(getAdjacentStudentRecordId(ids, 'r1', 'previous'), null)
  assert.equal(getAdjacentStudentRecordId(ids, 'r3', 'next'), null)

  const mid = getStudentNavigationState(ids, 'r2')
  assert.deepEqual(mid, {
    isFirst: false,
    isLast: false,
    currentPosition: 2,
    totalCount: 3,
  })
})
