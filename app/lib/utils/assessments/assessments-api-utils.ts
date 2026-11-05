import { ActiveAssessment } from '@/types'
import { ApiAssessment } from '../../types/assessments/assessments-api-types'
import {
  CreateAssessmentSchema,
  UpdateAssessmentSchema,
  AssessmentResponseSchema,
  type CreateAssessmentInput,
  type UpdateAssessmentInput,
} from '../../schemas/assessment-schemas'

/**
 * Map API response to our Assessment type
 * Returns a partial ActiveAssessment with only the fields available from API
 */
export const mapApiAssessmentToAssessment = (
  apiAssessment: ApiAssessment,
): Partial<ActiveAssessment> => {
  return {
    id: apiAssessment.id,
    title: apiAssessment.title,
    unitName: apiAssessment.subject, // Map subject to unitName
    subject: apiAssessment.subject,
    grade: apiAssessment.grade || 0,
    type: 'Assessment', // Default type
    dueDate: new Date(), // Default due date
    startDate: new Date().toISOString(), // Default start date
    closeDate: new Date(), // Default close date
    status: apiAssessment.status || 'live', // Use API status or default to 'live'
    totalRecords: apiAssessment.totalRecords || 0,
    pendingRecords: apiAssessment.pendingRecords || 0,
    studentCount: apiAssessment.totalRecords || 0, // Use totalRecords as studentCount
    submissionStats: {
      readyForReview: 0,
      shared: 0,
    }, // Default empty stats
    description: apiAssessment.title, // Use title as description
  }
}

/**
 * Validate assessment data for creation using Zod
 */
export const validateCreateAssessmentData = (
  data: CreateAssessmentInput,
): CreateAssessmentInput => {
  return CreateAssessmentSchema.parse(data)
}

/**
 * Validate assessment data for updates using Zod
 */
export const validateUpdateAssessmentData = (
  data: UpdateAssessmentInput,
): UpdateAssessmentInput => {
  return UpdateAssessmentSchema.parse(data)
}

/**
 * Validate assessment response from API using Zod
 */
export const validateAssessmentResponse = (data: unknown) => {
  return AssessmentResponseSchema.parse(data)
}

/**
 * Safe validation functions that don't throw errors
 */
export const safeValidateCreateAssessmentData = (data: CreateAssessmentInput) => {
  return CreateAssessmentSchema.safeParse(data)
}

export const safeValidateUpdateAssessmentData = (data: UpdateAssessmentInput) => {
  return UpdateAssessmentSchema.safeParse(data)
}

export const safeValidateAssessmentResponse = (data: unknown) => {
  return AssessmentResponseSchema.safeParse(data)
}
