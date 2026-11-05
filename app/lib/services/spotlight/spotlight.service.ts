import { Result } from '@/utils/result'
import { SpotlightService } from '@/app/shared/services/spotlight.service'
import { ServiceOptions } from '@/app/shared/services/service'
import type {
  DismissSpotlightParams,
  DismissSpotlightResponse,
  SpotlightCardsResponse,
} from '@/types'
import { httpClient } from '@/lib/service'

export const spotlightService = new SpotlightService(httpClient)

export function getSpotlightCards(
  options?: ServiceOptions<SpotlightCardsResponse>,
): Promise<Result<SpotlightCardsResponse>> {
  return spotlightService.getSpotlightCards(options)
}

export function dismissSpotlight(
  params: DismissSpotlightParams,
  options?: ServiceOptions<DismissSpotlightResponse>,
): Promise<Result<DismissSpotlightResponse>> {
  return spotlightService.dismissSpotlight(params, options)
}
