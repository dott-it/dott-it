import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildPlannerHome,
  getMonthRange,
  getWeekRange,
  mapAssessmentToPlannerEvent,
  pendingFeedbackCount,
  resolveAssessmentEventDate,
  softClassKeysForAssessment,
  type PlannerAssessmentInput,
} from '../lib/planner/build-planner-home.ts'

function assessment(
  partial: Partial<PlannerAssessmentInput> & Pick<PlannerAssessmentInput, 'id' | 'title'>,
): PlannerAssessmentInput {
  return {
    dueAt: '2026-11-05T17:00:00.000Z',
    assignedAt: '2026-11-01T12:00:00.000Z',
    className: '—',
    classSections: ['Period 3 — Physical Science'],
    unitCode: '8.1',
    grade: 8,
    lessonNumber: 4,
    pendingRecords: 0,
    ...partial,
  }
}

describe('build-planner-home', () => {
  it('prefers dueAt over assignedAt for the event date', () => {
    const date = resolveAssessmentEventDate(
      assessment({
        id: 'a1',
        title: 'Exit ticket',
        dueAt: '2026-11-06T12:00:00.000Z',
        assignedAt: '2026-11-01T12:00:00.000Z',
      }),
    )
    assert.ok(date)
    assert.equal(date.toISOString(), '2026-11-06T12:00:00.000Z')
  })

  it('falls back to assignedAt when due date is missing', () => {
    const date = resolveAssessmentEventDate(
      assessment({
        id: 'a1',
        title: 'Exit ticket',
        dueAt: null,
        dueDate: null,
        assignedAt: '2026-11-02T08:00:00.000Z',
      }),
    )
    assert.ok(date)
    assert.equal(date.toISOString(), '2026-11-02T08:00:00.000Z')
  })

  it('builds soft class keys from classSections and className', () => {
    assert.deepEqual(
      softClassKeysForAssessment(
        assessment({
          id: 'a1',
          title: 'Exit ticket',
          className: 'Hour 2',
          classSections: ['Period 3 — Physical Science', ''],
        }),
      ),
      ['Hour 2', 'Period 3 — Physical Science'],
    )
  })

  it('uses the larger of pendingRecords and readyForReview', () => {
    assert.equal(
      pendingFeedbackCount(
        assessment({
          id: 'a1',
          title: 'Exit ticket',
          pendingRecords: 2,
          submissionStatus: { readyForReview: 5 },
        }),
      ),
      5,
    )
  })

  it('filters week events and feedback queue by soft class', () => {
    const anchor = new Date(2026, 10, 5) // Nov 5 2026 local
    const week = getWeekRange(anchor)

    const rows = [
      assessment({
        id: 'keep',
        title: 'Forces check',
        dueAt: new Date(week.start.getFullYear(), week.start.getMonth(), week.start.getDate() + 2, 15),
        classSections: ['Period 3 — Physical Science'],
        pendingRecords: 3,
      }),
      assessment({
        id: 'other-class',
        title: 'Other period',
        dueAt: new Date(week.start.getFullYear(), week.start.getMonth(), week.start.getDate() + 3, 15),
        classSections: ['Period 1'],
        className: 'Period 1',
        pendingRecords: 4,
      }),
      assessment({
        id: 'outside-week',
        title: 'Next month',
        dueAt: new Date(2026, 11, 1, 12),
        classSections: ['Period 3 — Physical Science'],
        pendingRecords: 1,
      }),
    ]

    const model = buildPlannerHome({
      assessments: rows,
      period: 'week',
      anchor,
      classKey: 'Period 3 — Physical Science',
    })

    assert.deepEqual(
      model.eventsInRange.map((e) => e.id),
      ['keep'],
    )
    // Feedback queue is work remaining across the year, still class-filtered.
    assert.deepEqual(
      model.feedbackQueue.map((item) => item.id),
      ['keep', 'outside-week'],
    )
    assert.equal(model.activeUnitCode, '8.1')
    assert.ok(model.softClasses.some((c) => c.key === 'Period 3 — Physical Science'))
  })

  it('maps assessments without a date to null events', () => {
    assert.equal(
      mapAssessmentToPlannerEvent(
        assessment({
          id: 'nodate',
          title: 'Draft',
          dueAt: null,
          dueDate: null,
          assignedAt: null,
          startDate: null,
        }),
      ),
      null,
    )
  })

  it('builds a month range covering the full calendar month', () => {
    const { start, end } = getMonthRange(new Date(2026, 10, 15))
    assert.equal(start.getDate(), 1)
    assert.equal(start.getMonth(), 10)
    assert.equal(end.getMonth(), 10)
    assert.equal(end.getDate(), 30)
  })
})
