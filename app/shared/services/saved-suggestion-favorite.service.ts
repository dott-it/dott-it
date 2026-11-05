import type { HTTPClient } from '@/utils/https'
import type { ServiceOptions } from '@/app/shared/services/service'
import { defaultResponseTransformer } from '@/app/shared/services/service'
import type {
  CreateSavedSuggestionFavoriteBody,
  SavedSuggestionFavorite,
} from '@/types'

export async function getSavedSuggestionFavorites(
  httpClient: HTTPClient,
  options?: ServiceOptions<SavedSuggestionFavorite[]>,
) {
  return httpClient.get<SavedSuggestionFavorite[]>({
    path: '/api/saved-suggestion-favorites',
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

export async function createSavedSuggestionFavorite(
  httpClient: HTTPClient,
  body: CreateSavedSuggestionFavoriteBody,
  options?: ServiceOptions<SavedSuggestionFavorite>,
) {
  return httpClient.post<SavedSuggestionFavorite>({
    path: '/api/saved-suggestion-favorites',
    data: body as unknown as Record<string, unknown>,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

export async function deleteSavedSuggestionFavorite(
  httpClient: HTTPClient,
  params: { id: string },
  options?: ServiceOptions<void>,
) {
  return httpClient.delete<void>({
    path: `/api/saved-suggestion-favorites/${encodeURIComponent(params.id)}`,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}
