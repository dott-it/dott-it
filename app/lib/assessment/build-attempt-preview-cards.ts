import type { AssessmentRecord, Answers, FeedbackSection, StudentAnswer } from '@/types'
import { filterAnswersForExport } from '@/app/lib/export/student-answer-filters'
import { studentAnswersChronological } from '@/app/lib/assessment/chronological-student-answers'
import { feedbackSectionsForStudentAttempt } from '@/app/lib/assessment/feedback-for-student-attempt'

export type AttemptPreviewCard = {
  studentAnswerId: string
  attemptNumber: number
  createdAt: Date
  answers: Answers[]
  feedbackSections: FeedbackSection[]
  /** Submission after the latest completed feedback export — not a shared round yet. */
  isPendingReview?: boolean
}

/**
 * One preview card per student submission, aligned with Past Attempts (submission-based).
 */
export function buildAttemptPreviewCards(record: AssessmentRecord): AttemptPreviewCard[] {
  const sortedAscending = studentAnswersChronological(record)

  let latestCompletedMs = 0
  for (const f of record.feedbacks ?? []) {
    if (f.status !== 'completed') continue
    const t = Math.max(
      new Date(f.completedAt ?? 0).getTime(),
      new Date(f.updatedAt ?? 0).getTime(),
    )
    if (t > latestCompletedMs) latestCompletedMs = t
  }

  return sortedAscending.map((sa: StudentAnswer, i: number) => {
    const submittedMs = new Date(sa.createdAt).getTime()
    const isLast = i === sortedAscending.length - 1
    const isPendingReview = isLast && sortedAscending.length > 0 && submittedMs > latestCompletedMs

    return {
      studentAnswerId: sa.id,
      attemptNumber: i + 1,
      createdAt: new Date(sa.createdAt),
      answers: filterAnswersForExport(sa.answers),
      feedbackSections: feedbackSectionsForStudentAttempt(sa, record),
      ...(isPendingReview ? { isPendingReview: true } : {}),
    }
  }).sort((a, b) => {
    if (Boolean(a.isPendingReview) !== Boolean(b.isPendingReview)) {
      return a.isPendingReview ? -1 : 1
    }
    return b.attemptNumber - a.attemptNumber
  })
}

/** Badge count aligned with AttemptHistoryPreviewSection (rich cards, else legacy timeline cap). */
export function getAttemptHistoryPreviewBadgeCount(record: AssessmentRecord): number {
  const rich = buildAttemptPreviewCards(record)
  if (rich.length > 0) return rich.length
  const events = record.assessmentHistory ?? []
  return Math.min(events.length, 20)
}
