import { prisma } from '@/lib/prisma'

export const FIRST_THEMATIC_RUN_MIN_RESPONSES = 10
export const FIRST_THEMATIC_RUN_IDLE_MS = 3 * 60 * 60 * 1000

/** Aligns with cron maxDuration (300s) + RUN_BUFFER_MS (10s). */
export const THEMATIC_PROCESSING_STALE_MS = 310_000
export const THEMATIC_PROCESSING_STALE_SECONDS = THEMATIC_PROCESSING_STALE_MS / 1000

export function isEligibleForFirstThematicRun(input: {
  responseCount: number
  lastSubmissionAt: Date | null
  hasBlockingThematicAnalysis: boolean
  hasActiveProcessingThematicAnalysis?: boolean
  now?: Date
}): boolean {
  if (input.hasBlockingThematicAnalysis) return false
  if (input.hasActiveProcessingThematicAnalysis) return false
  if (input.responseCount < FIRST_THEMATIC_RUN_MIN_RESPONSES) return false
  if (!input.lastSubmissionAt) return false

  const now = input.now ?? new Date()
  return (
    now.getTime() - input.lastSubmissionAt.getTime() >=
    FIRST_THEMATIC_RUN_IDLE_MS
  )
}

export async function findAssessmentsEligibleForFirstThematicRun(): Promise<
  string[]
> {
  const idleCutoff = new Date(Date.now() - FIRST_THEMATIC_RUN_IDLE_MS)
  const processingStaleCutoff = new Date(
    Date.now() - THEMATIC_PROCESSING_STALE_MS,
  )

  // Single query avoids N+1 round-trips that exhaust Prisma's connection pool (P2024).
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT stats."assessmentId" AS id
    FROM (
      SELECT
        ar."assessmentId",
        COUNT(DISTINCT ar.id)::int AS response_count,
        MAX(sa."createdAt") AS last_submission_at
      FROM "AssessmentRecord" ar
      INNER JOIN "studentAnswer" sa ON sa."assessmentRecordId" = ar.id
      GROUP BY ar."assessmentId"
      HAVING COUNT(DISTINCT ar.id) >= ${FIRST_THEMATIC_RUN_MIN_RESPONSES}
    ) stats
    INNER JOIN "Assessment" a ON a.id = stats."assessmentId"
    WHERE NOT EXISTS (
      SELECT 1
      FROM "ThematicAnalysis" ta
      WHERE ta."assessmentId" = a.id
      AND (
        ta.status = 'completed'
        OR (
          ta.status = 'processing'
          AND ta."updatedAt" > ${processingStaleCutoff}
        )
      )
    )
    AND stats.last_submission_at <= ${idleCutoff}
  `

  return rows.map((row) => row.id)
}
