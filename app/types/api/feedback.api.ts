import { FeedbackSection } from './feedback-section'
import { ApiError } from './common.api'


export interface Feedback {
  id: string
  assessmentRecordId: string
  status: string
  createdAt: Date
  updatedAt: Date
  completedAt: Date | null
  feedbackSections: FeedbackSection[]
}

// Request params
export interface GetFeedbackParams {
  id: string
}

export interface GetFeedbacksByAssessmentRecordIdParams {
  assessmentRecordId: string
}

export interface CreateFeedbackParams {
  assessmentRecordId: string
  status: string
  feedbackSections?: Omit<FeedbackSection, 'id' | 'feedbackId'>[]
}

/** POST /api/feedback/:id/sections/add */
export interface AppendFeedbackSectionParams {
  feedbackId: string
  type: string
  section: string
  content: string
  aiSuggestionsId?: string
  originalSectionId?: string
  used?: boolean
  discarted?: boolean
}

export interface UpdateFeedbackParams {
  id: string
  data: Partial<Feedback>
}

export interface DeleteFeedbackParams {
  id: string
}

// Response types
export type FeedbackResponse = Feedback | ApiError
export type FeedbacksResponse = Feedback[] | ApiError

