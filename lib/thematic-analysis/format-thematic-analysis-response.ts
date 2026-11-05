import { prisma } from '@/lib/prisma'
import { userPrisma } from '@/lib/user-prisma'
import { resolveCitationLearnerId } from '@/lib/langsmith/thematic-analysis-utils'
import { hasStudentNameSalt } from '@/app/lib/utils/student-display-name'
import type { ThematicAnalysis } from '@/types'
import { learnerDisplayName } from './learner-display-name'

export type ThematicAnalysisWithRelations = NonNullable<
  Awaited<ReturnType<typeof prisma.thematicAnalysis.findFirst>>
> & {
  items: Array<{
    id: string
    type: string
    title: string
    description: string
    order: number
    citations: Array<{
      id: string
      learnerId: string
      learnerName: string
      highlights: string[]
      annotation: string
    }>
  }>
}

export type FormatThematicAnalysisOptions = {
  /** When false (default), citation learnerName is empty — no plaintext PII in the payload. */
  includeNames?: boolean
  /** When set, keep only citations for this assessment record (via learnerId mapping). */
  forAssessmentRecordId?: string
  /** When set, keep only citations for this learner. */
  forLearnerId?: string
}

export async function formatThematicAnalysisResponse(
  assessmentId: string,
  analysis: ThematicAnalysisWithRelations | null,
  options: FormatThematicAnalysisOptions = {},
): Promise<ThematicAnalysis | null> {
  if (!analysis) return null

  // Honor includeNames only when name salt is configured (same gate as UI).
  const includeNames =
    options.includeNames === true && hasStudentNameSalt()
  const forAssessmentRecordId = options.forAssessmentRecordId?.trim() || ''
  const forLearnerId = options.forLearnerId?.trim() || ''

  const citationLearnerIds = [
    ...new Set(
      (analysis.items ?? []).flatMap((item) =>
        (item.citations ?? []).map((c) => c.learnerId),
      ),
    ),
  ].filter(Boolean)

  const assessmentRecords = await prisma.assessmentRecord.findMany({
    where: { assessmentId },
    include: {
      studentAnswers: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })

  const orderedLearnerIds = assessmentRecords
    .filter((r) => r.studentAnswers.length > 0)
    .map((r) => r.learnerId)

  const recordIdByLearnerId = new Map(
    assessmentRecords.map((r) => [r.learnerId, r.id]),
  )

  const learnerIdByRecordId = new Map(
    assessmentRecords.map((r) => [r.id, r.learnerId]),
  )

  const scopedLearnerId =
    forLearnerId ||
    (forAssessmentRecordId
      ? (learnerIdByRecordId.get(forAssessmentRecordId) ?? '')
      : '')

  const learnerIdsToFetch = [
    ...new Set(
      citationLearnerIds.flatMap((id) => [
        id,
        recordIdByLearnerId.has(id)
          ? id
          : resolveCitationLearnerId(id, orderedLearnerIds),
      ]),
    ),
  ].filter(Boolean)

  const learners =
    includeNames && learnerIdsToFetch.length > 0
      ? await userPrisma.learner.findMany({
          where: { id: { in: learnerIdsToFetch } },
          select: { id: true, name: true },
        })
      : []

  const nameByLearnerId = new Map(
    learners.map((l) => [l.id, learnerDisplayName(l.name, l.id)]),
  )

  return {
    id: analysis.id,
    assessmentId: analysis.assessmentId,
    status: analysis.status as ThematicAnalysis['status'],
    responsesCount: analysis.responsesCount,
    summary: analysis.summary,
    items: (analysis.items ?? [])
      .map((item) => ({
        id: item.id,
        type: item.type as 'strength' | 'need',
        title: item.title,
        description: item.description,
        order: item.order,
        citations: (item.citations ?? [])
          .map((c) => {
            const learnerIdForLookup = recordIdByLearnerId.has(c.learnerId)
              ? c.learnerId
              : resolveCitationLearnerId(c.learnerId, orderedLearnerIds)

            return {
              id: c.id,
              learnerId: learnerIdForLookup,
              assessmentRecordId:
                recordIdByLearnerId.get(learnerIdForLookup) ?? null,
              learnerName: includeNames
                ? nameByLearnerId.get(learnerIdForLookup) ||
                  `Student ${learnerIdForLookup.slice(0, 8)}`
                : '',
              highlights: c.highlights,
              annotation: c.annotation,
            }
          })
          .filter((c) => {
            if (!scopedLearnerId && !forAssessmentRecordId) return true
            if (scopedLearnerId && c.learnerId === scopedLearnerId) return true
            if (
              forAssessmentRecordId &&
              c.assessmentRecordId === forAssessmentRecordId
            ) {
              return true
            }
            return false
          }),
      }))
      .filter((item) =>
        scopedLearnerId || forAssessmentRecordId
          ? item.citations.length > 0
          : true,
      ),
    createdAt: analysis.createdAt,
    updatedAt: analysis.updatedAt,
  }
}
