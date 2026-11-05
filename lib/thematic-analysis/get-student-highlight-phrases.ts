import { prisma } from '@/lib/prisma'
import type { ThematicAnalysisItemType } from '@/types'
import type { ThematicHighlightPhrase } from '@/app/lib/utils/thematic-analysis-response-highlights'

/**
 * Loads highlight phrases for a single student from the latest completed analysis.
 * Avoids returning other students' citations or display names.
 */
export async function getStudentHighlightPhrases(params: {
  assessmentId: string
  learnerId: string
}): Promise<ThematicHighlightPhrase[]> {
  const { assessmentId, learnerId } = params
  if (!learnerId) return []

  const analysis = await prisma.thematicAnalysis.findFirst({
    where: {
      assessmentId,
      status: 'completed',
    },
    orderBy: { createdAt: 'desc' },
    select: {
      items: {
        select: {
          type: true,
          citations: {
            where: { learnerId },
            select: { highlights: true },
          },
        },
      },
    },
  })

  if (!analysis?.items?.length) return []

  const phrases: ThematicHighlightPhrase[] = []
  for (const item of analysis.items) {
    const type: ThematicAnalysisItemType =
      item.type === 'strength' ? 'strength' : 'need'
    for (const citation of item.citations) {
      for (const highlight of citation.highlights) {
        const phrase = typeof highlight === 'string' ? highlight.trim() : ''
        if (phrase.length > 0) {
          phrases.push({ phrase, type })
        }
      }
    }
  }

  return phrases
}
