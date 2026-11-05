import { router } from 'react-query-kit'
import { auth } from '../queries'
import { successOrThrowAsync } from '@/utils/result'
import {
  getThematicAnalysis,
  getThematicHighlightPhrases,
  triggerThematicAnalysis,
} from './thematic-analysis.service'
import type {
  ThematicAnalysis,
  GetThematicAnalysisParams,
  GetThematicHighlightPhrasesParams,
  ThematicHighlightPhrasesResponse,
  TriggerThematicAnalysisParams,
} from '@/types'

const PROCESSING_POLL_MS = 3000

export const thematicAnalysisQueries = router(
  [...auth.getKey(), 'thematic-analysis'],
  {
    getThematicAnalysis: router.query<
      ThematicAnalysis | null,
      GetThematicAnalysisParams
    >({
      fetcher: (params) => successOrThrowAsync(getThematicAnalysis(params)),
    }),
    getHighlightPhrases: router.query<
      ThematicHighlightPhrasesResponse,
      GetThematicHighlightPhrasesParams
    >({
      fetcher: (params) =>
        successOrThrowAsync(getThematicHighlightPhrases(params)),
    }),
    triggerAnalysis: router.mutation<
      ThematicAnalysis,
      TriggerThematicAnalysisParams
    >({
      mutationFn: (params) =>
        successOrThrowAsync(triggerThematicAnalysis(params)),
    }),
  },
)

export function thematicAnalysisProcessingRefetchInterval(
  status: ThematicAnalysis['status'] | undefined,
): number | false {
  return status === 'processing' ? PROCESSING_POLL_MS : false
}
