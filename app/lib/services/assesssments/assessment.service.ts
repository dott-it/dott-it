import { Result } from '@/utils/result'
import { AssessmentService } from '@/app/shared/services/assessment.service'
import { ServiceOptions } from '@/app/shared/services/service'
import {
  ActiveAssessment,
  CreateAssessmentParams,
  CreateAssessmentResponse,
  DeleteAssessmentParams,
  DeleteAssessmentResponse,
  GetAssessmentParams,
  GetAssessmentsParams,
  UpdateAssessmentParams,
} from '@/types'
import { httpClient } from '@/lib/service'

export const assessmentService = new AssessmentService(httpClient)

export function getAssessment(
  params: GetAssessmentParams,
  options?: ServiceOptions<ActiveAssessment>,
): Promise<Result<ActiveAssessment>> {
  return assessmentService.getAssessment(params, options)
}

export function getAssessments(
  params?: GetAssessmentsParams,
  options?: ServiceOptions<ActiveAssessment[]>,
): Promise<Result<ActiveAssessment[]>> {
  return assessmentService.getAssessments(params, options)
}

export function createAssessment(
  params: CreateAssessmentParams,
  options?: ServiceOptions<CreateAssessmentResponse>,
): Promise<Result<CreateAssessmentResponse>> {
  return assessmentService.createAssessment(params, options)
}

export function updateAssessment(
  params: UpdateAssessmentParams,
  options?: ServiceOptions<ActiveAssessment>,
): Promise<Result<ActiveAssessment>> {
  return assessmentService.updateAssessment(params, options)
}

export function deleteAssessment(
  params: DeleteAssessmentParams,
  options?: ServiceOptions<DeleteAssessmentResponse>,
): Promise<Result<DeleteAssessmentResponse>> {
  return assessmentService.deleteAssessment(params, options)
}
