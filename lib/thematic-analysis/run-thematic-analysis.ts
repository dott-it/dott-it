import { prisma } from '@/lib/prisma'
import { formatInstructions } from '@/app/(dashboard)/backoffice/assessments/utils/format-instructions'
import { generateThematicAnalysis } from '@/lib/langsmith/thematic-analysis'
import { resolveCitationLearnerId } from '@/lib/langsmith/thematic-analysis-utils'
import type { Answers, ThematicAnalysisReviewerInstructions } from '@/types'
import { THEMATIC_PROCESSING_STALE_MS } from './first-run-eligibility'
import type { ThematicAnalysisWithRelations } from './format-thematic-analysis-response'

export const THEMATIC_MANUAL_RUN_COOLDOWN_MS = 15 * 60_000
/** Max analysis rows created per assessment in a rolling 24h window for manual POST. */
export const THEMATIC_MANUAL_DAILY_MAX_RUNS = 5

export type RunThematicAnalysisErrorCode =
  | 'assessment_not_found'
  | 'no_responses'
  | 'llm_failed'
  | 'already_in_progress'
  | 'rate_limited'

export type RunThematicAnalysisOptions = {
  enforceManualCooldown?: boolean
}

export type ThematicAnalysisRunStart = {
  analysis: ThematicAnalysisWithRelations
  orderedLearnerIds: string[]
  studentResponses: Array<{
    id: string
    answers: Array<{ title: string; value: string }>
  }>
  reviewer: ThematicAnalysisReviewerInstructions
}

export class RunThematicAnalysisError extends Error {
  readonly code: RunThematicAnalysisErrorCode

  constructor(code: RunThematicAnalysisErrorCode, message: string) {
    super(message)
    this.name = 'RunThematicAnalysisError'
    this.code = code
  }
}

function isLlmOutputEmpty(
  output: Awaited<ReturnType<typeof generateThematicAnalysis>>,
): boolean {
  return output.thematic_analysis.length === 0 && !output.summary.trim()
}

async function reconcileStaleProcessingRows(
  assessmentId: string,
  tx: Pick<typeof prisma, 'thematicAnalysis'> = prisma,
): Promise<void> {
  const staleCutoff = new Date(Date.now() - THEMATIC_PROCESSING_STALE_MS)

  await tx.thematicAnalysis.updateMany({
    where: {
      assessmentId,
      status: 'processing',
      updatedAt: { lte: staleCutoff },
    },
    data: { status: 'failed' },
  })
}

async function assertNoActiveProcessingRun(
  assessmentId: string,
  tx: Pick<typeof prisma, 'thematicAnalysis'> = prisma,
): Promise<void> {
  const staleCutoff = new Date(Date.now() - THEMATIC_PROCESSING_STALE_MS)

  const inProgress = await tx.thematicAnalysis.findFirst({
    where: {
      assessmentId,
      status: 'processing',
      updatedAt: { gt: staleCutoff },
    },
  })

  if (inProgress) {
    throw new RunThematicAnalysisError(
      'already_in_progress',
      'Analysis already in progress',
    )
  }
}

async function assertManualRunCooldown(
  assessmentId: string,
  tx: Pick<typeof prisma, 'thematicAnalysis'>,
): Promise<void> {
  const cooldownCutoff = new Date(Date.now() - THEMATIC_MANUAL_RUN_COOLDOWN_MS)

  const recentCompleted = await tx.thematicAnalysis.findFirst({
    where: {
      assessmentId,
      status: 'completed',
      createdAt: { gt: cooldownCutoff },
    },
  })

  if (recentCompleted) {
    throw new RunThematicAnalysisError(
      'rate_limited',
      'Please wait before running analysis again',
    )
  }

  const dayCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const runsInLastDay = await tx.thematicAnalysis.count({
    where: {
      assessmentId,
      createdAt: { gt: dayCutoff },
    },
  })

  if (runsInLastDay >= THEMATIC_MANUAL_DAILY_MAX_RUNS) {
    throw new RunThematicAnalysisError(
      'rate_limited',
      'Daily analysis limit reached for this assessment',
    )
  }
}

async function createProcessingAnalysis(
  assessmentId: string,
  responsesCount: number,
  options?: RunThematicAnalysisOptions,
) {
  return prisma.$transaction(
    async (tx) => {
      await reconcileStaleProcessingRows(assessmentId, tx)
      await assertNoActiveProcessingRun(assessmentId, tx)

      if (options?.enforceManualCooldown) {
        await assertManualRunCooldown(assessmentId, tx)
      }

      const created = await tx.thematicAnalysis.create({
        data: {
          assessmentId,
          status: 'processing',
          responsesCount,
        },
      })

      return {
        ...created,
        items: [],
      } as ThematicAnalysisWithRelations
    },
    { isolationLevel: 'Serializable' },
  )
}

async function markAnalysisFailed(analysisId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Drop any partially written themes (citations cascade via onDelete).
    await tx.thematicAnalysisItem.deleteMany({
      where: { thematicAnalysisId: analysisId },
    })
    await tx.thematicAnalysis.update({
      where: { id: analysisId },
      data: { status: 'failed' },
    })
  })
}

