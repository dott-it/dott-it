import { HTTPClient, ServiceResponsePromise } from '@/utils/https';

import { ServiceOptions, defaultResponseTransformer } from '@/app/shared/services/service';
import { Service } from '@/app/shared/services/service';
import { isResultError, Result } from '@/utils/result';
import { CreateStudentAnswerParams, DeleteStudentAnswerParams, GetStudentAnswerParams, GetStudentAnswersParams, RegenerateAiFeedbackParams, UpdateStudentAnswerParams } from '@/app/types/api/student-answer.api';
import { StudentAnswer } from '@/app/types';

export class StudentAnswerService extends Service {
  async getStudentAnswers(
    params: GetStudentAnswersParams,
    options?: ServiceOptions<StudentAnswer[]>,
  ): Promise<Result<StudentAnswer[]>> {
    const result = await getStudentAnswers(this.httpClient, params, options);
    if (isResultError(result)) return result;
    return result.data;
  }

  async getStudentAnswer(
    params: GetStudentAnswerParams,
    options?: ServiceOptions<StudentAnswer>,
  ): Promise<Result<StudentAnswer>> {
    const result = await getStudentAnswer(this.httpClient, params, options);
    if (isResultError(result)) return result;
    return result.data;
  }

  async regenerateAiFeedback(
    params: RegenerateAiFeedbackParams,
    options?: ServiceOptions<StudentAnswer>,
  ): Promise<Result<StudentAnswer>> {
    const result = await regenerateAiFeedback(this.httpClient, params, options);
    if (isResultError(result)) return result;
    return result.data;
  }

  async createStudentAnswer(
    params: CreateStudentAnswerParams,
    options?: ServiceOptions<StudentAnswer>,
  ): Promise<Result<StudentAnswer>> {
    const result = await createStudentAnswer(this.httpClient, params, options);
    if (isResultError(result)) return result;
    return result.data;
  }

  async updateStudentAnswer(
    params: UpdateStudentAnswerParams,
    options?: ServiceOptions<StudentAnswer>,
  ): Promise<Result<StudentAnswer>> {
    const result = await updateStudentAnswer(this.httpClient, params, options);
    if (isResultError(result)) return result;
    return result.data;
  }

  async deleteStudentAnswer(
    params: DeleteStudentAnswerParams,
    options?: ServiceOptions<void>,
  ): Promise<Result<void>> {
    const result = await deleteStudentAnswer(this.httpClient, params, options);
    if (isResultError(result)) return result;
    return result.data;
  }
}

/**
 * Get student answers by assessment record ID
 */
export async function getStudentAnswers(
  httpClient: HTTPClient,
  params: GetStudentAnswersParams,
  options?: ServiceOptions<StudentAnswer[]>,
): ServiceResponsePromise<StudentAnswer[]> {
  return httpClient.get<StudentAnswer[]>({
    path: `/api/student-answers?assessmentRecordId=${params.assessmentRecordId}`,
    responseTransformer: defaultResponseTransformer,
    ...options,
  });
}

/**
 * Get a single student answer by ID
 */
export async function getStudentAnswer(
  httpClient: HTTPClient,
  params: GetStudentAnswerParams,
  options?: ServiceOptions<StudentAnswer>,
): ServiceResponsePromise<StudentAnswer> {
  return httpClient.get<StudentAnswer>({
    path: `/api/student-answers/${params.id}`,
    responseTransformer: defaultResponseTransformer,
    ...options,
  });
}

/**
 * Regenerate AI feedback for a student answer
 */
export async function regenerateAiFeedback(
  httpClient: HTTPClient,
  params: RegenerateAiFeedbackParams,
  options?: ServiceOptions<StudentAnswer>,
): ServiceResponsePromise<StudentAnswer> {
  return httpClient.post<StudentAnswer>({
    path: `/api/student-answers/${params.studentAnswerId}/regenerate-feedback`,
    data: {},
    responseTransformer: defaultResponseTransformer,
    ...options,
  });
}

/**
 * Create a new student answer
 */
export async function createStudentAnswer(
  httpClient: HTTPClient,
  params: CreateStudentAnswerParams,
  options?: ServiceOptions<StudentAnswer>,
): ServiceResponsePromise<StudentAnswer> {
  return httpClient.post<StudentAnswer>({
    path: '/api/student-answers',
    data: params as unknown as Record<string, unknown>,
    responseTransformer: defaultResponseTransformer,
    ...options,
  });
}

/**
 * Update a student answer
 */
export async function updateStudentAnswer(
  httpClient: HTTPClient,
  params: UpdateStudentAnswerParams,
  options?: ServiceOptions<StudentAnswer>,
): ServiceResponsePromise<StudentAnswer> {
  return httpClient.patch<StudentAnswer>({
    path: `/api/student-answers/${params.id}`,
    data: params.data,
    responseTransformer: defaultResponseTransformer,
    ...options,
  });
}

/**
 * Delete a student answer
 */
export async function deleteStudentAnswer(
  httpClient: HTTPClient,
  params: DeleteStudentAnswerParams,
  options?: ServiceOptions<void>,
): ServiceResponsePromise<void> {
  return httpClient.delete<void>({
    path: `/api/student-answers/${params.id}`,
    responseTransformer: defaultResponseTransformer,
    ...options,
  });
}
