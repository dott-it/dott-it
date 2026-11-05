import { Result } from '@/utils/result'
import { AssessmentRecordsService } from '../../../shared/services/assessment-records.service'
import { ServiceOptions } from '../../../shared/services/service'
import {
  AssessmentRecord,
  GetAssessmentRecordParams,
  GetAssessmentRecordsByAssessmentParams,
  CreateAssessmentRecordParams,
  UpdateAssessmentRecordParams,
  DeleteAssessmentRecordParams,
} from '@/types'

import { httpClient } from '@/lib/service'

export const assessmentRecordsService = new AssessmentRecordsService(httpClient)

export function getAssessmentRecords(
  options?: ServiceOptions<AssessmentRecord[]>,
): Promise<Result<AssessmentRecord[]>> {
  return assessmentRecordsService.getAssessmentRecords(options)
}

export function getAssessmentRecord(
  params: GetAssessmentRecordParams,
  options?: ServiceOptions<AssessmentRecord>,
): Promise<Result<AssessmentRecord>> {
  return assessmentRecordsService.getAssessmentRecord(params, options)
}

export function getAssessmentRecordsByAssessment(
  params: GetAssessmentRecordsByAssessmentParams,
  options?: ServiceOptions<AssessmentRecord[]>,
): Promise<Result<AssessmentRecord[]>> {
  return assessmentRecordsService.getAssessmentRecordsByAssessment(params, options)
}

export function createAssessmentRecord(
  params: CreateAssessmentRecordParams,
  options?: ServiceOptions<AssessmentRecord>,
): Promise<Result<AssessmentRecord>> {
  return assessmentRecordsService.createAssessmentRecord(params, options)
}

export function updateAssessmentRecord(
  params: UpdateAssessmentRecordParams,
  options?: ServiceOptions<AssessmentRecord>,
): Promise<Result<AssessmentRecord>> {
  return assessmentRecordsService.updateAssessmentRecord(params, options)
}

export function deleteAssessmentRecord(
  params: DeleteAssessmentRecordParams,
  options?: ServiceOptions<void>,
): Promise<Result<void>> {
  return assessmentRecordsService.deleteAssessmentRecord(params, options)
}
