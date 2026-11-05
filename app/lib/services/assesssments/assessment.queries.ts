import { router } from 'react-query-kit'
import { auth } from '../queries'
import { successOrThrowAsync } from '@/utils/result'
import {
  getAssessment,
  getAssessments,
  createAssessment,
  updateAssessment,
  deleteAssessment,
} from './assessment.service'
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

export const assessmentQueries = router([...auth.getKey(), 'assessments'], {
  getAssessment: router.query<ActiveAssessment, GetAssessmentParams>({
    fetcher: (params) => successOrThrowAsync(getAssessment(params)),
  }),
  getAssessments: router.query<ActiveAssessment[], GetAssessmentsParams | void>({
    fetcher: (params) => successOrThrowAsync(getAssessments(params ?? undefined)),
  }),
  createAssessment: router.mutation<CreateAssessmentResponse, CreateAssessmentParams>({
    mutationFn: (params) => successOrThrowAsync(createAssessment(params)),
  }),
  updateAssessment: router.mutation<ActiveAssessment, UpdateAssessmentParams>({
    mutationFn: (params) => successOrThrowAsync(updateAssessment(params)),
  }),
  deleteAssessment: router.mutation<DeleteAssessmentResponse, DeleteAssessmentParams>({
    mutationFn: (params) => successOrThrowAsync(deleteAssessment(params)),
  }),
})
