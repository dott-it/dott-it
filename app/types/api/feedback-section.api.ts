import { FeedbackSection } from '@prisma/assessmentDB'

export type FeedbackSectionWithRelations = FeedbackSection

export interface GetFeedbackSectionParams {
  id: string
}

export interface GetFeedbackSectionsByFeedbackIdParams {
  feedbackId: string
}

export interface CreateFeedbackSectionParams {
  feedbackId: string
  type: string
  section: string
  content: string
  order: number
}

export interface UpdateFeedbackSectionParams {
  id: string
  type?: string
  section?: string
  content?: string
  order?: number
}

export interface DeleteFeedbackSectionParams {
  id: string
}

export interface ReorderFeedbackSectionsParams {
  sections: Array<{ id: string; order: number }>
}
