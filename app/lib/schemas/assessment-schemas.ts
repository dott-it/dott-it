import { z } from 'zod'

/**
 * Zod schemas for assessment validation
 */

// Base assessment schema for creating/updating assessments
export const CreateAssessmentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  unitName: z
    .string()
    .min(1, 'Unit name is required')
    .max(100, 'Unit name must be less than 100 characters'),
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(50, 'Subject must be less than 50 characters'),
  grade: z
    .number()
    .min(1, 'Grade must be at least 1')
    .max(12, 'Grade must be at most 12')
    .nullable(),
  type: z.string().min(1, 'Type is required').max(50, 'Type must be less than 50 characters'),
  dueDate: z.string().datetime('Invalid date format').optional(),
  startDate: z.string().datetime('Invalid date format').optional(),
  closeDate: z.string().datetime('Invalid date format').optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
})

// Schema for updating assessments (all fields optional)
export const UpdateAssessmentSchema = CreateAssessmentSchema.partial()

// Schema for assessment API responses
export const AssessmentResponseSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  title: z.string().min(1, 'Title is required'),
  unitName: z.string().min(1, 'Unit name is required'),
  subject: z.string().min(1, 'Subject is required'),
  grade: z.number().nullable(),
  type: z.string().min(1, 'Type is required'),
  dueDate: z.string(),
  startDate: z.string().optional(),
  closeDate: z.string().optional(),
  status: z.enum(['draft', 'live', 'completed', 'expired'], {
    errorMap: () => ({ message: 'Status must be one of: draft, live, completed, expired' }),
  }),
  totalRecords: z.number().min(0, 'Total records must be non-negative'),
  pendingRecords: z.number().min(0, 'Pending records must be non-negative'),
  studentCount: z.number().min(0, 'Student count must be non-negative').optional(),
  submissionStats: z
    .object({
      readyForReview: z.number().min(0, 'Ready for review count must be non-negative'),
      revisionRequested: z.number().min(0, 'Revision requested count must be non-negative'),
      done: z.number().min(0, 'Done count must be non-negative'),
    })
    .optional(),
  description: z.string().optional(),
})

// Schema for student record validation
export const StudentRecordSchema = z.object({
  id: z.string().min(1, 'Student ID is required'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email format').optional(),
      status: z.enum(['handed_in', 'ready_for_review', 'revision_requested', 'shared', 'done'], {
    errorMap: () => ({ message: 'Invalid student status' }),
  }),
  submittedAt: z.string().datetime('Invalid date format').optional(),
  score: z
    .number()
    .min(0, 'Score must be non-negative')
    .max(100, 'Score must be at most 100')
    .optional(),
  feedback: z.string().max(1000, 'Feedback must be less than 1000 characters').optional(),
  classSection: z.string().max(50, 'Class section must be less than 50 characters').optional(),
  lastActionDate: z.string().datetime('Invalid date format').optional(),
})

// Type exports
export type CreateAssessmentInput = z.infer<typeof CreateAssessmentSchema>
export type UpdateAssessmentInput = z.infer<typeof UpdateAssessmentSchema>
export type AssessmentResponse = z.infer<typeof AssessmentResponseSchema>
export type StudentRecord = z.infer<typeof StudentRecordSchema>
