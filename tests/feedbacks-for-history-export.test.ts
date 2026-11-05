import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Feedback } from '../app/types/api/feedback.api.ts'
import type { FeedbackSection } from '../app/types/api/feedback-section.ts'
import { feedbacksForHistoryExport } from '../app/lib/export/feedbacks-for-history-export.ts'

function section(overrides: Partial<FeedbackSection> = {}): FeedbackSection {
  return {
    type: 'strength',
    section: 'Claim',
    content: 'You stated a clear claim.',
    discarted: false,
    used: true,
    ...overrides,
  } as FeedbackSection
}

function feedback(overrides: Partial<Feedback> & Pick<Feedback, 'id' | 'status'>): Feedback {
  const now = new Date('2026-04-01T12:00:00Z')
  return {
    assessmentRecordId: 'record-1',
    createdAt: now,
    updatedAt: now,
    completedAt: overrides.status === 'completed' ? now : null,
    feedbackSections: [section()],
    ...overrides,
  } as Feedback
}

describe('feedbacks for history export', () => {
  it('should include pending teacher feedback on the first export', () => {
    const pending = feedback({
      id: 'pending-1',
      status: 'pending',
      feedbackSections: [section({ content: 'Draft strength' })],
    })

    const exported = feedbacksForHistoryExport([pending])
    assert.equal(exported.length, 1)
    assert.equal(exported[0]?.id, 'pending-1')
    assert.equal(exported[0]?.feedbackSections[0]?.content, 'Draft strength')
  })

  it('should keep completed feedback after a later export', () => {
    const completed = feedback({
      id: 'done-1',
      status: 'completed',
      feedbackSections: [section({ content: 'Shared strength' })],
    })

    const exported = feedbacksForHistoryExport([completed])
    assert.equal(exported.length, 1)
    assert.equal(exported[0]?.id, 'done-1')
  })

  it('should include both prior completed rows and the current pending draft', () => {
    const completed = feedback({
      id: 'done-1',
      status: 'completed',
      createdAt: new Date('2026-03-01T12:00:00Z'),
    })
    const pending = feedback({
      id: 'pending-1',
      status: 'pending',
      feedbackSections: [section({ type: 'suggestion', content: 'Add evidence' })],
    })

    const exported = feedbacksForHistoryExport([completed, pending])
    assert.deepEqual(
      exported.map((fb) => fb.id),
      ['done-1', 'pending-1'],
    )
  })

  it('should omit pending drafts that only have discarded sections', () => {
    const pending = feedback({
      id: 'pending-empty',
      status: 'pending',
      feedbackSections: [section({ discarted: true })],
    })

    assert.deepEqual(feedbacksForHistoryExport([pending]), [])
  })

  it('should drop discarded sections from completed feedback the same as from a pending draft', () => {
    const pending = feedback({
      id: 'same-1',
      status: 'pending',
      feedbackSections: [
        section({ content: 'Keep this', discarted: false }),
        section({ content: 'Hide this', discarted: true }),
      ],
    })
    const completed = feedback({
      id: 'same-1',
      status: 'completed',
      feedbackSections: [
        section({ content: 'Keep this', discarted: false }),
        section({ content: 'Hide this', discarted: true }),
      ],
    })

    const first = feedbacksForHistoryExport([pending])
    const second = feedbacksForHistoryExport([completed])
    assert.deepEqual(
      first[0]?.feedbackSections.map((s) => s.content),
      ['Keep this'],
    )
    assert.deepEqual(
      second[0]?.feedbackSections.map((s) => s.content),
      ['Keep this'],
    )
  })

  it('should omit completed feedback that only has discarded sections', () => {
    const completed = feedback({
      id: 'done-empty',
      status: 'completed',
      feedbackSections: [section({ discarted: true })],
    })

    assert.deepEqual(feedbacksForHistoryExport([completed]), [])
  })

  it('should skip extra pending rows that are not the canonical draft', () => {
    const stale = feedback({
      id: 'pending-old',
      status: 'pending',
      updatedAt: new Date('2026-03-01T12:00:00Z'),
      createdAt: new Date('2026-03-01T12:00:00Z'),
      feedbackSections: [section({ content: 'Stale draft' })],
    })
    const canonical = feedback({
      id: 'pending-new',
      status: 'pending',
      updatedAt: new Date('2026-04-01T12:00:00Z'),
      createdAt: new Date('2026-04-01T12:00:00Z'),
      feedbackSections: [section({ content: 'Canonical draft' })],
    })

    const exported = feedbacksForHistoryExport([stale, canonical])
    assert.deepEqual(
      exported.map((fb) => fb.id),
      ['pending-new'],
    )
  })

  it('should return an empty list when there is no feedback', () => {
    assert.deepEqual(feedbacksForHistoryExport(undefined), [])
    assert.deepEqual(feedbacksForHistoryExport([]), [])
  })
})
