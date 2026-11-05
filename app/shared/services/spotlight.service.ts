import { HTTPClient, ServiceResponsePromise } from '@/utils/https'
import type {
  DismissSpotlightParams,
  DismissSpotlightResponse,
  SpotlightCardsResponse,
} from '@/types'
import {
  Service,
  ServiceOptions,
  defaultResponseTransformer,
} from '@/app/shared/services/service'
import { isResultError, Result } from '@/utils/result'

export class SpotlightService extends Service {
  async getSpotlightCards(
    options?: ServiceOptions<SpotlightCardsResponse>,
  ): Promise<Result<SpotlightCardsResponse>> {
    const result = await getSpotlightCards(this.httpClient, options)
    if (isResultError(result)) return result
    return result.data
  }

  async dismissSpotlight(
    params: DismissSpotlightParams,
    options?: ServiceOptions<DismissSpotlightResponse>,
  ): Promise<Result<DismissSpotlightResponse>> {
    const result = await dismissSpotlight(this.httpClient, params, options)
    if (isResultError(result)) return result
    return result.data
  }
}

export async function getSpotlightCards(
  httpClient: HTTPClient,
  options?: ServiceOptions<SpotlightCardsResponse>,
): ServiceResponsePromise<SpotlightCardsResponse> {
  return httpClient.get<SpotlightCardsResponse>({
    path: '/api/spotlight',
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

export async function dismissSpotlight(
  httpClient: HTTPClient,
  params: DismissSpotlightParams,
  options?: ServiceOptions<DismissSpotlightResponse>,
): ServiceResponsePromise<DismissSpotlightResponse> {
  return httpClient.post<DismissSpotlightResponse>({
    path: `/api/spotlight/${params.assessmentId}/dismiss`,
    data: {},
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}
