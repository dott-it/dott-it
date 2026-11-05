import { FeedbackSection } from "./feedback-section"
import { StudentAnswer } from "./student-answer"
import { RubricEvaluation } from "./rubric-evaluation"
/**
 * AI Suggestions Types (matching Prisma aiSuggestions)
 */

export interface AISuggestions {
  id: string
  feedback: FeedbackSection[]
  studentAnswerId: string
  rubricScore: string
  rubricEvaluation?: Partial<RubricEvaluation>[] | null
  used?: boolean | null
  discarted?: boolean | null
  createdAt: Date
  updatedAt: Date
  studentAnswer?: StudentAnswer
}