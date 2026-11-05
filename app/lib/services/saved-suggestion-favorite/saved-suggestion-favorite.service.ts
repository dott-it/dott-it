import { isResultError, type Result } from '@/utils/result'
import type { ServiceOptions } from '@/app/shared/services/service'
import {
  getSavedSuggestionFavorites as getSavedSuggestionFavoritesShared,
  createSavedSuggestionFavorite as createSavedSuggestionFavoriteShared,
  deleteSavedSuggestionFavorite as deleteSavedSuggestionFavoriteShared,
} from '@/app/shared/services/saved-suggestion-favorite.service'
import type {
  CreateSavedSuggestionFavoriteBody,
  SavedSuggestionFavorite,
} from '@/types'
import { httpClient } from '@/lib/service'

export async function getSavedSuggestionFavorites(
  options?: ServiceOptions<SavedSuggestionFavorite[]>,
): Promise<Result<SavedSuggestionFavorite[]>> {
  const result = await getSavedSuggestionFavoritesShared(httpClient, options)
  if (isResultError(result)) return result
  return result.data
}

export async function createSavedSuggestionFavorite(
  body: CreateSavedSuggestionFavoriteBody,
  options?: ServiceOptions<SavedSuggestionFavorite>,
): Promise<Result<SavedSuggestionFavorite>> {
  const result = await createSavedSuggestionFavoriteShared(httpClient, body, options)
  if (isResultError(result)) return result
  return result.data
}

export async function deleteSavedSuggestionFavorite(
  params: { id: string },
  options?: ServiceOptions<void>,
): Promise<Result<void>> {
  const result = await deleteSavedSuggestionFavoriteShared(httpClient, params, options)
  if (isResultError(result)) return result
  return result.data
}
