import { Prisma } from '@prisma/assessmentDB'
import { NextResponse } from 'next/server'
import { findAssessmentsEligibleForFirstThematicRun } from '@/lib/thematic-analysis/first-run-eligibility'
import {
  RunThematicAnalysisError,
  runThematicAnalysis,
} from '@/lib/thematic-analysis/run-thematic-analysis'
import { refreshAllStudentResponsesCounts } from '@/lib/thematic-analysis/student-responses-count'
import { prisma } from '@/lib/prisma'

export const maxDuration = 300

const RUN_BUFFER_MS = 10_000

function parseMaxAssessments(): number | undefined {
  const raw = process.env.THEMATIC_CRON_MAX_ASSESSMENTS
  if (!raw) return undefined
  const parsed = Number.parseInt(raw, 10)
  if (!Number.isFinite(parsed) || parsed < 1) return undefined
  return parsed
}

function isCronAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const maxRunMs = maxDuration * 1000 - RUN_BUFFER_MS
  const maxAssessments = parseMaxAssessments()

  let responseCountsUpdated = 0
  try {
    responseCountsUpdated = await refreshAllStudentResponsesCounts(prisma)
  } catch (error) {
    console.error('Cron thematic analysis: failed to refresh studentResponsesCount', error)
  }

  let eligible: string[]
  try {
    eligible = await findAssessmentsEligibleForFirstThematicRun()
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P1001') {
        console.error(
          'Cron thematic analysis: database unreachable (P1001)',
          error,
        )
        return NextResponse.json(
          {
            error: 'Database unavailable',
            message:
              'Cannot reach the database server. With Neon, open the project dashboard to wake a suspended database, then retry. Verify DATABASE_URL and restart the dev server after env changes.',
          },
          { status: 503 },
        )
      }
      if (error.code === 'P2024') {
        console.error(
          'Cron thematic analysis: connection pool timeout (P2024)',
          error,
        )
        return NextResponse.json(
          {
            error: 'Database connection pool exhausted',
            message:
              'Timed out waiting for a database connection. Restart the dev server or reduce concurrent DB load. If this persists on Neon, use the pooler URL with connection_limit=1 in DATABASE_URL.',
          },
          { status: 503 },
        )
      }
    }
    throw error
  }
  const toProcess =
    maxAssessments === undefined
      ? eligible
      : eligible.slice(0, maxAssessments)

  const processed: string[] = []
  const deferred: string[] = []
  const failed: Array<{ assessmentId: string; error: string }> = []

  for (let i = 0; i < toProcess.length; i++) {
    const assessmentId = toProcess[i]

    if (Date.now() - startTime > maxRunMs) {
      deferred.push(...toProcess.slice(i))
      break
    }

    try {
      await runThematicAnalysis(assessmentId)
      processed.push(assessmentId)
    } catch (error) {
      let message = 'Unknown error'
      if (error instanceof RunThematicAnalysisError) {
        message = error.message
      } else if (error instanceof Error) {
        message = error.message
      }
      failed.push({ assessmentId, error: message })
    }
  }

  if (maxAssessments !== undefined && eligible.length > maxAssessments) {
    deferred.push(...eligible.slice(maxAssessments))
  }

  return NextResponse.json({
    eligibleCount: eligible.length,
    processed,
    deferred,
    failed,
    responseCountsUpdated,
  })
}
