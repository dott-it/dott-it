import { shouldBumpAssessmentToInProgressOnFeedbackEdit } from '@/app/lib/assessment/record-status-on-teacher-feedback-edit'

describe('shouldBumpAssessmentToInProgressOnFeedbackEdit', () => {
  it('should be true for ready_for_review', () => {
    expect(shouldBumpAssessmentToInProgressOnFeedbackEdit('ready_for_review')).toBe(true)
  })

  it('should be true for shared', () => {
    expect(shouldBumpAssessmentToInProgressOnFeedbackEdit('shared')).toBe(true)
  })

  it('should be false for other statuses', () => {
    expect(shouldBumpAssessmentToInProgressOnFeedbackEdit('in_progress')).toBe(false)
    expect(shouldBumpAssessmentToInProgressOnFeedbackEdit('handed_in')).toBe(false)
    expect(shouldBumpAssessmentToInProgressOnFeedbackEdit('done')).toBe(false)
  })

  it('should be false when status is omitted', () => {
    expect(shouldBumpAssessmentToInProgressOnFeedbackEdit()).toBe(false)
  })
})
