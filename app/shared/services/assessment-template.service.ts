import { HTTPClient, ServiceResponsePromise } from '@/utils/https'
import {
  Service,
  ServiceOptions,
  defaultResponseTransformer,
} from '@/app/shared/services/service'
import { isResultError, Result } from '@/utils/result'
import {
  AssessmentTemplate,
  AssessmentTemplateWithUsage,
  CreateAssessmentTemplateParams,
  DeleteAssessmentTemplateParams,
  DuplicateAssessmentTemplateParams,
  GetAssessmentTemplateParams,
  UpdateAssessmentTemplateParams,
} from '@/types'

export class AssessmentTemplateService extends Service {
  async getAssessmentTemplates(
    options?: ServiceOptions<AssessmentTemplate[]>,
  ): Promise<Result<AssessmentTemplate[]>> {
    const result = await getAssessmentTemplates(this.httpClient, options)
    if (isResultError(result)) return result
    return result.data
  }

  async getAssessmentTemplate(
    params: GetAssessmentTemplateParams,
    options?: ServiceOptions<AssessmentTemplateWithUsage>,
  ): Promise<Result<AssessmentTemplateWithUsage>> {
    const result = await getAssessmentTemplate(this.httpClient, params, options)
    if (isResultError(result)) return result
    return result.data
  }

  async createAssessmentTemplate(
    params: CreateAssessmentTemplateParams,
    options?: ServiceOptions<AssessmentTemplate>,
  ): Promise<Result<AssessmentTemplate>> {
    const result = await createAssessmentTemplate(this.httpClient, params, options)
    if (isResultError(result)) return result
    return result.data
  }

  async updateAssessmentTemplate(
    params: UpdateAssessmentTemplateParams,
    options?: ServiceOptions<AssessmentTemplate>,
  ): Promise<Result<AssessmentTemplate>> {
    const result = await updateAssessmentTemplate(this.httpClient, params, options)
    if (isResultError(result)) return result
    return result.data
  }

  async deleteAssessmentTemplate(
    params: DeleteAssessmentTemplateParams,
    options?: ServiceOptions<void>,
  ): Promise<Result<void>> {
    const result = await deleteAssessmentTemplate(this.httpClient, params, options)
    if (isResultError(result)) return result
    return result.data
  }

  async duplicateAssessmentTemplate(
    params: DuplicateAssessmentTemplateParams,
    options?: ServiceOptions<AssessmentTemplate>,
  ): Promise<Result<AssessmentTemplate>> {
    const result = await duplicateAssessmentTemplate(this.httpClient, params, options)
    if (isResultError(result)) return result
    return result.data
  }
}

export async function getAssessmentTemplates(
  httpClient: HTTPClient,
  options?: ServiceOptions<AssessmentTemplate[]>,
): ServiceResponsePromise<AssessmentTemplate[]> {
  return httpClient.get<AssessmentTemplate[]>({
    path: '/api/assessment-templates',
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

export async function getAssessmentTemplate(
  httpClient: HTTPClient,
  params: GetAssessmentTemplateParams,
  options?: ServiceOptions<AssessmentTemplateWithUsage>,
): ServiceResponsePromise<AssessmentTemplateWithUsage> {
  const { id, cursor, limit } = params
  const searchParams = new URLSearchParams()
  if (cursor) searchParams.set('cursor', cursor)
  if (limit) searchParams.set('limit', limit.toString())

  const path =
    searchParams.size > 0
      ? `/api/assessment-templates/${id}?${searchParams.toString()}`
      : `/api/assessment-templates/${id}`

  return httpClient.get<AssessmentTemplateWithUsage>({
    path,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

export async function createAssessmentTemplate(
  httpClient: HTTPClient,
  params: CreateAssessmentTemplateParams,
  options?: ServiceOptions<AssessmentTemplate>,
): ServiceResponsePromise<AssessmentTemplate> {
  return httpClient.post<AssessmentTemplate>({
    path: '/api/assessment-templates',
    data: { ...params } as Record<string, unknown>,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

export async function updateAssessmentTemplate(
  httpClient: HTTPClient,
  params: UpdateAssessmentTemplateParams,
  options?: ServiceOptions<AssessmentTemplate>,
): ServiceResponsePromise<AssessmentTemplate> {
  return httpClient.put<AssessmentTemplate>({
    path: `/api/assessment-templates/${params.id}`,
    data: params.data,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

export async function deleteAssessmentTemplate(
  httpClient: HTTPClient,
  params: DeleteAssessmentTemplateParams,
  options?: ServiceOptions<void>,
): ServiceResponsePromise<void> {
  return httpClient.delete<void>({
    path: `/api/assessment-templates/${params.id}`,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

export async function duplicateAssessmentTemplate(
  httpClient: HTTPClient,
  params: DuplicateAssessmentTemplateParams,
  options?: ServiceOptions<AssessmentTemplate>,
): ServiceResponsePromise<AssessmentTemplate> {
  return httpClient.post<AssessmentTemplate>({
    path: `/api/assessment-templates/${params.id}/duplicate`,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

