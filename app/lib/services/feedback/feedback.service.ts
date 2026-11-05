import { Result } from '@/utils/result'
import { ServiceOptions } from '../../../shared/services/service'
import { FeedbackService } from '../../../shared/services/feedback.service'
import {
  Feedback,
  GetFeedbackParams,
  GetFeedbacksByAssessmentRecordIdParams,
  CreateFeedbackParams,
  UpdateFeedbackParams,
  DeleteFeedbackParams,
  AppendFeedbackSectionParams,
} from '@/types'

import { httpClient } from '@/lib/service'

export const feedbackService = new FeedbackService(httpClient)

export function getFeedbacks(options?: ServiceOptions<Feedback[]>): Promise<Result<Feedback[]>> {
  return feedbackService.getFeedbacks(options)
}

export function getFeedback(
  params: GetFeedbackParams,
  options?: ServiceOptions<Feedback>,
): Promise<Result<Feedback>> {
  return feedbackService.getFeedback(params, options)
}

export function getFeedbacksByAssessmentRecordId(
  params: GetFeedbacksByAssessmentRecordIdParams,
  options?: ServiceOptions<Feedback[]>,
): Promise<Result<Feedback[]>> {
  return feedbackService.getFeedbacksByAssessmentRecordId(params, options)
}

export function createFeedback(
  params: CreateFeedbackParams,
  options?: ServiceOptions<Feedback>,
): Promise<Result<Feedback>> {
  return feedbackService.createFeedback(params, options)
}

export function updateFeedback(
  params: UpdateFeedbackParams,
  options?: ServiceOptions<Feedback>,
): Promise<Result<Feedback>> {
  return feedbackService.updateFeedback(params, options)
}

export function deleteFeedback(
  params: DeleteFeedbackParams,
  options?: ServiceOptions<void>,
): Promise<Result<void>> {
  return feedbackService.deleteFeedback(params, options)
}

export function appendFeedbackSection(
  params: AppendFeedbackSectionParams,
  options?: ServiceOptions<Feedback>,
): Promise<Result<Feedback>> {
  return feedbackService.appendFeedbackSection(params, options)
}
