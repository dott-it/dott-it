import type { Feedback, FeedbackSection } from '@/types'
import { pickCanonicalPendingFeedback } from '@/app/lib/feedback/resolve-canonical-pending-feedback'
import { shouldShowPendingFeedbackSection } from '@/app/lib/feedback/merge-feedback-sections'

function feedbackTimeMs(d: Date | string | undefined | null): number {
  if (d == null) return 0
  return new Date(d).getTime()
}

function sortSections(sections: FeedbackSection[]): FeedbackSection[] {
  return [...sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

/** Latest completed feedback with at least one visible section (same ordering as Past Attempts / export). */
export function getLatestCompletedFeedbackSections(feedbacks: Feedback[] | undefined): FeedbackSection[] {
  if (!feedbacks?.length) return []

  const completed = [...feedbacks]
    .filter((f) => f.status === 'completed')
    .sort(
      (a, b) =>
        feedbackTimeMs(b.completedAt ?? b.updatedAt) - feedbackTimeMs(a.completedAt ?? a.updatedAt),
    )

  for (const fb of completed) {
    const rows = (fb.feedbackSections ?? []).filter((s) => shouldShowPendingFeedbackSection(s))
    if (rows.length > 0) return sortSections(rows)
  }

  return []
}

/**
 * Sections for export preview: pending draft if any **visible** rows, otherwise latest completed feedback.
 * Matches what teachers expect to see after sharing (completed) or while editing (pending).
 */
export function getExportPreviewFeedbackSections(feedbacks: Feedback[] | undefined): FeedbackSection[] {
  if (!feedbacks?.length) return []

  const pending = pickCanonicalPendingFeedback(feedbacks)
  if (pending?.feedbackSections?.length) {
    const rows = pending.feedbackSections.filter((s) => shouldShowPendingFeedbackSection(s))
    if (rows.length > 0) return sortSections(rows)
  }

  return getLatestCompletedFeedbackSections(feedbacks)
}
