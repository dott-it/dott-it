import type { DigitizeAssessmentInput, DigitizeEligibilityResult } from './types'

/**
 * v1 digitize eligibility: formal Assessment with student-facing handout and no Form yet.
 * Pass force=true to regenerate even when a googleForm URL is already on the manifest.
 */
export function isDigitizeEligible(
  assessment: DigitizeAssessmentInput,
  options?: { force?: boolean },
): DigitizeEligibilityResult {
  if (assessment.source !== 'formal-assessment') {
    return { eligible: false, reason: 'not-formal-assessment' }
  }

  const handout = assessment.files.studentHandout?.trim()
  if (!handout) {
    return { eligible: false, reason: 'missing-student-handout' }
  }

  const existingForm = assessment.files.googleForm?.trim()
  if (existingForm && !options?.force) {
    return { eligible: false, reason: 'google-form-already-present' }
  }

  return { eligible: true }
}
