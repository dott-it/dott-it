import { z } from 'zod'
import {
  TEMPLATE_GRADE_LEVEL_OPTIONS,
  TEMPLATE_SUBJECT_OPTIONS,
  TEMPLATE_TYPE_OPTIONS,
} from '@/components/backoffice/assessment-templates/assessment-template-options'

export const createTemplateSchema = z
  .object({
    title: z.string().min(1, 'Template title is required'),
    type: z.enum(TEMPLATE_TYPE_OPTIONS, { message: 'Template type is required' }),
    subject: z.enum(TEMPLATE_SUBJECT_OPTIONS, { message: 'Subject is required' }),
    description: z.string().optional(),
    curriculumTeachersEdition: z.string().optional(),
    curriculumAnswerKey: z.string().optional(),
    gradeLevel: z.enum(TEMPLATE_GRADE_LEVEL_OPTIONS).optional().or(z.literal('')),
    unitCode: z.string().min(1, 'Unit is required'),
    lessonNumber: z.string().min(1, 'Lesson is required'),
  })
  .superRefine((value, ctx) => {
    const lesson = Number.parseInt(value.lessonNumber, 10)
    if (!Number.isInteger(lesson) || lesson < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Lesson is required',
        path: ['lessonNumber'],
      })
    }
  })

export type CreateTemplateFormValues = z.infer<typeof createTemplateSchema>

/** UI draft state — empty selects use `''` until the user picks a value. */
export type CreateTemplateFormState = {
  title: string
  type: (typeof TEMPLATE_TYPE_OPTIONS)[number] | ''
  subject: (typeof TEMPLATE_SUBJECT_OPTIONS)[number] | ''
  description: string
  curriculumTeachersEdition: string
  curriculumAnswerKey: string
  gradeLevel: (typeof TEMPLATE_GRADE_LEVEL_OPTIONS)[number] | ''
  unitCode: string
  lessonNumber: string
}

export const emptyCreateTemplateFormState: CreateTemplateFormState = {
  title: '',
  type: '',
  subject: '',
  description: '',
  curriculumTeachersEdition: '',
  curriculumAnswerKey: '',
  gradeLevel: '',
  unitCode: '',
  lessonNumber: '',
}
