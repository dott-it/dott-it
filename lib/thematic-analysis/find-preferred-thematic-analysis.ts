import { prisma } from '@/lib/prisma'
import { THEMATIC_PROCESSING_STALE_MS } from './first-run-eligibility'

const thematicAnalysisInclude = {
  items: {
    orderBy: { order: 'asc' as const },
    include: { citations: true },
  },
}

/**
 * Prefer active processing → latest completed → latest failed.
 * Avoids hiding a good completed analysis behind a newer failed re-run.
 */
export async function findPreferredThematicAnalysis(assessmentId: string) {
  const staleCutoff = new Date(Date.now() - THEMATIC_PROCESSING_STALE_MS)

  const processing = await prisma.thematicAnalysis.findFirst({
    where: {
      assessmentId,
      status: 'processing',
      updatedAt: { gt: staleCutoff },
    },
    orderBy: { createdAt: 'desc' },
    include: thematicAnalysisInclude,
  })
  if (processing) return processing

  const completed = await prisma.thematicAnalysis.findFirst({
    where: {
      assessmentId,
      status: 'completed',
    },
    orderBy: { createdAt: 'desc' },
    include: thematicAnalysisInclude,
  })
  if (completed) return completed

  return prisma.thematicAnalysis.findFirst({
    where: {
      assessmentId,
      status: 'failed',
    },
    orderBy: { createdAt: 'desc' },
    include: thematicAnalysisInclude,
  })
}
