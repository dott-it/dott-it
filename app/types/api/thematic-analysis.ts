// ---------- Reviewer instructions for thematic analysis prompt ----------

export interface ThematicAnalysisReviewerInstructions {
  curriculumTeachersEdition: string
  curriculumAnswerKey: string
  customInstructions: string
}

// ---------- LLM output types (match LangSmith structured output schema) ----------

export interface ThematicAnalysisLLMOutput {
  thematic_analysis: ThematicAnalysisLLMItem[]
  summary: string
}

export interface ThematicAnalysisLLMItem {
  type: 'strength' | 'need'
  title: string
  description: string
  citations: ThematicAnalysisLLMCitation[]
}

export interface ThematicAnalysisLLMCitation {
  student_id: string
  highlights: string[]
  annotation: string
}

// ---------- API / UI types (match Prisma + enriched data) ----------

export type ThematicAnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface ThematicAnalysis {
  id: string
  assessmentId: string
  status: ThematicAnalysisStatus
  responsesCount: number
  summary: string | null
  items: ThematicAnalysisItem[]
  createdAt: Date
  updatedAt: Date
}

export type ThematicAnalysisItemType = 'strength' | 'need'

export interface ThematicAnalysisItem {
  id: string
  type: ThematicAnalysisItemType
  title: string
  description: string
  order: number
  citations: ThematicAnalysisCitation[]
}

export interface ThematicAnalysisCitation {
  id: string
  learnerId: string
  /** Assessment record id for workspace URLs (`/assessments/[id]/[recordId]`). */
  assessmentRecordId?: string | null
  learnerName: string
  highlights: string[]
  annotation: string
}

// ---------- API params ----------

export interface GetThematicAnalysisParams {
  assessmentId: string
  /** When true, API returns plaintext learner names in citations. */
  includeNames?: boolean
}

export interface GetThematicHighlightPhrasesParams {
  assessmentId: string
  learnerId: string
}

export interface ThematicHighlightPhrasesResponse {
  phrases: Array<{
    phrase: string
    type: ThematicAnalysisItemType
  }>
}

export interface TriggerThematicAnalysisParams {
  assessmentId: string
  includeNames?: boolean
}
