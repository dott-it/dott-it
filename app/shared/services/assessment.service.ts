import { HTTPClient, ServiceResponsePromise } from '@/utils/https'
import {
  CreateAssessmentParams,
  DeleteAssessmentParams,
  GetAssessmentParams,
  GetAssessmentsParams,
  UpdateAssessmentParams,
  CreateAssessmentResponse,
  DeleteAssessmentResponse,
} from '@/types'
import {
  Service,
  ServiceOptions,
  defaultResponseTransformer,
} from '@/app/shared/services/service'
import { isResultError, Result } from '@/utils/result'
import { ActiveAssessment } from '@/types'

export class AssessmentService extends Service {
  async getAssessments(
    params?: GetAssessmentsParams,
    options?: ServiceOptions<ActiveAssessment[]>,
  ): Promise<Result<ActiveAssessment[]>> {
    const result = await getAssessments(this.httpClient, params, options)
    if (isResultError(result)) return result

    return result.data
  }
  async getAssessment(
    params: GetAssessmentParams,
    options?: ServiceOptions<ActiveAssessment>,
  ): Promise<Result<ActiveAssessment>> {
    const result = await getAssessment(this.httpClient, params, options)
    if (isResultError(result)) return result

    return result.data
  }

  async createAssessment(
    params: CreateAssessmentParams,
    options?: ServiceOptions<CreateAssessmentResponse>,
  ): Promise<Result<CreateAssessmentResponse>> {
    const result = await createAssessment(this.httpClient, params, options)
    if (isResultError(result)) return result

    return result.data
  }

  async updateAssessment(
    params: UpdateAssessmentParams,
    options?: ServiceOptions<ActiveAssessment>,
  ): Promise<Result<ActiveAssessment>> {
    const result = await updateAssessment(this.httpClient, params, options)
    if (isResultError(result)) return result

    return result.data
  }

  async deleteAssessment(
    params: DeleteAssessmentParams,
    options?: ServiceOptions<DeleteAssessmentResponse>,
  ): Promise<Result<DeleteAssessmentResponse>> {
    const result = await deleteAssessment(this.httpClient, params, options)
    if (isResultError(result)) return result

    return result.data
  }
}

/**
 * Get all assessments
 */
export async function getAssessments(
  httpClient: HTTPClient,
  params?: GetAssessmentsParams,
  options?: ServiceOptions<ActiveAssessment[]>,
): ServiceResponsePromise<ActiveAssessment[]> {
  const search = new URLSearchParams()
  if (params?.schoolYear) {
    search.set('schoolYear', params.schoolYear)
  }
  const query = search.toString()
  return httpClient.get<ActiveAssessment[]>({
    path: query ? `/api/assessments?${query}` : '/api/assessments',
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

/**
 * Get a single assessment by ID
 */
export async function getAssessment(
  httpClient: HTTPClient,
  params: GetAssessmentParams,
  options?: ServiceOptions<ActiveAssessment>,
): ServiceResponsePromise<ActiveAssessment> {
  return httpClient.get<ActiveAssessment>({
    path: `/api/assessments/${params.id}`,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

export async function createAssessment(
  httpClient: HTTPClient,
  params: CreateAssessmentParams,
  options?: ServiceOptions<CreateAssessmentResponse>,
): ServiceResponsePromise<CreateAssessmentResponse> {
  return httpClient.post<CreateAssessmentResponse>({
    path: '/api/assessments/create',
    data: { ...params } as Record<string, unknown>,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

export async function updateAssessment(
  httpClient: HTTPClient,
  params: UpdateAssessmentParams,
  options?: ServiceOptions<ActiveAssessment>,
): ServiceResponsePromise<ActiveAssessment> {
  return httpClient.patch<ActiveAssessment>({
    path: `/api/assessments/${params.id}`,
    data: params.data,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

export async function deleteAssessment(
  httpClient: HTTPClient,
  params: DeleteAssessmentParams,
  options?: ServiceOptions<DeleteAssessmentResponse>,
): ServiceResponsePromise<DeleteAssessmentResponse> {
  return httpClient.delete<DeleteAssessmentResponse>({
    path: `/api/assessments/${params.id}`,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}
