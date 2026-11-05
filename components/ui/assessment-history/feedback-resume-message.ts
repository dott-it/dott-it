import type { Feedback } from '@/app/types/api/feedback.api'
import type { Message } from './types'

/** Builds the same `Message` shape as timeline `feedback-cards` rows (resume / edit completed feedback). */
export function completedFeedbackToResumeMessage(feedback: Feedback): Message {
  const sections = feedback.feedbackSections ?? []
  return {
    id: feedback.id,
    timestamp: new Date(feedback.completedAt ?? feedback.updatedAt),
    content: sections.map((s) => s.content).join('<br/><br/>'),
    role: 'user',
    metadata: {
      type: 'feedback-cards',
      eventData: feedback,
    },
  }
}
