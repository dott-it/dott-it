import { successOrThrowAsync } from '@/utils/result'
import { router } from 'react-query-kit'
import { auth } from '../queries'
import { 
  getFeedbackSection,
  getFeedbackSections,
  getFeedbackSectionsByFeedbackId,
  getFeedbackSectionsByAiSuggestionsId,
  createFeedbackSection,
  updateFeedbackSection,
  deleteFeedbackSection,
  reorderFeedbackSections,
  bulkUpdateFeedbackSections,
  bulkDeleteFeedbackSections,
} from './feedback-section.service'
import {
  FeedbackSection,
  GetFeedbackSectionParams,
  GetFeedbackSectionsParams,
  GetFeedbackSectionsByFeedbackIdParams,
  GetFeedbackSectionsByAiSuggestionsIdParams,
  CreateFeedbackSectionParams,
  UpdateFeedbackSectionParams,
  DeleteFeedbackSectionParams,
  ReorderFeedbackSectionsParams,
  BulkUpdateFeedbackSectionsParams,
  BulkDeleteFeedbackSectionsParams,
} from '@/app/types/api/feedback-section'

export const feedbackSectionQueries = router([...auth.getKey(), 'feedback-section'], {
  getFeedbackSection: router.query<FeedbackSection, GetFeedbackSectionParams>({
    fetcher: (params) => successOrThrowAsync(getFeedbackSection(params)),
  }),
  getFeedbackSections: router.query<FeedbackSection[], GetFeedbackSectionsParams>({
    fetcher: (params) => successOrThrowAsync(getFeedbackSections(params)),
  }),
  getFeedbackSectionsByFeedbackId: router.query<
    FeedbackSection[],
    GetFeedbackSectionsByFeedbackIdParams
  >({
    fetcher: (params) => successOrThrowAsync(getFeedbackSectionsByFeedbackId(params)),
  }),
  getFeedbackSectionsByAiSuggestionsId: router.query<
    FeedbackSection[],
    GetFeedbackSectionsByAiSuggestionsIdParams
  >({
    fetcher: (params) => successOrThrowAsync(getFeedbackSectionsByAiSuggestionsId(params)),
  }),
  createFeedbackSection: router.mutation<FeedbackSection, CreateFeedbackSectionParams>({
    mutationFn: (params) => successOrThrowAsync(createFeedbackSection(params)),
  }),
  updateFeedbackSection: router.mutation<FeedbackSection, UpdateFeedbackSectionParams>({
    mutationFn: (params) => successOrThrowAsync(updateFeedbackSection(params)),
  }),
  deleteFeedbackSection: router.mutation<void, DeleteFeedbackSectionParams>({
    mutationFn: (params) => successOrThrowAsync(deleteFeedbackSection(params)),
  }),
  reorderFeedbackSections: router.mutation<FeedbackSection[], ReorderFeedbackSectionsParams>({
    mutationFn: (params) => successOrThrowAsync(reorderFeedbackSections(params)),
  }),
  bulkUpdateFeedbackSections: router.mutation<FeedbackSection[], BulkUpdateFeedbackSectionsParams>({
    mutationFn: (params) => successOrThrowAsync(bulkUpdateFeedbackSections(params)),
  }),
  bulkDeleteFeedbackSections: router.mutation<void, BulkDeleteFeedbackSectionsParams>({
    mutationFn: (params) => successOrThrowAsync(bulkDeleteFeedbackSections(params)),
  }),
})