function mapSerializableConflict(error: unknown): never {
  if (error instanceof RunThematicAnalysisError) {
    throw error
  }
  const prismaCode =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
      ? (error as { code: string }).code
      : ''
  // Serializable write conflicts (P2034) mean another run won the race.
  if (prismaCode === 'P2034') {
    throw new RunThematicAnalysisError(
      'already_in_progress',
      'Analysis already in progress',
    )
  }
  throw error
}

/**
 * Validates inputs and creates a processing row (cooldown/budget inside the
 * serializable transaction). Returns everything needed to finish the LLM run.
 */
export async function startThematicAnalysis(
  assessmentId: string,
  options?: RunThematicAnalysisOptions,
): Promise<ThematicAnalysisRunStart> {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: { template: true },
  })

  if (!assessment) {
    throw new RunThematicAnalysisError(
      'assessment_not_found',
      'Assessment not found',
    )
  }

  const records = await prisma.assessmentRecord.findMany({
    where: { assessmentId },
    include: {
      studentAnswers: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })

  const recordsWithAnswers = records.filter((r) => r.studentAnswers.length > 0)

  if (recordsWithAnswers.length === 0) {
    throw new RunThematicAnalysisError(
      'no_responses',
      'No student responses available',
    )
  }

  let analysis: ThematicAnalysisWithRelations
  try {
    analysis = await createProcessingAnalysis(
      assessmentId,
      recordsWithAnswers.length,
      options,
    )
  } catch (error) {
    mapSerializableConflict(error)
  }

  const studentResponses = recordsWithAnswers.map((r) => {
    const latestAnswer = r.studentAnswers[0]
    const answers = Array.isArray(latestAnswer.answers)
      ? (latestAnswer.answers as unknown as Answers[])
      : []
    return {
      id: r.learnerId,
      answers: answers.map((a) => ({ title: a.title, value: a.value })),
    }
  })

  const orderedLearnerIds = studentResponses.map((s) => s.id)

  const reviewer: ThematicAnalysisReviewerInstructions = {
    curriculumTeachersEdition:
      assessment.template.curriculumTeachersEdition ?? '',
    curriculumAnswerKey: assessment.template.curriculumAnswerKey ?? '',
    customInstructions: formatInstructions(assessment.instructions ?? ''),
  }

  return {
    analysis,
    orderedLearnerIds,
    studentResponses,
    reviewer,
  }
}

/**
 * Runs the LLM and persists themes for a processing analysis started earlier.
 */
export async function continueThematicAnalysis(
  started: ThematicAnalysisRunStart,
): Promise<ThematicAnalysisWithRelations> {
  const { analysis, orderedLearnerIds, studentResponses, reviewer } = started

  let llmOutput
  try {
    llmOutput = await generateThematicAnalysis(reviewer, studentResponses)
  } catch (llmError) {
    console.error('LLM generation failed:', llmError)
    await markAnalysisFailed(analysis.id)
    throw new RunThematicAnalysisError(
      'llm_failed',
      'Thematic analysis generation failed',
    )
  }

  if (isLlmOutputEmpty(llmOutput)) {
    await markAnalysisFailed(analysis.id)
    throw new RunThematicAnalysisError(
      'llm_failed',
      'Thematic analysis generation failed',
    )
  }

  try {
    // Persist all themes + flip to completed atomically so a mid-loop failure
    // cannot leave orphan items on a failed (or still-processing) row.
    // Citation learnerName is intentionally empty at rest — real names are
    // resolved at read time only when includeNames + salt allow it.
    const completed = await prisma.$transaction(async (tx) => {
      for (let i = 0; i < llmOutput.thematic_analysis.length; i++) {
        const theme = llmOutput.thematic_analysis[i]
        await tx.thematicAnalysisItem.create({
          data: {
            thematicAnalysisId: analysis.id,
            type: theme.type,
            title: theme.title,
            description: theme.description,
            order: i,
            citations: {
              create: theme.citations.map((c) => {
                const canonical = resolveCitationLearnerId(
                  c.student_id,
                  orderedLearnerIds,
                )
                return {
                  learnerId: canonical,
                  learnerName: '',
                  highlights: c.highlights,
                  annotation: c.annotation,
                }
              }),
            },
          },
        })
      }

      return tx.thematicAnalysis.update({
        where: { id: analysis.id },
        data: {
          status: 'completed',
          summary: llmOutput.summary,
        },
        include: {
          items: {
            orderBy: { order: 'asc' },
            include: { citations: true },
          },
        },
      })
    })

    return completed as ThematicAnalysisWithRelations
  } catch (persistError) {
    console.error('Failed to persist thematic analysis items:', persistError)
    await markAnalysisFailed(analysis.id)
    throw new RunThematicAnalysisError(
      'llm_failed',
      'Thematic analysis generation failed',
    )
  }
}

/** Full sync run (cron and callers that await completion). */
export async function runThematicAnalysis(
  assessmentId: string,
  options?: RunThematicAnalysisOptions,
): Promise<ThematicAnalysisWithRelations> {
  const started = await startThematicAnalysis(assessmentId, options)
  return continueThematicAnalysis(started)
}
