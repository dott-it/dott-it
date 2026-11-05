import { AISuggestions } from './ai-suggestions'
import { AssessmentRecord } from './assessment-record'

/**
 * Student Answer Types (matching Prisma studentAnswer)
 */
export interface StudentAnswer {
  id: string
  assessmentRecordId: string
  answers: unknown // Json type from Prisma - can be any JSON value
  aiSuggestions: AISuggestions[]
  createdAt: Date
  updatedAt: Date
  assessmentRecord?: AssessmentRecord
}

export interface Answers {
  title: string
  value: string
  questionId: string
}
