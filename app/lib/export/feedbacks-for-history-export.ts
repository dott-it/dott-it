import type { Feedback, FeedbackSection } from '@/app/types'
import { shouldShowPendingFeedbackSection } from '@/app/lib/feedback/merge-feedback-sections'
import { pickCanonicalPendingFeedback } from '@/app/lib/feedback/resolve-canonical-pending-feedback'

function visibleHistorySections(sections: FeedbackSection[] | undefined): FeedbackSection[] {
  return (sections ?? []).filter((s) => shouldShowPendingFeedbackSection(s))
}

/**
 * Feedback rows written into PDF/DOC assessment history.
 *
 * The current teacher draft is still `pending` until share/export marks it
 * completed, so the first export must include that canonical pending row.
 * Every row — pending or completed — only keeps sections that
 * {@link shouldShowPendingFeedbackSection} would show, so a second export of
 * the same feedback after share matches the first file.
 */
export function feedbacksForHistoryExport(feedbacks: Feedback[] | undefined): Feedback[] {
  const list = feedbacks ?? []
  const canonicalPending = pickCanonicalPendingFeedback(list)

  const exported: Feedback[] = []
  for (const fb of list) {
    if (fb.status === 'pending' && fb.id !== canonicalPending?.id) continue

    const visibleSections = visibleHistorySections(fb.feedbackSections)
    if (visibleSections.length === 0) continue
    exported.push({ ...fb, feedbackSections: visibleSections })
  }
  return exported
}
