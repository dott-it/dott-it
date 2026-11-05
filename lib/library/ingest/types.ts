/** Canonical ingest schema (aligned with opensci-assess-hub ingest-manifest). */

export type AssessmentSource = 'te-opportunity' | 'formal-assessment'

export type AssessmentTypeSlug =
  | 'pre-assessment'
  | 'formative'
  | 'summative'
  | 'peer-feedback'
  | 'lesson-reflection'

export type AssessmentOpportunityType =
  | 'engineering-design'
  | 'investigation-data'
  | 'handout-written'
  | 'discussion-argument'
  | 'observation'
  | 'named-package'

export type LibraryOutputKind =
  | 'full-package'
  | 'guidance-pdf'
  | 'handout-form-planned'
  | 'handout-guidance'

export interface IngestedFileRefs {
  studentHandout: string | null
  teacherGuide: string | null
  answerKey: string | null
  /** Shared Drive / curriculum Form (canonical lesson copy; may be paste-a-link). */
  googleForm: string | null
  /**
   * forms@ My Drive Form (native File upload). Preferred for library Open/Quick look
   * and as the teacher-export template.
   */
  googleFormTeacherReady?: string | null
  rubric: string | null
  guidanceSheet?: string | null
}

export interface IngestedAssessment {
  id: string
  lesson: string
  lessonNum: number
  title: string
  shortTitle?: string
  peCode?: string | null
  buildingTowards?: string | null
  lookListenFor?: string | null
  whatToDo?: string | null
  assessmentType?: AssessmentTypeSlug
  typeLabel?: string
  source?: AssessmentSource
  opportunityType?: AssessmentOpportunityType
  libraryOutput?: LibraryOutputKind
  standards: string[]
  isSummative?: boolean
  description: string
  previewExcerpt?: string
  files: IngestedFileRefs
  linkedTeOpportunityId?: string | null
}

export interface IngestedLesson {
  lessonNum: number
  shortTitle?: string
  title: string
  teacherEditionPath?: string | null
  expectedDays?: number
}

export interface IngestedUnitManifest {
  unitId: string
  unitTitle: string
  description: string
  lessonCount: number
  suggestedPacingDays?: number
  unitOverviewPath?: string | null
  ingestedFrom?: string
  ingestedAt?: string
  lessons?: IngestedLesson[]
  assessments: IngestedAssessment[]
}
