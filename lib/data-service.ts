import { PrismaClient } from '@prisma/assessmentDB'
import { getAssessmentTotalPoints } from '@/app/lib/utils/score-format'
import { userPrisma } from './user-prisma'
import {
  assessmentListInclude,
  mapAssessmentListRow,
  type AssessmentListItem,
  type AssessmentListSource,
} from './assessment-list-map'
import { schoolYearWhereClause, type SchoolYearListFilter } from './school-year'

const prisma = new PrismaClient()

type AssessmentRecordWithRelations = {
  id: string
  assessmentId: string
  learnerId: string
  status: string
  submittedAt: Date
  rubricScore: string | null
  teacherScore: string | null
  rawAnswer: unknown
  assessment: {
    tenantId: string
    template: {
      id: string
      type: string
      createdAt: Date
      updatedAt: Date
      title: string
      description: string | null
      subject: string | null
      gradeLevel: string | null
      unitCode: string | null
      pointValue?: number
    }
  }
  assessmentHistory: Array<{
    eventType: string
    eventData: unknown
  }>
}

export type GetAssessmentsOptions = {
  schoolYear?: SchoolYearListFilter
}

// Function to fetch assessment data from database
export async function getAssessments(options?: GetAssessmentsOptions): Promise<AssessmentListItem[]> {
  try {
    const assessments = await prisma.assessment.findMany({
      where: schoolYearWhereClause(options?.schoolYear),
      include: assessmentListInclude,
    })

    const teacherMap = await mapTeachersForAssessments(assessments)
    const tenantMap = await mapTenantsForAssessments(assessments)

    return assessments.map((assessment) =>
      mapAssessmentListRow(assessment, teacherMap, tenantMap),
    )
  } catch (error) {
    console.error('Error fetching assessments:', error)
    throw error
  }
}

export async function getAssessmentsByTeacher(
  email: string,
  options?: GetAssessmentsOptions,
): Promise<AssessmentListItem[]> {
  try {
    const teacher= await userPrisma.teacher.findFirst({
      where: {
        email,
      },
    })

    if(!teacher){
      return []
    }
    const assessments = await prisma.assessment.findMany({
      where: {
        teacherId: teacher?.id,
        ...schoolYearWhereClause(options?.schoolYear),
      },
      include: assessmentListInclude,
    })

    const teacherMap = await mapTeachersForAssessments(assessments)
    const tenantMap = await mapTenantsForAssessments(assessments)

    return assessments.map((assessment) =>
      mapAssessmentListRow(assessment, teacherMap, tenantMap),
    )
  } catch (error) {
    console.error('Error fetching assessments:', error)
    throw error
  }
}

// Function to fetch assessment data from database
export async function getAssessmentsByTenantId(
  tenantId: string,
  options?: GetAssessmentsOptions,
): Promise<AssessmentListItem[]> {
  try {
    console.log('Data Service: Fetching assessments for tenantId:', tenantId)
    
    const assessments = await prisma.assessment.findMany({
      where: {
        tenantId,
        ...schoolYearWhereClause(options?.schoolYear),
      },
      include: assessmentListInclude,
    })

    console.log('Data Service: Raw assessments from DB:', assessments.length)

    const teacherMap = await mapTeachersForAssessments(assessments)
    const tenantMap = await mapTenantsForAssessments(assessments)

    const mappedAssessments = assessments.map((assessment) =>
      mapAssessmentListRow(assessment, teacherMap, tenantMap),
    )

    console.log('Data Service: Mapped assessments:', mappedAssessments.length)

    return mappedAssessments
  } catch (error) {
    console.error('Data Service: Error fetching assessments:', error)
    throw error
  }
}

async function mapTeachersForAssessments(
  assessments: Array<Pick<AssessmentListSource, 'assignedBy' | 'teacherId'>>,
) {
  const teacherIds = [
    ...new Set(
      assessments
        .map((assessment) => assessment.assignedBy || assessment.teacherId)
        .filter((id): id is string => typeof id === 'string' && id.length > 0),
    ),
  ]

  if (teacherIds.length === 0) {
    return new Map<string, { id: string; name: string | null; email: string | null }>()
  }

  try {
    const teachers = await userPrisma.user.findMany({
      where: {
        id: {
          in: teacherIds,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    return new Map(teachers.map((teacher) => [teacher.id, teacher]))
  } catch (error) {
    console.error('Data Service: Error fetching teacher data:', error)
    return new Map<string, { id: string; name: string | null; email: string | null }>()
  }
}

async function mapTenantsForAssessments(
  assessments: Array<Pick<AssessmentListSource, 'tenantId'>>,
) {
  const tenantIds = [
    ...new Set(
      assessments
        .map((assessment) => assessment.tenantId)
        .filter((id): id is string => typeof id === 'string' && id.length > 0),
    ),
  ]

  if (tenantIds.length === 0) {
    return new Map<string, { id: string; name: string | null; slug: string | null }>()
  }

  try {
    const tenants = await userPrisma.tenant.findMany({
      where: {
        id: {
          in: tenantIds,
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    })

    return new Map(tenants.map((tenant) => [tenant.id, tenant]))
  } catch (error) {
    console.error('Data Service: Error fetching tenant data:', error)
    return new Map<string, { id: string; name: string | null; slug: string | null }>()
  }
}


// Function to fetch assessment records from database
export async function getAssessmentRecords() {
  try {
    const records = await prisma.assessmentRecord.findMany({
      include: {
        assessment: {
          include: {
            template: true,
          },
        },
        assessmentHistory: {
          orderBy: { timestamp: 'asc' },
        },
      },
    })

    return records.map((record: AssessmentRecordWithRelations) => ({
      id: record.id,
      assessmentId: record.assessmentId,
      studentName: `Learner ${record.learnerId}`,
      studentId: record.learnerId,
      status: record.status,
      submittedDate: record.submittedAt.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      score: record.rubricScore || undefined,
      maxScore: getAssessmentTotalPoints(record.assessment.template as { pointValue?: number }),
      reviewedDate: record.teacherScore
        ? record.submittedAt.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : undefined,
      flagged: false, // This field doesn't exist in schema, defaulting to false
      feedback: record.assessmentHistory
        .filter((event) => event.eventType === 'ai_review' || event.eventType === 'teacher_review')
        .map((event) => {
          const eventData = event.eventData as Record<string, unknown>
          return {
            type: event.eventType,
            section: (eventData?.section as string) || 'General',
            content: (eventData?.feedback as string) || (eventData?.content as string) || '',
          }
        }),
      content: record.rawAnswer ? JSON.stringify(record.rawAnswer) : '',
    }))
  } catch (error) {
    console.error('Error fetching assessment records:', error)
    return []
  }
}
