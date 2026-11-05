import type { IngestedAssessment } from '@/lib/library/ingest/types'
import {
  getPackageItem,
  isWorkspaceEligible,
  materialContextFromIngested,
} from '@/lib/library/materials'
import { libraryGoogleFormUrl } from '@/lib/library/materials/library-form-url'
import { parseGoogleFormId } from './parse-google-form'

export class LibraryWorkspaceAttachError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'ASSESSMENT_NOT_FOUND'
      | 'NOT_ELIGIBLE'
      | 'MISSING_FORM'
      | 'MISSING_SCORING'
      | 'INVALID_QUESTION_COUNT',
  ) {
    super(message)
    this.name = 'LibraryWorkspaceAttachError'
  }
}

export interface LibraryWorkspaceAttachInput {
  unitCode: string
  assessmentId: string
  ingestedRow: IngestedAssessment
  /** Real question count from Forms API (or a trusted ingest field). */
  numberOfQuestions: number
}

export interface LibraryWorkspaceAttachPayload {
  title: string
  description: string
  unitCode: string
  gradeLevel: string
  subject: string
  googleFormId: string
  submissionUrl: string
  libraryAssessmentId: string
  numberOfQuestions: number
}

export function gradeFromUnitCode(unitCode: string): string {
  const match = /^(\d+)\./.exec(unitCode.trim())
  return match?.[1] ?? ''
}

export function buildLibraryWorkspaceAttachPayload(
  input: LibraryWorkspaceAttachInput,
): LibraryWorkspaceAttachPayload {
  const context = materialContextFromIngested(input.ingestedRow)

  if (!isWorkspaceEligible(context)) {
    throw new LibraryWorkspaceAttachError(
      'This assessment is not yet available for Workspace. Export materials instead.',
      'NOT_ELIGIBLE',
    )
  }

  if (
    !Number.isInteger(input.numberOfQuestions) ||
    input.numberOfQuestions < 1
  ) {
    throw new LibraryWorkspaceAttachError(
      'Google Form question count could not be determined.',
      'INVALID_QUESTION_COUNT',
    )
  }

  const formItem = getPackageItem(context, 'google-form')
  const submissionUrl = formItem?.url?.startsWith('http')
    ? formItem.url
    : libraryGoogleFormUrl(input.ingestedRow.files)
  if (!submissionUrl?.startsWith('http')) {
    throw new LibraryWorkspaceAttachError(
      'A live Google Form URL is required to add this assessment to Workspace.',
      'MISSING_FORM',
    )
  }

  const googleFormId = parseGoogleFormId(submissionUrl)
  if (!googleFormId) {
    throw new LibraryWorkspaceAttachError(
      'Google Form URL must include a Forms API formId (/forms/d/{formId}/…), not a published /d/e/ link.',
      'MISSING_FORM',
    )
  }

  const hasScoring =
    Boolean(getPackageItem(context, 'answer-key')?.available) ||
    Boolean(getPackageItem(context, 'rubric')?.available)
  if (!hasScoring) {
    throw new LibraryWorkspaceAttachError(
      'Answer key or rubric is required to add this assessment to Workspace.',
      'MISSING_SCORING',
    )
  }

  const grade = gradeFromUnitCode(input.unitCode)
  const lessonLabel = input.ingestedRow.lessonNum
    ? `Lesson ${input.ingestedRow.lessonNum}`
    : 'OpenSciEd assessment'

  return {
    title: input.ingestedRow.title,
    description: `OpenSciEd Unit ${input.unitCode} · ${lessonLabel}`,
    unitCode: input.unitCode,
    gradeLevel: grade || 'Middle school',
    subject: 'OpenSciEd',
    googleFormId,
    submissionUrl,
    libraryAssessmentId: input.ingestedRow.id,
    numberOfQuestions: input.numberOfQuestions,
  }
}
