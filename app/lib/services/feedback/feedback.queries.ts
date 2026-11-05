import { successOrThrowAsync } from '@/utils/result'
import { router } from 'react-query-kit'
import { auth } from '../queries'
import {
  getFeedback,
  getFeedbacks,
  getFeedbacksByAssessmentRecordId,
  createFeedback,
  updateFeedback,
  deleteFeedback,
  appendFeedbackSection,
} from './feedback.service'
import {
  Feedback,
  GetFeedbackParams,
  GetFeedbacksByAssessmentRecordIdParams,
  CreateFeedbackParams,
  UpdateFeedbackParams,
  DeleteFeedbackParams,
  AppendFeedbackSectionParams,
} from '../../../types/api/feedback.api'

export const feedbackQueries = router([...auth.getKey(), 'feedback'], {
  getFeedback: router.query<Feedback, GetFeedbackParams>({
    fetcher: (params) => successOrThrowAsync(getFeedback(params)),
  }),
  getFeedbacks: router.query<Feedback[]>({
    fetcher: () => successOrThrowAsync(getFeedbacks()),
  }),
  getFeedbacksByAssessmentRecordId: router.query<
    Feedback[],
    GetFeedbacksByAssessmentRecordIdParams
  >({
    fetcher: (params) => successOrThrowAsync(getFeedbacksByAssessmentRecordId(params)),
  }),
  createFeedback: router.mutation<Feedback, CreateFeedbackParams>({
    mutationFn: (params): Promise<Feedback> => successOrThrowAsync(createFeedback(params)),
  }),
  updateFeedback: router.mutation<Feedback, UpdateFeedbackParams>({
    mutationFn: (params): Promise<Feedback> => successOrThrowAsync(updateFeedback(params)),
  }),
  deleteFeedback: router.mutation<void, DeleteFeedbackParams>({
    mutationFn: (params) => successOrThrowAsync(deleteFeedback(params)),
  }),
  appendFeedbackSection: router.mutation<Feedback, AppendFeedbackSectionParams>({
    mutationFn: (params) => successOrThrowAsync(appendFeedbackSection(params)),
  }),
})
