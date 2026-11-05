import { HTTPClient, ServiceResponsePromise } from '@/utils/https'
import {
  Service,
  ServiceOptions,
  defaultResponseTransformer,
} from '@/app/shared/services/service'
import { isResultError, Result } from '@/utils/result'
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

export class FeedbackSectionService extends Service {
  async getFeedbackSections(
    params?: GetFeedbackSectionsParams,
    options?: ServiceOptions<FeedbackSection[]>
  ): Promise<Result<FeedbackSection[]>> {
    const result = await getFeedbackSections(this.httpClient, params, options)
    if (isResultError(result)) return result
    return result.data
  }

  async getFeedbackSection(
    params: GetFeedbackSectionParams,
    options?: ServiceOptions<FeedbackSection>,
  ): Promise<Result<FeedbackSection>> {
    const result = await getFeedbackSection(this.httpClient, params, options)
    if (isResultError(result)) return result
    return result.data
  }

  async getFeedbackSectionsByFeedbackId(
    params: GetFeedbackSectionsByFeedbackIdParams,
    options?: ServiceOptions<FeedbackSection[]>,
  ): Promise<Result<FeedbackSection[]>> {
    const result = await getFeedbackSectionsByFeedbackId(this.httpClient, params, options)
    if (isResultError(result)) return result
    return result.data
  }

  async getFeedbackSectionsByAiSuggestionsId(
    params: GetFeedbackSectionsByAiSuggestionsIdParams,
    options?: ServiceOptions<FeedbackSection[]>,
  ): Promise<Result<FeedbackSection[]>> {
    const result = await getFeedbackSectionsByAiSuggestionsId(this.httpClient, params, options)
    if (isResultError(result)) return result
    return result.data
  }

  async createFeedbackSection(
    params: CreateFeedbackSectionParams,
    options?: ServiceOptions<FeedbackSection>,
  ): Promise<Result<FeedbackSection>> {
    const result = await createFeedbackSection(this.httpClient, params, options)
    if (isResultError(result)) return result
    return result.data
  }

  async updateFeedbackSection(
    params: UpdateFeedbackSectionParams,
    options?: ServiceOptions<FeedbackSection>,
  ): Promise<Result<FeedbackSection>> {
    const result = await updateFeedbackSection(this.httpClient, params, options)
    if (isResultError(result)) return result
    return result.data
  }

  async deleteFeedbackSection(
    params: DeleteFeedbackSectionParams,
    options?: ServiceOptions<void>,
  ): Promise<Result<void>> {
    const result = await deleteFeedbackSection(this.httpClient, params, options)
    if (isResultError(result)) return result
    return result.data
  }

  async reorderFeedbackSections(
    params: ReorderFeedbackSectionsParams,
    options?: ServiceOptions<FeedbackSection[]>,
  ): Promise<Result<FeedbackSection[]>> {
    const result = await reorderFeedbackSections(this.httpClient, params, options)
    if (isResultError(result)) return result
    return result.data
  }

  async bulkUpdateFeedbackSections(
    params: BulkUpdateFeedbackSectionsParams,
    options?: ServiceOptions<FeedbackSection[]>,
  ): Promise<Result<FeedbackSection[]>> {
    const result = await bulkUpdateFeedbackSections(this.httpClient, params, options)
    if (isResultError(result)) return result
    return result.data
  }

  async bulkDeleteFeedbackSections(
    params: BulkDeleteFeedbackSectionsParams,
    options?: ServiceOptions<void>,
  ): Promise<Result<void>> {
    const result = await bulkDeleteFeedbackSections(this.httpClient, params, options)
    if (isResultError(result)) return result
    return result.data
  }
}

