import type { AssessmentRecord, FeedbackSection } from '@/types'
import { studentAnswersChronological } from '@/app/lib/assessment/chronological-student-answers'
import { feedbackSectionsForStudentAttempt } from '@/app/lib/assessment/feedback-for-student-attempt'

/** One row per student submission (chronological), same shape PastAttemptsSection expects. */
export type PastAttemptDisplayRow = {
  attemptNumber: number
  dateLabel: Date
  count: number
  feedbackSections: FeedbackSection[]
}

const MAX_PAST_ATTEMPT_ROWS = 5

/**
 * Past attempts = student submissions except the most recent (that one stays in the main column only).
 * Oldest → newest among those, windowed to the last {@link MAX_PAST_ATTEMPT_ROWS} prior submissions.
 * Feedback shown is everything tied to that submission (teacher + AI buckets).
 */
export function getPastAttemptsDisplayList(record: AssessmentRecord): PastAttemptDisplayRow[] {
  const chronological = studentAnswersChronological(record)
  if (chronological.length <= 1) return []

  const pastOnly = chronological.slice(0, -1)
  const start = Math.max(0, pastOnly.length - MAX_PAST_ATTEMPT_ROWS)
  const windowed = pastOnly.slice(start)

  return windowed.map((sa, i) => {
    const sections = feedbackSectionsForStudentAttempt(sa, record)
    return {
      attemptNumber: start + i + 1,
      dateLabel: new Date(sa.createdAt),
      count: sections.length,
      feedbackSections: sections,
    }
  })
}
