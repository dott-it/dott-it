/**
 * Assessment Template Types (matching Prisma AssessmentTemplate)
 */
export interface AssessmentTemplate {
  id: string
  title: string
  type: string
  description: string | null
  curriculumTeachersEdition: string | null
  curriculumAnswerKey: string | null
  subject: string | null
  gradeLevel: string | null
  unitCode: string | null
  lessonNumber: number | null
  createdAt: Date
  updatedAt: Date
  tenant?: {
    id: string
    name: string
    slug: string
  } | null
}

export interface AssessmentTemplateUsageStats {
  totalAssessments: number
  activeAssessments: number
}

export interface TemplateAssessmentSummary {
  id: string
  status: string
  assignedAt: string | null
  dueAt: string | null
  title: string
  numberOfQuestions: number
}

export interface AssessmentTemplateUsagePagination {
  nextCursor?: string
  hasMore: boolean
  pageSize: number
}

export type AssessmentTemplateWithUsage = AssessmentTemplate & {
  usageStats?: AssessmentTemplateUsageStats
  assessments?: TemplateAssessmentSummary[]
  assessmentPagination?: AssessmentTemplateUsagePagination
}

export interface GetAssessmentTemplateParams {
  id: string
  cursor?: string
  limit?: number
}

export interface UpdateAssessmentTemplateParams {
  id: string
  data: Partial<{
    title: string
    type: string
    description: string | null
    curriculumTeachersEdition: string | null
    curriculumAnswerKey: string | null
    subject: string | null
    gradeLevel: string | null
    unitCode: string | null
    lessonNumber: number | null
  }>
}

export interface DeleteAssessmentTemplateParams {
  id: string
}

export interface DuplicateAssessmentTemplateParams {
  id: string
}

export interface CreateAssessmentTemplateParams {
  title: string
  type: string
  description?: string | null
  curriculumTeachersEdition?: string | null
  curriculumAnswerKey?: string | null
  subject?: string | null
  gradeLevel?: string | null
  unitCode?: string | null
  lessonNumber?: number | null
}
