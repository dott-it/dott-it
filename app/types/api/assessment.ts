import { AssessmentRecord } from "./assessment-record"
import { AssessmentTemplate } from "./assessment-template"

export type AssessmentStatus = 'draft' | 'live' | 'completed' | 'expired'

export interface submissionStatus {
  handedIn: number
  readyForReview: number
  inProgress: number
  shared: number
}

export const eventType = {
  submission: 'submission',
  ai_review: 'ai_review',
  teacher_review: 'teacher_review',
} as const

export type EventType = (typeof eventType)[keyof typeof eventType]


/**
 * Assessment Types (matching Prisma Assessment + UI requirements)
 */
export interface ActiveAssessment {
  // Core Prisma fields
  id: string
  tenantId: string
  templateId: string
  teacherId: string
  assignedBy: string
  assignedAt: string
  dueAt: string
  assignedTo: Record<string, unknown> // Json type from Prisma
  submissionUrl?: string
  googleFormId?: string | null
  status: string
  instructions?: string
  numberOfQuestions: number
  schoolYear?: string
  unitCode?: string | null
  lessonNumber?: number | null
  studentResponsesCount?: number

  // UI/Display fields (populated from template or computed)
  title: string
  unitName?: string
  className?: string
  /** Soft class labels from AssessmentRecord.classSection (list payload). */
  classSections?: string[]
  subject?: string
  grade?: number | null
  type?: string
  dueDate?: Date
  startDate?: string
  closeDate?: Date
  totalRecords: number
  pendingRecords?: number
  studentCount?: number
  hasThematicAnalysis?: boolean
  submissionStats?: {
    readyForReview: number
    shared: number
  }
  submissionStatus?: submissionStatus
  description?: string
  assessmentRecords?: AssessmentRecord[]
  // Relations
  template?: AssessmentTemplate
  tenant?: {
    id: string
    name: string
    slug: string
  } | null
  teacher?: {
    id: string
    name: string | null
    email: string | null
  } | null
}


// Feedback types are now defined in api/feedback.api.ts to avoid conflicts

/**
 * Assessment Event Types (matching Prisma AssessmentEvent)
 */
export interface AssessmentEvent {
  id: string
  assessmentRecordId: string
  eventType: string
  eventData: Record<string, unknown> // Json type from Prisma
  timestamp: Date
  userId?: string
  userType?: string
  assessmentRecord?: AssessmentRecord
}

/**
 * Student Record Types (for UI display)
 */
export interface StudentRecord {
  id: string
  name: string
  email?: string
  classSection?: string
  status?: string
  submittedAt?: Date
  score?: string
  feedback?: string
  spiritAnimal?: string
}

/**
 * Assessment Record Status Types
 */
export type AssessmentRecordStatus =
  | 'handed_in'
  | 'ready_for_review'
  | 'in_progress'
  | 'shared'

// Legacy aliases for backward compatibility
export type Assessment = ActiveAssessment
