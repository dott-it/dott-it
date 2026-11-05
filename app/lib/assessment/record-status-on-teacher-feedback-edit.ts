/**
 * When the teacher edits picked feedback (AI sections, cards, etc.), the assessment
 * record should leave "ready for review" or post-export "shared" and return to
 * in progress until the next export.
 */
export function shouldBumpAssessmentToInProgressOnFeedbackEdit(status?: string): boolean {
  return status === 'ready_for_review' || status === 'shared'
}
