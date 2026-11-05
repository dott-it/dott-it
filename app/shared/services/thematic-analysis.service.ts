import { HTTPClient, ServiceResponsePromise } from '@/utils/https'
import type {
  GetThematicAnalysisParams,
  GetThematicHighlightPhrasesParams,
  ThematicHighlightPhrasesResponse,
  TriggerThematicAnalysisParams,
  ThematicAnalysis,
} from '@/types'
import {
  Service,
  ServiceOptions,
  defaultResponseTransformer,
} from '@/app/shared/services/service'
import { isResultError, Result } from '@/utils/result'

function withIncludeNamesQuery(
  path: string,
  includeNames?: boolean,
): string {
  if (!includeNames) return path
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}includeNames=true`
}

export class ThematicAnalysisService extends Service {
  async getThematicAnalysis(
    params: GetThematicAnalysisParams,
    options?: ServiceOptions<ThematicAnalysis | null>,
  ): Promise<Result<ThematicAnalysis | null>> {
    const result = await getThematicAnalysis(this.httpClient, params, options)
    if (isResultError(result)) return result
    return result.data
  }

  async getHighlightPhrases(
    params: GetThematicHighlightPhrasesParams,
    options?: ServiceOptions<ThematicHighlightPhrasesResponse>,
  ): Promise<Result<ThematicHighlightPhrasesResponse>> {
    const result = await getHighlightPhrases(this.httpClient, params, options)
    if (isResultError(result)) return result
    return result.data
  }

  async triggerThematicAnalysis(
    params: TriggerThematicAnalysisParams,
    options?: ServiceOptions<ThematicAnalysis>,
  ): Promise<Result<ThematicAnalysis>> {
    const result = await triggerThematicAnalysis(this.httpClient, params, options)
    if (isResultError(result)) return result
    return result.data
  }
}

export async function getThematicAnalysis(
  httpClient: HTTPClient,
  params: GetThematicAnalysisParams,
  options?: ServiceOptions<ThematicAnalysis | null>,
): ServiceResponsePromise<ThematicAnalysis | null> {
  return httpClient.get<ThematicAnalysis | null>({
    path: withIncludeNamesQuery(
      `/api/thematic-analysis/${params.assessmentId}`,
      params.includeNames,
    ),
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

export async function getHighlightPhrases(
  httpClient: HTTPClient,
  params: GetThematicHighlightPhrasesParams,
  options?: ServiceOptions<ThematicHighlightPhrasesResponse>,
): ServiceResponsePromise<ThematicHighlightPhrasesResponse> {
  return httpClient.get<ThematicHighlightPhrasesResponse>({
    path: `/api/thematic-analysis/${params.assessmentId}/highlights?learnerId=${encodeURIComponent(params.learnerId)}`,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

export async function triggerThematicAnalysis(
  httpClient: HTTPClient,
  params: TriggerThematicAnalysisParams,
  options?: ServiceOptions<ThematicAnalysis>,
): ServiceResponsePromise<ThematicAnalysis> {
  return httpClient.post<ThematicAnalysis>({
    path: withIncludeNamesQuery(
      `/api/thematic-analysis/${params.assessmentId}`,
      params.includeNames,
    ),
    data: {},
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}
