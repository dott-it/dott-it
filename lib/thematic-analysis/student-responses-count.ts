import { PrismaClient } from '@prisma/assessmentDB'

/**
 * Count AssessmentRecords that have at least one studentAnswer,
 * matching the thematic-analysis eligibility notion of "responses in".
 */
export async function countStudentResponsesWithAnswers(
  prisma: PrismaClient,
  assessmentId: string,
): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(DISTINCT ar.id)::int AS count
    FROM "AssessmentRecord" ar
    INNER JOIN "studentAnswer" sa ON sa."assessmentRecordId" = ar.id
    WHERE ar."assessmentId" = ${assessmentId}
  `
  return rows[0]?.count ?? 0
}

/**
 * Persist the denormalized studentResponsesCount for one assessment.
 */
export async function refreshStudentResponsesCount(
  prisma: PrismaClient,
  assessmentId: string,
): Promise<number> {
  const count = await countStudentResponsesWithAnswers(prisma, assessmentId)
  await prisma.assessment.update({
    where: { id: assessmentId },
    data: { studentResponsesCount: count },
  })
  return count
}

/**
 * Refresh studentResponsesCount for all assessments that have records
 * (or any assessment — used by the thematic CRON).
 * Returns the number of assessments updated.
 */
export async function refreshAllStudentResponsesCounts(
  prisma: PrismaClient,
): Promise<number> {
  const result = await prisma.$executeRaw`
    UPDATE "Assessment" AS a
    SET "studentResponsesCount" = COALESCE(counts.cnt, 0)
    FROM (
      SELECT
        ar."assessmentId",
        COUNT(DISTINCT ar.id)::int AS cnt
      FROM "AssessmentRecord" ar
      INNER JOIN "studentAnswer" sa ON sa."assessmentRecordId" = ar.id
      GROUP BY ar."assessmentId"
    ) AS counts
    WHERE a.id = counts."assessmentId"
      AND a."studentResponsesCount" IS DISTINCT FROM counts.cnt
  `

  // Also zero out assessments that no longer have answered records but still show a count.
  const zeroed = await prisma.$executeRaw`
    UPDATE "Assessment" AS a
    SET "studentResponsesCount" = 0
    WHERE a."studentResponsesCount" > 0
      AND NOT EXISTS (
        SELECT 1
        FROM "AssessmentRecord" ar
        INNER JOIN "studentAnswer" sa ON sa."assessmentRecordId" = ar.id
        WHERE ar."assessmentId" = a.id
      )
  `

  return Number(result) + Number(zeroed)
}
