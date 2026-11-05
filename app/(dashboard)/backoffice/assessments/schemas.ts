import { z } from 'zod'
import { isValidSchoolYear } from '@/lib/school-year'

export const createAssessmentSchema = z.object({
  templateId: z.string().min(1, 'Assessment template is required'),
  tenantId: z.string().min(1, 'Tenant is required'),
  assignedBy: z.string().min(1, 'Assigned by is required'),
  assignedTo: z.string().min(1, 'Assigned to is required'),
  status: z.enum(['draft', 'live', 'completed', 'expired']),
  schoolYear: z
    .string()
    .min(1, 'School year is required')
    .refine(isValidSchoolYear, 'School year must be in YYYY-YYYY format'),
  unitCode: z.string().min(1, 'Unit is required'),
  numberOfQuestions: z
    .string()
    .min(1, 'Number of questions is required')
    .refine(
      (value) => {
        const numericValue = Number(value)
        return Number.isInteger(numericValue) && numericValue >= 1 && numericValue <= 50
      },
      { message: 'Number of questions must be between 1 and 50' },
    ),
  dueDate: z
    .string()
    .optional()
    .refine(
      (value) => !value || !Number.isNaN(Date.parse(value)),
      'Due date must be a valid date/time',
    ),
  instructions: z.string().optional(),
  submissionUrl: z
    .string()
    .optional()
    .refine(
      (value) => !value || /^https?:\/\//.test(value),
      'Submission URL must be a valid http(s) URL',
    ),
  googleFormId: z.string().optional(),
})

export type CreateAssessmentFormState = z.infer<typeof createAssessmentSchema>

export const editAssessmentSchema = z.object({
  status: z.enum(['draft', 'live', 'completed', 'expired']),
  schoolYear: z
    .string()
    .min(1, 'School year is required')
    .refine(isValidSchoolYear, 'School year must be in YYYY-YYYY format'),
  unitCode: z.string().min(1, 'Unit is required'),
  numberOfQuestions: z
    .string()
    .min(1, 'Number of questions is required')
    .refine(
      (value) => {
        const numericValue = Number(value)
        return Number.isInteger(numericValue) && numericValue >= 1 && numericValue <= 50
      },
      { message: 'Number of questions must be between 1 and 50' },
    ),
  dueDate: z
    .string()
    .optional()
    .refine(
      (value) => !value || !Number.isNaN(Date.parse(value)),
      'Due date must be a valid date/time',
    ),
  instructions: z.string().optional(),
})

export type EditAssessmentFormState = z.infer<typeof editAssessmentSchema>
