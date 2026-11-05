import { HTTPClient, ServiceResponsePromise } from '@/utils/https'
import {
  AssessmentRecord,
  GetAssessmentRecordParams,
  GetAssessmentRecordsByAssessmentParams,
  CreateAssessmentRecordParams,
  UpdateAssessmentRecordParams,
  DeleteAssessmentRecordParams,
} from '@/types'
import { ServiceOptions, defaultResponseTransformer } from '@/app/shared/services/service'
import { Service } from '@/app/shared/services/service'
import { isResultError, Result } from '@/utils/result'

export class AssessmentRecordsService extends Service {
  async getAssessmentRecords(
    options?: ServiceOptions<AssessmentRecord[]>,
  ): Promise<Result<AssessmentRecord[]>> {
    const result = await getAssessmentRecords(this.httpClient, options)
    if (isResultError(result)) return result

    return result.data
  }
  async getAssessmentRecord(
    params: GetAssessmentRecordParams,
    options?: ServiceOptions<AssessmentRecord>,
  ): Promise<Result<AssessmentRecord>> {
    const result = await getAssessmentRecord(this.httpClient, params, options)
    if (isResultError(result)) return result

    return result.data
  }
  async getAssessmentRecordsByAssessment(
    params: GetAssessmentRecordsByAssessmentParams,
    options?: ServiceOptions<AssessmentRecord[]>,
  ): Promise<Result<AssessmentRecord[]>> {
    const result = await getAssessmentRecordsByAssessment(this.httpClient, params, options)
    if (isResultError(result)) return result

    return result.data
  }
  async createAssessmentRecord(
    params: CreateAssessmentRecordParams,
    options?: ServiceOptions<AssessmentRecord>,
  ): Promise<Result<AssessmentRecord>> {
    const result = await createAssessmentRecord(this.httpClient, params, options)
    if (isResultError(result)) return result

    return result.data
  }
  async updateAssessmentRecord(
    params: UpdateAssessmentRecordParams,
    options?: ServiceOptions<AssessmentRecord>,
  ): Promise<Result<AssessmentRecord>> {
    const result = await updateAssessmentRecord(this.httpClient, params, options)
    if (isResultError(result)) return result

    return result.data
  }
  async deleteAssessmentRecord(
    params: DeleteAssessmentRecordParams,
    options?: ServiceOptions<void>,
  ): Promise<Result<void>> {
    const result = await deleteAssessmentRecord(this.httpClient, params, options)
    if (isResultError(result)) return result

    return result.data
  }
}

/**
 * Get all assessment records
 */
export async function getAssessmentRecords(
  httpClient: HTTPClient,
  options?: ServiceOptions<AssessmentRecord[]>,
): ServiceResponsePromise<AssessmentRecord[]> {
  return httpClient.get<AssessmentRecord[]>({
    path: '/api/assessment-records',
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

/**
 * Get a single assessment record by ID
 */
export async function getAssessmentRecord(
  httpClient: HTTPClient,
  params: GetAssessmentRecordParams,
  options?: ServiceOptions<AssessmentRecord>,
): ServiceResponsePromise<AssessmentRecord> {
  return httpClient.get<AssessmentRecord>({
    path: `/api/assessment-records/${params.id}`,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

/**
 * Get assessment records by assessment ID
 */
export async function getAssessmentRecordsByAssessment(
  httpClient: HTTPClient,
  params: GetAssessmentRecordsByAssessmentParams,
  options?: ServiceOptions<AssessmentRecord[]>,
): ServiceResponsePromise<AssessmentRecord[]> {
  return httpClient.get<AssessmentRecord[]>({
    path: `/api/assessment-records?assessmentId=${params.assessmentId}`,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

/**
 * Create a new assessment record
 */
export async function createAssessmentRecord(
  httpClient: HTTPClient,
  params: CreateAssessmentRecordParams,
  options?: ServiceOptions<AssessmentRecord>,
): ServiceResponsePromise<AssessmentRecord> {
  return httpClient.post<AssessmentRecord>({
    path: '/api/assessment-records',
    data: params as unknown as Record<string, unknown>,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

/**
 * Update an assessment record
 */
export async function updateAssessmentRecord(
  httpClient: HTTPClient,
  params: UpdateAssessmentRecordParams,
  options?: ServiceOptions<AssessmentRecord>,
): ServiceResponsePromise<AssessmentRecord> {
  return httpClient.patch<AssessmentRecord>({
    path: `/api/assessment-records/${params.id}`,
    data: params.data,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

/**
 * Delete an assessment record
 */
export async function deleteAssessmentRecord(
  httpClient: HTTPClient,
  params: DeleteAssessmentRecordParams,
  options?: ServiceOptions<void>,
): ServiceResponsePromise<void> {
  return httpClient.delete<void>({
    path: `/api/assessment-records/${params.id}`,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}
