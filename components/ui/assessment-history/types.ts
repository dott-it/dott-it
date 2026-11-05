import type { Assessment as AssessmentType } from '@/app/types/api/assessment'
import type { AISuggestions } from '@/types'
import type { Feedback } from '@/app/types/api/feedback.api'

export type { Feedback } from '@/app/types/api/feedback.api'

export type Assessment = AssessmentType

/** Thread message for student assessment history (timeline + resume/export). */
export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date | string
  aiSuggestions?: AISuggestions[]
  studentAnswerId?: string
  metadata: {
    type: 'submission' | 'feedback' | 'feedback-cards' | 'score-suggestion'
    studentAnswerId?: string
    questionKey?: string
    eventData?: Feedback
  }
}
