import { router } from 'react-query-kit'
import { auth } from '../queries'
import { successOrThrowAsync } from '@/utils/result'
import {
  getAssessmentTemplates,
  getAssessmentTemplate,
  createAssessmentTemplate,
  updateAssessmentTemplate,
  deleteAssessmentTemplate,
  duplicateAssessmentTemplate,
} from './assessment-template.service'
import {
  AssessmentTemplate,
  AssessmentTemplateWithUsage,
  CreateAssessmentTemplateParams,
  DeleteAssessmentTemplateParams,
  DuplicateAssessmentTemplateParams,
  GetAssessmentTemplateParams,
  UpdateAssessmentTemplateParams,
} from '@/types'

export const assessmentTemplateQueries = router([...auth.getKey(), 'assessment-templates'], {
  list: router.query<AssessmentTemplate[]>({
    fetcher: () => successOrThrowAsync(getAssessmentTemplates()),
  }),
  detail: router.query<AssessmentTemplateWithUsage, GetAssessmentTemplateParams>({
    fetcher: (params) => successOrThrowAsync(getAssessmentTemplate(params)),
  }),
  create: router.mutation<AssessmentTemplate, CreateAssessmentTemplateParams>({
    mutationFn: (params) => successOrThrowAsync(createAssessmentTemplate(params)),
  }),
  update: router.mutation<AssessmentTemplate, UpdateAssessmentTemplateParams>({
    mutationFn: (params) => successOrThrowAsync(updateAssessmentTemplate(params)),
  }),
  delete: router.mutation<void, DeleteAssessmentTemplateParams>({
    mutationFn: (params) => successOrThrowAsync(deleteAssessmentTemplate(params)),
  }),
  duplicate: router.mutation<AssessmentTemplate, DuplicateAssessmentTemplateParams>({
    mutationFn: (params) => successOrThrowAsync(duplicateAssessmentTemplate(params)),
  }),
})



