import type { Feedback } from '@/app/types/api/feedback.api'

function feedbackTimeMs(d: Date | string | undefined): number {
  if (d === undefined) return 0
  return new Date(d).getTime()
}

/**
 * When multiple `Feedback` rows are `pending` for the same assessment record
 * (legacy seed or race), pick the one that should receive teacher edits and
 * match append/delete targets. Prefer feedback that already has teacher-picked
 * AI rows (`originalSectionId`), then most recently updated, then newest created.
 */
export function pickCanonicalPendingFeedback(
  feedbacks: Feedback[] | undefined,
): Feedback | undefined {
  const pending = (feedbacks ?? []).filter((f) => f.status === 'pending')
  if (pending.length === 0) return undefined
  if (pending.length === 1) return pending[0]

  return [...pending].sort((a, b) => {
    const aPick = (a.feedbackSections ?? []).some(
      (s) => s.originalSectionId != null && String(s.originalSectionId) !== '',
    )
    const bPick = (b.feedbackSections ?? []).some(
      (s) => s.originalSectionId != null && String(s.originalSectionId) !== '',
    )
    if (aPick !== bPick) return aPick ? -1 : 1
    const u = feedbackTimeMs(b.updatedAt) - feedbackTimeMs(a.updatedAt)
    if (u !== 0) return u
    return feedbackTimeMs(b.createdAt) - feedbackTimeMs(a.createdAt)
  })[0]
}
