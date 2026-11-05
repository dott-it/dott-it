import { AISuggestions } from "./ai-suggestions"
import { Feedback } from "./feedback.api"
/**
 * Feedback Section Types (matching Prisma FeedbackSection)
 */
export interface FeedbackSection {
  id?: string
  feedbackId?: string | null
  type: string // e.g. 'strength' | 'improvement' | 'suggestion' | 'comment'
  section: string
  discarted: boolean | null // Fixed typo from 'discared' to 'discarted'
  used: boolean | null
  content: string
  /** Set once on first teacher edit of an AI template row; UI shows `content` only. */
  originalAiContent?: string | null
  aiSuggestionsId?: string | null
  order?: number
  originalSectionId?: string | null
  isCustomized?: boolean | null
  createdAt?: Date | string
  updatedAt?: Date | string

  aiSuggestion?: AISuggestions
  feedback?: Feedback
}

/**
 * Feedback Section for creation (id is optional)
 */
export interface CreateFeedbackSectionData {
  id?: string
  feedbackId?: string
  type: string
  section: string
  discarted?: boolean
  used?: boolean
  content: string
  aiSuggestionsId?: string
  order?: number
}

/**
 * API Parameter Types for FeedbackSection operations
 */
export interface GetFeedbackSectionParams {
  id: string
}

export interface GetFeedbackSectionsByFeedbackIdParams {
  feedbackId: string
}

export interface GetFeedbackSectionsByAiSuggestionsIdParams {
  aiSuggestionsId: string
}

export type CreateFeedbackSectionParams = Partial<FeedbackSection>

export interface UpdateFeedbackSectionParams {
  id: string
  data: {
    type?: string
    section?: string
    content?: string
    order?: number
    discarted?: boolean
    used?: boolean
    feedbackId?: string
    aiSuggestionsId?: string
  }
}

export interface DeleteFeedbackSectionParams {
  id: string
}

export interface ReorderFeedbackSectionsParams {
  sections: Array<{ id: string; order: number }>
}

export interface BulkUpdateFeedbackSectionsParams {
  sections: Array<{
    id: string
    data: Partial<Omit<FeedbackSection, 'id' | 'createdAt' | 'updatedAt'>>
  }>
}

export interface BulkDeleteFeedbackSectionsParams {
  ids: string[]
}

/**
 * Query parameter types for filtering
 */
export interface FeedbackSectionFilters {
  feedbackId?: string
  aiSuggestionsId?: string
  type?: string
  used?: boolean
  originalSectionId?: string
  order?: number
  discarted?: boolean
  section?: string
}

export interface GetFeedbackSectionsParams {
  filters?: FeedbackSectionFilters
  orderBy?: 'order' | 'createdAt' | 'updatedAt'
  orderDirection?: 'asc' | 'desc'
  limit?: number
  offset?: number
}