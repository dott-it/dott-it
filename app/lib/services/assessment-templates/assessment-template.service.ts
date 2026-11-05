import { Result } from '@/utils/result'
import { ServiceOptions } from '@/app/shared/services/service'
import { AssessmentTemplateService } from '@/app/shared/services/assessment-template.service'
import {
  AssessmentTemplate,
  AssessmentTemplateWithUsage,
  CreateAssessmentTemplateParams,
  DeleteAssessmentTemplateParams,
  DuplicateAssessmentTemplateParams,
  GetAssessmentTemplateParams,
  UpdateAssessmentTemplateParams,
} from '@/types'
import { httpClient } from '@/lib/service'

export const assessmentTemplateService = new AssessmentTemplateService(httpClient)

export function getAssessmentTemplates(
  options?: ServiceOptions<AssessmentTemplate[]>,
): Promise<Result<AssessmentTemplate[]>> {
  return assessmentTemplateService.getAssessmentTemplates(options)
}

export function getAssessmentTemplate(
  params: GetAssessmentTemplateParams,
  options?: ServiceOptions<AssessmentTemplateWithUsage>,
): Promise<Result<AssessmentTemplateWithUsage>> {
  return assessmentTemplateService.getAssessmentTemplate(params, options)
}

export function createAssessmentTemplate(
  params: CreateAssessmentTemplateParams,
  options?: ServiceOptions<AssessmentTemplate>,
): Promise<Result<AssessmentTemplate>> {
  return assessmentTemplateService.createAssessmentTemplate(params, options)
}

export function updateAssessmentTemplate(
  params: UpdateAssessmentTemplateParams,
  options?: ServiceOptions<AssessmentTemplate>,
): Promise<Result<AssessmentTemplate>> {
  return assessmentTemplateService.updateAssessmentTemplate(params, options)
}

export function deleteAssessmentTemplate(
  params: DeleteAssessmentTemplateParams,
  options?: ServiceOptions<void>,
): Promise<Result<void>> {
  return assessmentTemplateService.deleteAssessmentTemplate(params, options)
}

export function duplicateAssessmentTemplate(
  params: DuplicateAssessmentTemplateParams,
  options?: ServiceOptions<AssessmentTemplate>,
): Promise<Result<AssessmentTemplate>> {
  return assessmentTemplateService.duplicateAssessmentTemplate(params, options)
}

