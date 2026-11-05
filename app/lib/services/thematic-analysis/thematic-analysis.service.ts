import { Result } from '@/utils/result'
import { ThematicAnalysisService } from '@/app/shared/services/thematic-analysis.service'
import { ServiceOptions } from '@/app/shared/services/service'
import type {
  ThematicAnalysis,
  GetThematicAnalysisParams,
  GetThematicHighlightPhrasesParams,
  ThematicHighlightPhrasesResponse,
  TriggerThematicAnalysisParams,
} from '@/types'
import { httpClient } from '@/lib/service'

export const thematicAnalysisService = new ThematicAnalysisService(httpClient)

export function getThematicAnalysis(
  params: GetThematicAnalysisParams,
  options?: ServiceOptions<ThematicAnalysis | null>,
): Promise<Result<ThematicAnalysis | null>> {
  return thematicAnalysisService.getThematicAnalysis(params, options)
}

export function getThematicHighlightPhrases(
  params: GetThematicHighlightPhrasesParams,
  options?: ServiceOptions<ThematicHighlightPhrasesResponse>,
): Promise<Result<ThematicHighlightPhrasesResponse>> {
  return thematicAnalysisService.getHighlightPhrases(params, options)
}

export function triggerThematicAnalysis(
  params: TriggerThematicAnalysisParams,
  options?: ServiceOptions<ThematicAnalysis>,
): Promise<Result<ThematicAnalysis>> {
  return thematicAnalysisService.triggerThematicAnalysis(params, options)
}
