import { ActiveAssessment, AssessmentEvent } from "./assessment"
import { Feedback } from "./feedback.api"
import { StudentAnswer } from "./student-answer"

/**
 * Assessment Record Types (matching Prisma AssessmentRecord)
 */
export interface AssessmentRecord {
    id: string
    tenantId: string
    assessmentId: string
    classSection: string
    learnerId: string
    learnerName: string
    rawAnswer: Record<string, unknown> // Json type from Prisma
    submittedAt: Date
    status: string
    rubricScore: string | null
    details: string
    type: string
    teacherScore: string | null
    numberOfQuestions: string
    createdAt: Date
    updatedAt: Date
    assessment?: ActiveAssessment
  
    feedbacks?:Feedback[]
    studentAnswers?:StudentAnswer[]
    assessmentHistory?:AssessmentEvent[]
  }
  