import { Assessment, AssessmentStatus } from './assessment'
import { ApiError } from './common.api'

/**
 * Assessment API Types
 * Request/Response types for assessment API endpoints
 */

/**
 * Assessment API Request Parameters
 */
export interface GetAssessmentParams {
  id: string
}

export interface GetAssessmentsParams {
  schoolYear?: 'current' | 'prior' | string
}

export interface GetAssessmentsBySubjectParams {
  subject: string
}

export interface GetAssessmentsByGradeParams {
  grade: number
}

export interface CreateAssessmentParams {
  templateId: string
  tenantId: string
  assignedBy: string
  assignedTo: string
  status: AssessmentStatus
  schoolYear: string
  unitCode: string
  numberOfQuestions?: number
  dueDate?: string
  instructions?: string
  submissionUrl?: string | null
  googleFormId?: string | null
}

export interface UpdateAssessmentParams {
  id: string
  data: Partial<Assessment>
}

export interface DeleteAssessmentParams {
  id: string
}

/**
 * Assessment API Response Types
 */
export type AssessmentResponse = Assessment
export type AssessmentsResponse = Assessment[]

export interface CreatedAssessmentRecordSummary {
  id: string
  studentName: string
  status: string
  submittedAt?: string
}

export interface CreatedAssessmentSummary {
  id: string
  title: string | null
  description: string | null
  subject: string | null
  grade: string | null
  dueDate: string | null
  totalRecords: number
  pendingRecords: number
  records: CreatedAssessmentRecordSummary[]
}

export interface CreateAssessmentResponse {
  success: boolean
  assessment: CreatedAssessmentSummary
}

export interface DeleteAssessmentResponse {
  success: boolean
  message: string
}

// Legacy aliases for backward compatibility
export type GetAssessmentsResponse = AssessmentsResponse

/**
 * Assessment Record API Types
 */
export interface GetAssessmentRecordParams {
  id: string
}

export interface GetAssessmentRecordsByAssessmentParams {
  assessmentId: string
}

export interface CreateAssessmentRecordParams {
  assessmentId: string
  classSection: string
  learnerId: string
  learnerName: string
  rawAnswer?: Record<string, unknown>
}

export interface UpdateAssessmentRecordParams {
  id: string
  data: Partial<{
    status: string
    rubricScore: string
    details: string
    teacherScore: string
  }>
}

export interface DeleteAssessmentRecordParams {
  id: string
}

export type AssessmentRecordResponse = Assessment | ApiError
export type AssessmentRecordsResponse = Assessment[] | ApiError
