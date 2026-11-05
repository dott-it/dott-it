import type { AssessmentRecord, Feedback, StudentAnswer } from '@/app/types'
import { buildAttemptPreviewCards, getAttemptHistoryPreviewBadgeCount } from '../build-attempt-preview-cards'

function sa(id: string, createdAt: string): StudentAnswer {
  return {
    id,
    createdAt,
    answers: [{ title: 'Q1', value: 'A' }],
    aiSuggestions: [],
  } as unknown as StudentAnswer
}

function completedFeedback(completedAt: string): Feedback {
  return {
    id: `fb-${completedAt}`,
    status: 'completed',
    completedAt,
    updatedAt: completedAt,
    feedbackSections: [{ id: 's1', type: 'strength', section: 's', content: 'ok', order: 1 }],
  } as unknown as Feedback
}

describe('buildAttemptPreviewCards', () => {
  it('should append a pending-review card when the latest submission is after the last completed feedback', () => {
    const record = {
      studentAnswers: [
        sa('first', '2025-01-01T12:00:00Z'),
        sa('second', '2025-01-10T12:00:00Z'),
      ],
      feedbacks: [completedFeedback('2025-01-05T12:00:00Z')],
    } as AssessmentRecord

    const cards = buildAttemptPreviewCards(record)
    const pending = cards.find((c) => c.isPendingReview)
    expect(pending?.studentAnswerId).toBe('second')
    expect(getAttemptHistoryPreviewBadgeCount(record)).toBe(cards.length)
  })
})
