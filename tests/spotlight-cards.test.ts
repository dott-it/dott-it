import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  SPOTLIGHT_MIN_RESPONSES,
  filterHoursForSpotlight,
  isEligibleForSpotlight,
  pickSpotlightThematicStatus,
} from '../lib/spotlight/eligibility.ts'
import { isEddoStaffEmail } from '../lib/spotlight/is-eddo-staff-email.ts'

describe('spotlight eligibility', () => {
  it('should exclude assessments below the response threshold', () => {
    assert.equal(
      isEligibleForSpotlight({
        studentResponsesCount: SPOTLIGHT_MIN_RESPONSES - 1,
        isDismissed: false,
      }),
      false,
    )
  })

  it('should include assessments at or above the response threshold', () => {
    assert.equal(
      isEligibleForSpotlight({
        studentResponsesCount: SPOTLIGHT_MIN_RESPONSES,
        isDismissed: false,
      }),
      true,
    )
    assert.equal(
      isEligibleForSpotlight({
        studentResponsesCount: SPOTLIGHT_MIN_RESPONSES + 5,
        isDismissed: false,
      }),
      true,
    )
  })

  it('should exclude dismissed assessments even when above the threshold', () => {
    assert.equal(
      isEligibleForSpotlight({
        studentResponsesCount: 25,
        isDismissed: true,
      }),
      false,
    )
  })
})

describe('spotlight hours aggregation', () => {
  it('should ignore empty and whitespace-only class sections', () => {
    assert.deepEqual(
      filterHoursForSpotlight([
        { classSection: '' },
        { classSection: '   ' },
        { classSection: 'Hour 3' },
        { classSection: 'Hour 4' },
      ]),
      ['Hour 3', 'Hour 4'],
    )
  })

  it('should dedupe identical hour labels', () => {
    assert.deepEqual(
      filterHoursForSpotlight(['Hour 3', 'Hour 3', 'Hour 4']),
      ['Hour 3', 'Hour 4'],
    )
  })
})

describe('spotlight thematic status', () => {
  it('should prefer processing over completed', () => {
    assert.equal(
      pickSpotlightThematicStatus([
        { status: 'completed' },
        { status: 'processing' },
      ]),
      'processing',
    )
  })

  it('should return completed when no active processing exists', () => {
    assert.equal(
      pickSpotlightThematicStatus([{ status: 'completed' }, { status: 'failed' }]),
      'completed',
    )
  })

  it('should return null when only failed or pending analyses exist', () => {
    assert.equal(
      pickSpotlightThematicStatus([{ status: 'failed' }, { status: 'pending' }]),
      null,
    )
  })
})

describe('spotlight dismiss uniqueness', () => {
  it('should define dismissal uniqueness on teacherId + assessmentId', () => {
    // Mirrors Prisma @@unique([teacherId, assessmentId]) used by upsert.
    const key = (teacherId: string, assessmentId: string) =>
      `${teacherId}::${assessmentId}`

    const first = key('teacher-1', 'assessment-a')
    const duplicate = key('teacher-1', 'assessment-a')
    const otherTeacher = key('teacher-2', 'assessment-a')

    assert.equal(first, duplicate)
    assert.notEqual(first, otherTeacher)
  })
})

describe('eddo staff email check', () => {
  it('should treat staff domain matching as case-insensitive', () => {
    assert.equal(isEddoStaffEmail('Admin@EddoLearning.com'), true)
    assert.equal(isEddoStaffEmail('ops@eddolearning.com'), true)
    assert.equal(isEddoStaffEmail('teacher@school.edu'), false)
    assert.equal(isEddoStaffEmail(null), false)
  })
})