// HTTP Client Functions
export async function getFeedbackSections(
  httpClient: HTTPClient,
  params?: GetFeedbackSectionsParams,
  options?: ServiceOptions<FeedbackSection[]>,
): ServiceResponsePromise<FeedbackSection[]> {
  const searchParams = new URLSearchParams()
  
  if (params?.filters) {
    const { filters } = params
    if (filters.feedbackId) searchParams.append('feedbackId', filters.feedbackId)
    if (filters.aiSuggestionsId) searchParams.append('aiSuggestionsId', filters.aiSuggestionsId)
    if (filters.type) searchParams.append('type', filters.type)
    if (filters.used !== undefined) searchParams.append('used', String(filters.used))
    if (filters.discarted !== undefined) searchParams.append('discarted', String(filters.discarted))
    if (filters.section) searchParams.append('section', filters.section)
  }
  
  if (params?.orderBy) searchParams.append('orderBy', params.orderBy)
  if (params?.orderDirection) searchParams.append('orderDirection', params.orderDirection)
  if (params?.limit) searchParams.append('limit', String(params.limit))
  if (params?.offset) searchParams.append('offset', String(params.offset))

  const queryString = searchParams.toString()
  const path = queryString ? `/api/feedback-sections?${queryString}` : '/api/feedback-sections'

  return httpClient.get<FeedbackSection[]>({
    path,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

export async function getFeedbackSection(
  httpClient: HTTPClient,
  params: GetFeedbackSectionParams,
  options?: ServiceOptions<FeedbackSection>,
): ServiceResponsePromise<FeedbackSection> {
  return httpClient.get<FeedbackSection>({
    path: `/api/feedback-sections/${params.id}`,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

export async function getFeedbackSectionsByFeedbackId(
  httpClient: HTTPClient,
  params: GetFeedbackSectionsByFeedbackIdParams,
  options?: ServiceOptions<FeedbackSection[]>,
): ServiceResponsePromise<FeedbackSection[]> {
  return httpClient.get<FeedbackSection[]>({
    path: `/api/feedback-sections?feedbackId=${encodeURIComponent(params.feedbackId)}`,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

export async function getFeedbackSectionsByAiSuggestionsId(
  httpClient: HTTPClient,
  params: GetFeedbackSectionsByAiSuggestionsIdParams,
  options?: ServiceOptions<FeedbackSection[]>,
): ServiceResponsePromise<FeedbackSection[]> {
  return httpClient.get<FeedbackSection[]>({
    path: `/api/feedback-sections?aiSuggestionsId=${encodeURIComponent(params.aiSuggestionsId)}`,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

export async function createFeedbackSection(
  httpClient: HTTPClient,
  params: CreateFeedbackSectionParams,
  options?: ServiceOptions<FeedbackSection>,
): ServiceResponsePromise<FeedbackSection> {
  return httpClient.post<FeedbackSection>({
    path: '/api/feedback-sections',
    data: params as unknown as Record<string, unknown>,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

export async function updateFeedbackSection(
  httpClient: HTTPClient,
  params: UpdateFeedbackSectionParams,
  options?: ServiceOptions<FeedbackSection>,
): ServiceResponsePromise<FeedbackSection> {
  return httpClient.patch<FeedbackSection>({
    path: `/api/feedback-sections/${params.id}`,
    data: params.data,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

export async function deleteFeedbackSection(
  httpClient: HTTPClient,
  params: DeleteFeedbackSectionParams,
  options?: ServiceOptions<void>,
): ServiceResponsePromise<void> {
  return httpClient.delete<void>({
    path: `/api/feedback-sections/${params.id}`,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

export async function reorderFeedbackSections(
  httpClient: HTTPClient,
  params: ReorderFeedbackSectionsParams,
  options?: ServiceOptions<FeedbackSection[]>,
): ServiceResponsePromise<FeedbackSection[]> {
  return httpClient.patch<FeedbackSection[]>({
    path: '/api/feedback-sections',
    data: { reorder: params.sections },
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

export async function bulkUpdateFeedbackSections(
  httpClient: HTTPClient,
  params: BulkUpdateFeedbackSectionsParams,
  options?: ServiceOptions<FeedbackSection[]>,
): ServiceResponsePromise<FeedbackSection[]> {
  return httpClient.patch<FeedbackSection[]>({
    path: '/api/feedback-sections',
    data: { sections: params.sections },
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

export async function bulkDeleteFeedbackSections(
  httpClient: HTTPClient,
  params: BulkDeleteFeedbackSectionsParams,
  options?: ServiceOptions<void>,
): ServiceResponsePromise<void> {
  return httpClient.delete<void>({
    path: '/api/feedback-sections',
    data: { ids: params.ids },
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}
