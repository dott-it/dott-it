import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  assessmentDetailHref,
  assessmentDetailTabFromQuery,
  studentResponseBackHref,
} from '../app/lib/assessment/assessment-detail-tab.ts'

describe('assessment detail tab query', () => {
  it('should read students from the query and default to thematic analysis', () => {
    assert.equal(assessmentDetailTabFromQuery('students'), 'students')
    assert.equal(assessmentDetailTabFromQuery('thematic-analysis'), 'thematic-analysis')
    assert.equal(assessmentDetailTabFromQuery('unknown'), 'thematic-analysis')
    assert.equal(assessmentDetailTabFromQuery(null), 'thematic-analysis')
    assert.equal(assessmentDetailTabFromQuery(undefined), 'thematic-analysis')
  })

  it('should write the selected tab into the assessment URL', () => {
    assert.equal(
      assessmentDetailHref('assessment-1', 'students'),
      '/workspace/assessments/assessment-1?tab=students',
    )
    assert.equal(
      assessmentDetailHref('assessment-1', 'thematic-analysis', 'status=ready_for_review'),
      '/workspace/assessments/assessment-1?status=ready_for_review&tab=thematic-analysis',
    )
  })

  it('should send back from a student response to the student records tab only', () => {
    assert.equal(
      studentResponseBackHref('assessment-1'),
      '/workspace/assessments/assessment-1?tab=students',
    )
  })
})
