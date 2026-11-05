import { ActiveAssessment } from '@/types'

/**
 * API response type for assessments
 */
export interface ApiAssessment {
  id: string
  title: string
  subject: string
  grade: number | null
  status: string
  totalRecords: number
  pendingRecords: number
}

/**
 * Create assessment request type
 */
export interface CreateAssessmentRequest {
  title: string
  subject: string
  grade?: number
  description?: string
  dueDate?: string
  closeDate?: string
}

/**
 * Update assessment request type
 */
export interface UpdateAssessmentRequest {
  title?: string
  subject?: string
  grade?: number
  description?: string
  dueDate?: string
  closeDate?: string
  status?: ActiveAssessment['status']
}
