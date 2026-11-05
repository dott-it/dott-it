import { prisma } from '@/lib/prisma'
import { getCurrentSchoolYear } from '@/lib/school-year'
import { THEMATIC_PROCESSING_STALE_MS } from '@/lib/thematic-analysis/first-run-eligibility'
import {
  SPOTLIGHT_MIN_RESPONSES,
  filterHoursForSpotlight,
  pickSpotlightThematicStatus,
  type SpotlightThematicStatus,
} from './eligibility'

export type SpotlightCard = {
  assessmentId: string
  title: string
  studentResponsesCount: number
  hours: string[]
  thematicStatus: SpotlightThematicStatus
}

export type ListSpotlightCardsOptions = {
  /** When set, only assessments for this teacher. Omit for staff (all assessments). */
  scopeTeacherId?: string | null
  /** When set, exclude assessments this teacher has dismissed. */
  dismissalTeacherId?: string | null
  schoolYear?: string
  now?: Date
}

/**
 * Class sections that already have at least one record with a studentAnswer.
 * Empty classSection labels are omitted.
 */
export async function getClassSectionsWithResponses(
  assessmentId: string,
): Promise<string[]> {
  const rows = await prisma.$queryRaw<Array<{ classSection: string }>>`
    SELECT ar."classSection"
    FROM "AssessmentRecord" ar
    INNER JOIN "studentAnswer" sa ON sa."assessmentRecordId" = ar.id
    WHERE ar."assessmentId" = ${assessmentId}
      AND TRIM(ar."classSection") <> ''
    GROUP BY ar."classSection"
    ORDER BY ar."classSection" ASC
  `
  return filterHoursForSpotlight(rows)
}

async function getHoursByAssessmentIds(
  assessmentIds: string[],
): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>()
  if (assessmentIds.length === 0) return result

  // Avoid $queryRaw + Prisma.join (can serialize as jsonb under Next.js HMR).
  const rows = await prisma.assessmentRecord.findMany({
    where: {
      assessmentId: { in: assessmentIds },
      NOT: { classSection: '' },
      studentAnswers: { some: {} },
    },
    select: {
      assessmentId: true,
      classSection: true,
    },
    distinct: ['assessmentId', 'classSection'],
    orderBy: [{ assessmentId: 'asc' }, { classSection: 'asc' }],
  })

  for (const row of rows) {
    const existing = result.get(row.assessmentId) ?? []
    existing.push(row.classSection)
    result.set(row.assessmentId, existing)
  }

  for (const [id, sections] of result) {
    result.set(id, filterHoursForSpotlight(sections))
  }

  return result
}

async function getThematicStatusByAssessmentIds(
  assessmentIds: string[],
): Promise<Map<string, SpotlightThematicStatus>> {
  const result = new Map<string, SpotlightThematicStatus>()
  if (assessmentIds.length === 0) return result

  const staleCutoff = new Date(Date.now() - THEMATIC_PROCESSING_STALE_MS)

  const analyses = await prisma.thematicAnalysis.findMany({
    where: {
      assessmentId: { in: assessmentIds },
      OR: [
        {
          status: 'processing',
          updatedAt: { gt: staleCutoff },
        },
        { status: 'completed' },
      ],
    },
    select: {
      assessmentId: true,
      status: true,
    },
  })

  const byAssessment = new Map<string, Array<{ status: string }>>()
  for (const row of analyses) {
    const list = byAssessment.get(row.assessmentId) ?? []
    list.push({ status: row.status })
    byAssessment.set(row.assessmentId, list)
  }

  for (const id of assessmentIds) {
    result.set(id, pickSpotlightThematicStatus(byAssessment.get(id) ?? []))
  }

  return result
}

/**
 * Spotlight cards for the workspace home: current school year assessments
 * with ≥10 total responses, not dismissed by the teacher.
 */
export async function listSpotlightCards(
  options: ListSpotlightCardsOptions = {},
): Promise<SpotlightCard[]> {
  const now = options.now ?? new Date()
  const schoolYear = options.schoolYear ?? getCurrentSchoolYear(now)

  const assessments = await prisma.assessment.findMany({
    where: {
      schoolYear,
      studentResponsesCount: { gte: SPOTLIGHT_MIN_RESPONSES },
      ...(options.scopeTeacherId
        ? { teacherId: options.scopeTeacherId }
        : {}),
      ...(options.dismissalTeacherId
        ? {
            NOT: {
              spotlightDismissals: {
                some: { teacherId: options.dismissalTeacherId },
              },
            },
          }
        : {}),
    },
    select: {
      id: true,
      studentResponsesCount: true,
      template: { select: { title: true } },
    },
    orderBy: [{ studentResponsesCount: 'desc' }, { id: 'asc' }],
  })

  if (assessments.length === 0) return []

  const ids = assessments.map((row) => row.id)
  const [hoursById, thematicById] = await Promise.all([
    getHoursByAssessmentIds(ids),
    getThematicStatusByAssessmentIds(ids),
  ])

  return assessments.map((row) => ({
    assessmentId: row.id,
    title: row.template.title,
    studentResponsesCount: row.studentResponsesCount,
    hours: hoursById.get(row.id) ?? [],
    thematicStatus: thematicById.get(row.id) ?? null,
  }))
}
