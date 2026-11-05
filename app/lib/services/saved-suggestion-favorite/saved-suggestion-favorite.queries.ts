import { successOrThrowAsync } from '@/utils/result'
import { router } from 'react-query-kit'
import { auth } from '../queries'
import {
  getSavedSuggestionFavorites,
  createSavedSuggestionFavorite,
  deleteSavedSuggestionFavorite,
} from './saved-suggestion-favorite.service'
import type {
  CreateSavedSuggestionFavoriteBody,
  SavedSuggestionFavorite,
} from '@/types'

export const savedSuggestionFavoriteQueries = router(
  [...auth.getKey(), 'saved-suggestion-favorites'],
  {
    list: router.query<SavedSuggestionFavorite[]>({
      fetcher: () => successOrThrowAsync(getSavedSuggestionFavorites()),
    }),
    create: router.mutation<SavedSuggestionFavorite, CreateSavedSuggestionFavoriteBody>({
      mutationFn: (body) => successOrThrowAsync(createSavedSuggestionFavorite(body)),
    }),
    delete: router.mutation<void, { id: string }>({
      mutationFn: (params) => successOrThrowAsync(deleteSavedSuggestionFavorite(params)),
    }),
  },
)
