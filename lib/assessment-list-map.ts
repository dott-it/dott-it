import { formatAssignedToClass } from './assessment-assigned-to'

/**
 * Template fields for the assessments list.
 * Teacher edition and answer key stay on the detail route so the catalog query
 * does not load them.
 */
export const assessmentListTemplateSelect = {
  title: true,
  type: true,
  subject: true,
  description: true,
  gradeLevel: true,
  unitCode: true,
  lessonNumber: true,
} as const

/** Record status is enough for list counts. History stays on the detail route. */
export const assessmentListRecordSelect = {
  status: true,
} as const

export const assessmentListInclude = {
  template: { select: assessmentListTemplateSelect },
  thematicAnalyses: {
    where: { status: 'completed' },
    select: { id: true, status: true },
    take: 1,
  },
  assessmentRecords: {
    select: assessmentListRecordSelect,
  },
} as const

export type AssessmentListTemplate = {
  title: string
  subject: string | null
  gradeLevel: string | null
  description: string | null
  unitCode: string | null
  lessonNumber: number | null
  type: string
}

export type AssessmentListSource = {
  id: string
  tenantId: string
  teacherId: string
  assignedBy: string | null
  assignedTo: unknown
  schoolYear: string
  unitCode: string | null
  studentResponsesCount: number
  template: AssessmentListTemplate
  dueAt: string
  assignedAt: string
  status: string
  assessmentRecords: Array<{ status: string }>
  thematicAnalyses?: Array<{ id: string; status: string }>
}

export type AssessmentListItem = {
  id: string
  tenantId: string
  title: string
  unitName: string
  unitCode: string | null
  lessonNumber: number | null
  className: string
  schoolYear: string
  studentResponsesCount: number
  hasThematicAnalysis: boolean
  subject: string
  grade: number | null
  type: string
  dueDate: string
  startDate: string
  status: 'draft' | 'live' | 'completed' | 'expired'
  totalRecords: number
  pendingRecords: number
  studentCount: number
  description: string
  assignedBy: string | null
  submissionStatus: {
    handedIn: number
    readyForReview: number
    inProgress: number
    shared: number
  }
  teacher?: {
    id: string
    name: string | null
    email: string | null
  }
  tenant?: {
    id: string
    name: string | null
    slug: string | null
  }
}

type DirectoryUser = { id: string; name: string | null; email: string | null }
type DirectoryTenant = { id: string; name: string | null; slug: string | null }

/**
 * Unit label shared by the list and the detail payload.
 * Uses a real unit code, then the subject. Never invents "Science".
 */
export function resolveAssessmentUnitDisplay(input: {
  unitCode?: string | null
  templateUnitCode?: string | null
  subject?: string | null
}): { unitCode: string | null; unitName: string; subject: string } {
  const unitCode = readUnitCode(input.unitCode) || readUnitCode(input.templateUnitCode) || null
  const subject = (input.subject ?? '').trim()
  return {
    unitCode,
    subject,
    unitName: unitCode || subject,
  }
}

export function mapAssessmentListRow(
  assessment: AssessmentListSource,
  teacherMap: Map<string, DirectoryUser>,
  tenantMap: Map<string, DirectoryTenant>,
): AssessmentListItem {
  const teacher = teacherMap.get(assessment.assignedBy ?? assessment.teacherId ?? '')
  const tenant = tenantMap.get(assessment.tenantId)
  const unit = resolveAssessmentUnitDisplay({
    unitCode: assessment.unitCode,
    templateUnitCode: assessment.template.unitCode,
    subject: assessment.template.subject,
  })

  return {
    id: assessment.id,
    tenantId: assessment.tenantId,
    title: assessment.template.title,
    unitName: unit.unitName,
    unitCode: unit.unitCode,
    lessonNumber: assessment.template.lessonNumber ?? null,
    className: formatAssignedToClass(assessment.assignedTo),
    schoolYear: assessment.schoolYear,
    studentResponsesCount: assessment.studentResponsesCount ?? 0,
    hasThematicAnalysis: (assessment.thematicAnalyses?.length ?? 0) > 0,
    subject: unit.subject,
    grade: extractNumericGrade(assessment.template.gradeLevel),
    type: assessment.template.type || 'Assessment',
    dueDate: assessment.dueAt,
    startDate: assessment.assignedAt,
    status: normalizeAssessmentStatus(assessment.status),
    totalRecords: assessment.assessmentRecords.length,
    pendingRecords: assessment.assessmentRecords.filter((record) => record.status === 'submitted')
      .length,
    studentCount: assessment.studentResponsesCount ?? assessment.assessmentRecords.length,
    description: assessment.template.description || '',
    assignedBy: assessment.assignedBy,
    submissionStatus: computeSubmissionStatus(assessment.assessmentRecords),
    teacher: teacher
      ? {
          id: teacher.id,
          name: teacher.name,
          email: teacher.email,
        }
      : undefined,
    tenant: tenant
      ? {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
        }
      : undefined,
  }
}

function readUnitCode(value: string | null | undefined): string {
  return (value ?? '').trim()
}

function computeSubmissionStatus(records: Array<{ status: string }>) {
  return {
    handedIn: records.filter((record) => record.status === 'handed_in').length,
    readyForReview: records.filter((record) => record.status === 'ready_for_review').length,
    inProgress: records.filter((record) => record.status === 'in_progress').length,
    shared: records.filter((record) => record.status === 'shared').length,
  }
}

function extractNumericGrade(gradeLevel: string | null | undefined): number | null {
  if (!gradeLevel) return null
  const match = gradeLevel.match(/(\d+)/)
  return match ? Number.parseInt(match[1], 10) : null
}

function normalizeAssessmentStatus(status: string): 'draft' | 'live' | 'completed' | 'expired' {
  const value = (status || '').toLowerCase().trim()
  switch (value) {
    case 'draft': {
      return 'draft'
    }
    case 'live':
    case 'active':
    case 'in_progress':
    case 'in-progress': {
      return 'live'
    }
    case 'completed':
    case 'complete':
    case 'done': {
      return 'completed'
    }
    case 'expired':
    case 'archived':
    case 'closed': {
      return 'expired'
    }
    default: {
      return 'live'
    }
  }
}
