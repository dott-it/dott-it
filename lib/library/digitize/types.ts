import type { IngestedAssessment } from '@/lib/library/ingest/types'

export type DigitizeQuestionType = 'text' | 'paragraph' | 'file' | 'radio' | 'checkbox'

export interface DigitizeQuestion {
  /**
   * Short question header shown as the Forms item title
   * (e.g. "2a." or "2a. Predict the peak force").
   */
  title: string
  /**
   * Longer prompt / context under the header (Forms Item.description).
   * Prefer spaced chunks with blank lines (`\\n\\n`) for readability.
   */
  description?: string
  type: DigitizeQuestionType
  options?: string[]
  required: boolean
  /** 1-based indexes matching `[IMAGE:N]` markers from the handout. */
  imageIndexes?: number[]
  /** Handout question number when present (e.g. Question 3 → 3). */
  sourceNumber?: number
}

/** Static section / table / context shown before questions. */
export interface DigitizeTextBlock {
  kind: 'text'
  title: string
  description?: string
  imageIndexes?: number[]
}

export interface DigitizeQuestionBlock extends DigitizeQuestion {
  kind: 'question'
}

export type DigitizeFormBlock = DigitizeTextBlock | DigitizeQuestionBlock

export type DigitizeSkipReason =
  | 'not-formal-assessment'
  | 'missing-student-handout'
  | 'google-form-already-present'
  | 'existing-eddo-form-in-lesson-folder'

export interface DigitizeEligibilityResult {
  eligible: boolean
  reason?: DigitizeSkipReason
}

export interface DigitizePipelineOptions {
  unitCode: string
  assessmentId: string
  force?: boolean
  dryRun?: boolean
  /** Download handout + LLM extract questions, then stop (no Form create). */
  extractOnly?: boolean
  /** When extractOnly, write asset PNGs + catalog JSON under this directory. */
  dumpAssetsDir?: string
  accessToken: string
}

export interface DigitizeDryRunPlan {
  unitCode: string
  assessmentId: string
  assessmentTitle: string
  handoutDriveFileId: string
  lessonFolderId: string
  formTitle: string
  existingEddoFormId: string | null
  wouldSkip: boolean
  skipReason?: DigitizeSkipReason
}

export interface DigitizeSuccessResult {
  status: 'created'
  formId: string
  formUrl: string
  formTitle: string
  lessonFolderId: string
  questionCount: number
  questions: DigitizeQuestion[]
  blockCount: number
  /** My Drive teacher-export template (native File upload) when prepare succeeded. */
  teacherReadyFormId?: string
  teacherReadyFormUrl?: string
  /** Native File upload items created on the teacher-ready copy. */
  fileUploadsConverted?: number
  studentUploadsFolderUrl?: string
}

export interface DigitizeExtractOnlyResult {
  status: 'extract-only'
  assessmentTitle: string
  formTitle: string
  handoutDriveFileId: string
  lessonFolderId: string
  questionCount: number
  questions: DigitizeQuestion[]
  blockCount: number
  /** Layout-aware handout visuals (figures, tables, composed panels). */
  assets: Array<{
    index: number
    kind: 'figure' | 'table' | 'composed'
    fileName: string
    contextHint?: string
    panelCount?: number
    widthPx?: number
    heightPx?: number
  }>
}

export interface DigitizeSkippedResult {
  status: 'skipped'
  reason: DigitizeSkipReason
  existingFormId?: string
  existingFormUrl?: string
}

export interface DigitizeDryRunResult {
  status: 'dry-run'
  plan: DigitizeDryRunPlan
}

export type DigitizeResult =
  | DigitizeSuccessResult
  | DigitizeSkippedResult
  | DigitizeDryRunResult
  | DigitizeExtractOnlyResult

export type DigitizeAssessmentInput = Pick<
  IngestedAssessment,
  'id' | 'title' | 'source' | 'files'
>
