import { Result } from '@/utils/result'
import { ServiceOptions } from '../../../shared/services/service'
import { FeedbackSectionService } from '../../../shared/services/feedback-section.service'
import {
  FeedbackSection,
  GetFeedbackSectionParams,
  GetFeedbackSectionsByFeedbackIdParams,
  GetFeedbackSectionsByAiSuggestionsIdParams,
  GetFeedbackSectionsParams,
  CreateFeedbackSectionParams,
  UpdateFeedbackSectionParams,
  DeleteFeedbackSectionParams,
  ReorderFeedbackSectionsParams,
  BulkUpdateFeedbackSectionsParams,
  BulkDeleteFeedbackSectionsParams,
} from '@/app/types/api/feedback-section'

import { httpClient } from '@/lib/service'

export const feedbackSectionService = new FeedbackSectionService(httpClient)

export function getFeedbackSections(
  params?: GetFeedbackSectionsParams,
  options?: ServiceOptions<FeedbackSection[]>
): Promise<Result<FeedbackSection[]>> {
  return feedbackSectionService.getFeedbackSections(params, options)
}

export function getFeedbackSection(
  params: GetFeedbackSectionParams,
  options?: ServiceOptions<FeedbackSection>,
): Promise<Result<FeedbackSection>> {
  return feedbackSectionService.getFeedbackSection(params, options)
}

export function getFeedbackSectionsByFeedbackId(
  params: GetFeedbackSectionsByFeedbackIdParams,
  options?: ServiceOptions<FeedbackSection[]>,
): Promise<Result<FeedbackSection[]>> {
  return feedbackSectionService.getFeedbackSectionsByFeedbackId(params, options)
}

export function getFeedbackSectionsByAiSuggestionsId(
  params: GetFeedbackSectionsByAiSuggestionsIdParams,
  options?: ServiceOptions<FeedbackSection[]>,
): Promise<Result<FeedbackSection[]>> {
  return feedbackSectionService.getFeedbackSectionsByAiSuggestionsId(params, options)
}

export function createFeedbackSection(
  params: CreateFeedbackSectionParams,
  options?: ServiceOptions<FeedbackSection>,
): Promise<Result<FeedbackSection>> {
  return feedbackSectionService.createFeedbackSection(params, options)
}

export function updateFeedbackSection(
  params: UpdateFeedbackSectionParams,
  options?: ServiceOptions<FeedbackSection>,
): Promise<Result<FeedbackSection>> {
  return feedbackSectionService.updateFeedbackSection(params, options)
}

export function deleteFeedbackSection(
  params: DeleteFeedbackSectionParams,
  options?: ServiceOptions<void>,
): Promise<Result<void>> {
  return feedbackSectionService.deleteFeedbackSection(params, options)
}

export function reorderFeedbackSections(
  params: ReorderFeedbackSectionsParams,
  options?: ServiceOptions<FeedbackSection[]>,
): Promise<Result<FeedbackSection[]>> {
  return feedbackSectionService.reorderFeedbackSections(params, options)
}

export function bulkUpdateFeedbackSections(
  params: BulkUpdateFeedbackSectionsParams,
  options?: ServiceOptions<FeedbackSection[]>,
): Promise<Result<FeedbackSection[]>> {
  return feedbackSectionService.bulkUpdateFeedbackSections(params, options)
}

export function bulkDeleteFeedbackSections(
  params: BulkDeleteFeedbackSectionsParams,
  options?: ServiceOptions<void>,
): Promise<Result<void>> {
  return feedbackSectionService.bulkDeleteFeedbackSections(params, options)
}
