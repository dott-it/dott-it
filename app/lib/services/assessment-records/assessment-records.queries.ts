import { router } from 'react-query-kit'
import { auth } from '../queries'
import { successOrThrowAsync } from '@/utils/result'
import {
  getAssessmentRecords,
  getAssessmentRecord,
  getAssessmentRecordsByAssessment,
  createAssessmentRecord,
  updateAssessmentRecord,
  deleteAssessmentRecord,
} from './assessment-records.service'
import {
  GetAssessmentRecordParams,
  GetAssessmentRecordsByAssessmentParams,
  CreateAssessmentRecordParams,
  UpdateAssessmentRecordParams,
  DeleteAssessmentRecordParams,
} from '../../../types/api/assessment.api'

export const assessmentRecordsQueries = router([...auth.getKey(), 'assessment-records'], {
  getAssessmentRecords: router.query({
    fetcher: () => successOrThrowAsync(getAssessmentRecords()),
  }),
  getAssessmentRecord: router.query({
    fetcher: (params: GetAssessmentRecordParams) =>
      successOrThrowAsync(getAssessmentRecord(params)),
  }),
  getAssessmentRecordsByAssessment: router.query({
    fetcher: (params: GetAssessmentRecordsByAssessmentParams) =>
      successOrThrowAsync(getAssessmentRecordsByAssessment(params)),
  }),
  createAssessmentRecord: router.mutation({
    mutationFn: (params: CreateAssessmentRecordParams) =>
      successOrThrowAsync(createAssessmentRecord(params)),
  }),
  updateAssessmentRecord: router.mutation({
    mutationFn: (params: UpdateAssessmentRecordParams) =>
      successOrThrowAsync(updateAssessmentRecord(params)),
  }),
  deleteAssessmentRecord: router.mutation({
    mutationFn: (params: DeleteAssessmentRecordParams) =>
      successOrThrowAsync(deleteAssessmentRecord(params)),
  }),
})
