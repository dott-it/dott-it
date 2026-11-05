import type { AssessmentRecord, Feedback, FeedbackSection, StudentAnswer } from '@/app/types'
import { getPastAttemptsDisplayList } from '../past-attempts'

function sa(id: string, createdAt: string): StudentAnswer {
  return {
    id,
    assessmentRecordId: 'r1',
    createdAt,
    updatedAt: createdAt,
    answers: [{ title: 'Q1', value: 'A', questionId: 'q1' }],
    aiSuggestions: [],
  } as StudentAnswer
}

function completedFeedback(completedAt: string): Feedback {
  return {
    id: `fb-${completedAt}`,
    assessmentRecordId: 'r1',
    status: 'completed',
    completedAt,
    updatedAt: completedAt,
    createdAt: completedAt,
    feedbackSections: [{ type: 'strength', section: 's', content: 'ok', discarted: false, used: true } as FeedbackSection],
  } as unknown as Feedback
}

describe('getPastAttemptsDisplayList', () => {
  it('excludes the latest submission; one row per older attempt', () => {
    const record = {
      studentAnswers: [
        sa('a1', '2025-04-29T18:00:00Z'),
        sa('a2', '2025-04-29T18:16:00Z'),
      ],
      feedbacks: [
        completedFeedback('2025-04-29T18:05:00Z'),
        completedFeedback('2025-04-29T18:10:00Z'),
        completedFeedback('2025-04-29T18:20:00Z'),
      ],
    } as AssessmentRecord

    const rows = getPastAttemptsDisplayList(record)
    expect(rows).toHaveLength(1)
    expect(rows[0]!.attemptNumber).toBe(1)
    expect(rows[0]!.dateLabel.toISOString()).toContain('18:00:00')
  })

  it('returns empty when there is only one submission', () => {
    const record = {
      studentAnswers: [sa('a1', '2025-04-29T18:00:00Z')],
      feedbacks: [],
    } as AssessmentRecord
    expect(getPastAttemptsDisplayList(record)).toHaveLength(0)
  })

  it('keeps at most the last 5 prior submissions (never includes the current attempt)', () => {
    const answers = Array.from({ length: 7 }, (_, i) =>
      sa(`id-${i}`, new Date(Date.UTC(2025, 0, 1, 12, i, 0)).toISOString()),
    )
    const record = { studentAnswers: answers, feedbacks: [] } as AssessmentRecord
    const rows = getPastAttemptsDisplayList(record)
    expect(rows).toHaveLength(5)
    expect(rows[0]!.attemptNumber).toBe(2)
    expect(rows[4]!.attemptNumber).toBe(6)
  })
})
