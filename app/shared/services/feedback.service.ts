import { HTTPClient, ServiceResponsePromise } from '@/utils/https'
import {
  Service,
  ServiceOptions,
  defaultResponseTransformer,
} from '@/app/shared/services/service'
import { isResultError, Result } from '@/utils/result'
import {
  Feedback,
  GetFeedbackParams,
  GetFeedbacksByAssessmentRecordIdParams,
  CreateFeedbackParams,
  UpdateFeedbackParams,
  DeleteFeedbackParams,
  AppendFeedbackSectionParams,
} from '@/types'

export class FeedbackService extends Service {
  async getFeedbacks(options?: ServiceOptions<Feedback[]>): Promise<Result<Feedback[]>> {
    const result = await getFeedbacks(this.httpClient, options)
    if (isResultError(result)) return result
    return result.data
  }

  async getFeedback(
    params: GetFeedbackParams,
    options?: ServiceOptions<Feedback>,
  ): Promise<Result<Feedback>> {
    const result = await getFeedback(this.httpClient, params, options)
    if (isResultError(result)) return result
    return result.data
  }

  async getFeedbacksByAssessmentRecordId(
    params: GetFeedbacksByAssessmentRecordIdParams,
    options?: ServiceOptions<Feedback[]>,
  ): Promise<Result<Feedback[]>> {
    const result = await getFeedbacksByAssessmentRecordId(this.httpClient, params, options)
    if (isResultError(result)) return result
    return result.data
  }

  async createFeedback(
    params: CreateFeedbackParams,
    options?: ServiceOptions<Feedback>,
  ): Promise<Result<Feedback>> {
    const result = await createFeedback(this.httpClient, params, options)
    if (isResultError(result)) return result
    return result.data
  }

  async updateFeedback(
    params: UpdateFeedbackParams,
    options?: ServiceOptions<Feedback>,
  ): Promise<Result<Feedback>> {
    const result = await updateFeedback(this.httpClient, params, options)
    if (isResultError(result)) return result
    return result.data
  }

  async deleteFeedback(
    params: DeleteFeedbackParams,
    options?: ServiceOptions<void>,
  ): Promise<Result<void>> {
    const result = await deleteFeedback(this.httpClient, params, options)
    if (isResultError(result)) return result
    return result.data
  }

  async appendFeedbackSection(
    params: AppendFeedbackSectionParams,
    options?: ServiceOptions<Feedback>,
  ): Promise<Result<Feedback>> {
    const result = await postAppendFeedbackSection(this.httpClient, params, options)
    if (isResultError(result)) return result
    return result.data
  }
}

export async function getFeedbacks(
  httpClient: HTTPClient,
  options?: ServiceOptions<Feedback[]>,
): ServiceResponsePromise<Feedback[]> {
  return httpClient.get<Feedback[]>({
    path: '/api/feedback',
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

export async function getFeedback(
  httpClient: HTTPClient,
  params: GetFeedbackParams,
  options?: ServiceOptions<Feedback>,
): ServiceResponsePromise<Feedback> {
  return httpClient.get<Feedback>({
    path: `/api/feedback/${params.id}`,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

export async function getFeedbacksByAssessmentRecordId(
  httpClient: HTTPClient,
  params: GetFeedbacksByAssessmentRecordIdParams,
  options?: ServiceOptions<Feedback[]>,
): ServiceResponsePromise<Feedback[]> {
  return httpClient.get<Feedback[]>({
    path: `/api/feedback?assessmentRecordId=${encodeURIComponent(params.assessmentRecordId)}`,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

export async function createFeedback(
  httpClient: HTTPClient,
  params: CreateFeedbackParams,
  options?: ServiceOptions<Feedback>,
): ServiceResponsePromise<Feedback> {
  return httpClient.post<Feedback>({
    path: '/api/feedback',
    data: params as unknown as Record<string, unknown>,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

export async function updateFeedback(
  httpClient: HTTPClient,
  params: UpdateFeedbackParams,
  options?: ServiceOptions<Feedback>,
): ServiceResponsePromise<Feedback> {
  return httpClient.patch<Feedback>({
    path: `/api/feedback/${params.id}`,
    data: params.data,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

export async function deleteFeedback(
  httpClient: HTTPClient,
  params: DeleteFeedbackParams,
  options?: ServiceOptions<void>,
): ServiceResponsePromise<void> {
  return httpClient.delete<void>({
    path: `/api/feedback/${params.id}`,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

export async function postAppendFeedbackSection(
  httpClient: HTTPClient,
  params: AppendFeedbackSectionParams,
  options?: ServiceOptions<Feedback>,
): ServiceResponsePromise<Feedback> {
  return httpClient.post<Feedback>({
    path: `/api/feedback/${encodeURIComponent(params.feedbackId)}/sections/add`,
    data: {
      type: params.type,
      section: params.section,
      content: params.content,
      aiSuggestionsId: params.aiSuggestionsId,
      originalSectionId: params.originalSectionId,
      used: params.used,
      discarted: params.discarted,
    },
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}
