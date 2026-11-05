import { router } from 'react-query-kit'
import { auth } from '../queries'
import { successOrThrowAsync } from '@/utils/result'
import { dismissSpotlight, getSpotlightCards } from './spotlight.service'
import type {
  DismissSpotlightParams,
  DismissSpotlightResponse,
  SpotlightCardsResponse,
} from '@/types'

export const spotlightQueries = router([...auth.getKey(), 'spotlight'], {
  getSpotlightCards: router.query<SpotlightCardsResponse, void>({
    fetcher: () => successOrThrowAsync(getSpotlightCards()),
  }),
  dismissSpotlight: router.mutation<
    DismissSpotlightResponse,
    DismissSpotlightParams
  >({
    mutationFn: (params) => successOrThrowAsync(dismissSpotlight(params)),
  }),
})
