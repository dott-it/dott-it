import { z } from 'zod'
import {
  mapApiAssessmentToAssessment,
  validateCreateAssessmentData,
  validateUpdateAssessmentData,
  validateAssessmentResponse,
  safeValidateCreateAssessmentData,
  safeValidateUpdateAssessmentData,
  safeValidateAssessmentResponse,
} from '@/app/lib/utils/assessments/assessments-api-utils'
import type { ApiAssessment } from '@/app/lib/types/assessments/assessments-api-types'
import type { CreateAssessmentInput, UpdateAssessmentInput } from '@/app/lib/schemas/assessment-schemas'

// Mock the schemas
jest.mock('@/app/lib/schemas/assessment-schemas', () => ({
  CreateAssessmentSchema: {
    parse: jest.fn(),
    safeParse: jest.fn(),
  },
  UpdateAssessmentSchema: {
    parse: jest.fn(),
    safeParse: jest.fn(),
  },
  AssessmentResponseSchema: {
    parse: jest.fn(),
    safeParse: jest.fn(),
  },
}))

import {
  CreateAssessmentSchema,
  UpdateAssessmentSchema,
  AssessmentResponseSchema,
} from '@/app/lib/schemas/assessment-schemas'

const mockCreateAssessmentSchema = CreateAssessmentSchema as jest.Mocked<typeof CreateAssessmentSchema>
const mockUpdateAssessmentSchema = UpdateAssessmentSchema as jest.Mocked<typeof UpdateAssessmentSchema>
const mockAssessmentResponseSchema = AssessmentResponseSchema as jest.Mocked<typeof AssessmentResponseSchema>

describe('assessments-api-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('mapApiAssessmentToAssessment', () => {
    const mockApiAssessment: ApiAssessment = {
      id: 'assessment-123',
      title: 'Test Assessment',
      subject: 'Science',
      grade: 6,
      status: 'live',
      totalRecords: 25,
      pendingRecords: 5,
    }

    it('should map API assessment to assessment correctly', () => {
      const result = mapApiAssessmentToAssessment(mockApiAssessment)

      expect(result).toEqual({
        id: 'assessment-123',
        title: 'Test Assessment',
        unitName: 'Science',
        subject: 'Science',
        grade: 6,
        type: 'Assessment',
        dueDate: expect.any(Date),
        startDate: expect.any(String),
        closeDate: expect.any(Date),
        status: 'live',
        totalRecords: 25,
        pendingRecords: 5,
        studentCount: 25,
        submissionStats: {
          readyForReview: 0,
          shared: 0,
        },
        description: 'Test Assessment',
      })
    })

    it('should handle API assessment with minimal data', () => {
      const minimalApiAssessment: ApiAssessment = {
        id: 'assessment-456',
        title: 'Minimal Assessment',
        subject: 'Math',
        grade: null,
        status: 'live',
        totalRecords: 0,
        pendingRecords: 0,
      }

      const result = mapApiAssessmentToAssessment(minimalApiAssessment)

      expect(result).toEqual({
        id: 'assessment-456',
        title: 'Minimal Assessment',
        unitName: 'Math',
        subject: 'Math',
        grade: 0,
        type: 'Assessment',
        dueDate: expect.any(Date),
        startDate: expect.any(String),
        closeDate: expect.any(Date),
        status: 'live',
        totalRecords: 0,
        pendingRecords: 0,
        studentCount: 0,
        submissionStats: {
          readyForReview: 0,
          shared: 0,
        },
        description: 'Minimal Assessment',
      })
    })

    it('should handle API assessment with undefined values', () => {
      const apiAssessmentWithUndefined: ApiAssessment = {
        id: 'assessment-789',
        title: 'Undefined Assessment',
        subject: 'History',
        grade: null,
        status: 'live',
        totalRecords: 0,
        pendingRecords: 0,
      }

      const result = mapApiAssessmentToAssessment(apiAssessmentWithUndefined)

      expect(result).toEqual({
        id: 'assessment-789',
        title: 'Undefined Assessment',
        unitName: 'History',
        subject: 'History',
        grade: 0,
        type: 'Assessment',
        dueDate: expect.any(Date),
        startDate: expect.any(String),
        closeDate: expect.any(Date),
        status: 'live',
        totalRecords: 0,
        pendingRecords: 0,
        studentCount: 0,
        submissionStats: {
          readyForReview: 0,
          shared: 0,
        },
        description: 'Undefined Assessment',
      })
    })

    it('should use API status when provided', () => {
      const apiAssessmentWithStatus: ApiAssessment = {
        id: 'assessment-status',
        title: 'Status Assessment',
        subject: 'English',
        grade: null,
        status: 'draft',
        totalRecords: 0,
        pendingRecords: 0,
      }

      const result = mapApiAssessmentToAssessment(apiAssessmentWithStatus)

      expect(result.status).toBe('draft')
    })

    it('should map totalRecords to studentCount', () => {
      const apiAssessment: ApiAssessment = {
        id: 'assessment-count',
        title: 'Count Assessment',
        subject: 'Physics',
        grade: null,
        status: 'live',
        totalRecords: 42,
        pendingRecords: 0,
      }

      const result = mapApiAssessmentToAssessment(apiAssessment)

      expect(result.studentCount).toBe(42)
    })
  })

  describe('validateCreateAssessmentData', () => {
    const validCreateData = {
      title: 'New Assessment',
      unitName: 'Biology Unit',
      subject: 'Biology',
      grade: 7,
      type: 'Assessment',
    }

    it('should validate and return valid create data', () => {
      mockCreateAssessmentSchema.parse.mockReturnValue(validCreateData)

      const result = validateCreateAssessmentData(validCreateData)

      expect(mockCreateAssessmentSchema.parse).toHaveBeenCalledWith(validCreateData)
      expect(result).toBe(validCreateData)
    })

    it('should throw error for invalid create data', () => {
      const invalidData = { title: '', subject: null }
      const validationError = new z.ZodError([])
      mockCreateAssessmentSchema.parse.mockImplementation(() => {
        throw validationError
      })

      expect(() => validateCreateAssessmentData(invalidData as unknown as CreateAssessmentInput)).toThrow(validationError)
      expect(mockCreateAssessmentSchema.parse).toHaveBeenCalledWith(invalidData)
    })
  })

  describe('validateUpdateAssessmentData', () => {
    const validUpdateData = {
      title: 'Updated Assessment',
      unitName: 'Updated Unit',
      subject: 'Updated Subject',
      grade: 8,
      type: 'Assessment',
    }

    it('should validate and return valid update data', () => {
      mockUpdateAssessmentSchema.parse.mockReturnValue(validUpdateData)

      const result = validateUpdateAssessmentData(validUpdateData)

      expect(mockUpdateAssessmentSchema.parse).toHaveBeenCalledWith(validUpdateData)
      expect(result).toBe(validUpdateData)
    })

    it('should throw error for invalid update data', () => {
      const invalidData = { id: '', title: null }
      const validationError = new z.ZodError([])
      mockUpdateAssessmentSchema.parse.mockImplementation(() => {
        throw validationError
      })

      expect(() => validateUpdateAssessmentData(invalidData as unknown as UpdateAssessmentInput)).toThrow(validationError)
      expect(mockUpdateAssessmentSchema.parse).toHaveBeenCalledWith(invalidData)
    })
  })

  describe('validateAssessmentResponse', () => {
    const validResponseData = {
      id: 'assessment-123',
      title: 'Response Assessment',
      unitName: 'Chemistry Unit',
      subject: 'Chemistry',
      grade: 8,
      type: 'Assessment',
      dueDate: '2024-12-31T23:59:59Z',
      status: 'live' as const,
      totalRecords: 25,
      pendingRecords: 5,
    }

    it('should validate and return valid response data', () => {
      mockAssessmentResponseSchema.parse.mockReturnValue(validResponseData)

      const result = validateAssessmentResponse(validResponseData)

      expect(mockAssessmentResponseSchema.parse).toHaveBeenCalledWith(validResponseData)
      expect(result).toBe(validResponseData)
    })

    it('should throw error for invalid response data', () => {
      const invalidData = { id: null, title: undefined }
      const validationError = new z.ZodError([])
      mockAssessmentResponseSchema.parse.mockImplementation(() => {
        throw validationError
      })

      expect(() => validateAssessmentResponse(invalidData)).toThrow(validationError)
      expect(mockAssessmentResponseSchema.parse).toHaveBeenCalledWith(invalidData)
    })
  })

  describe('safeValidateCreateAssessmentData', () => {
    const validCreateData = {
      title: 'Safe Create Assessment',
      unitName: 'Geography Unit',
      subject: 'Geography',
      grade: 9,
      type: 'Assessment',
    }

    it('should return success for valid data', () => {
      const mockSuccessResult = { success: true as const, data: validCreateData }
      mockCreateAssessmentSchema.safeParse.mockReturnValue(mockSuccessResult)

      const result = safeValidateCreateAssessmentData(validCreateData)

      expect(mockCreateAssessmentSchema.safeParse).toHaveBeenCalledWith(validCreateData)
      expect(result).toBe(mockSuccessResult)
    })

    it('should return error for invalid data', () => {
      const invalidData = { title: '', subject: null }
      const mockErrorResult = { 
        success: false as const, 
        error: new z.ZodError([]) 
      }
      mockCreateAssessmentSchema.safeParse.mockReturnValue(mockErrorResult)

      const result = safeValidateCreateAssessmentData(invalidData as unknown as CreateAssessmentInput)

      expect(mockCreateAssessmentSchema.safeParse).toHaveBeenCalledWith(invalidData)
      expect(result).toBe(mockErrorResult)
    })
  })

  describe('safeValidateUpdateAssessmentData', () => {
    const validUpdateData = {
      title: 'Safe Update Assessment',
      unitName: 'Updated Unit',
      subject: 'Updated Subject',
      grade: 10,
      type: 'Assessment',
    }

    it('should return success for valid data', () => {
      const mockSuccessResult = { success: true as const, data: validUpdateData }
      mockUpdateAssessmentSchema.safeParse.mockReturnValue(mockSuccessResult)

      const result = safeValidateUpdateAssessmentData(validUpdateData)

      expect(mockUpdateAssessmentSchema.safeParse).toHaveBeenCalledWith(validUpdateData)
      expect(result).toBe(mockSuccessResult)
    })

    it('should return error for invalid data', () => {
      const invalidData = { id: '', title: null }
      const mockErrorResult = { 
        success: false as const, 
        error: new z.ZodError([]) 
      }
      mockUpdateAssessmentSchema.safeParse.mockReturnValue(mockErrorResult)

      const result = safeValidateUpdateAssessmentData(invalidData as unknown as UpdateAssessmentInput)

      expect(mockUpdateAssessmentSchema.safeParse).toHaveBeenCalledWith(invalidData)
      expect(result).toBe(mockErrorResult)
    })
  })

  describe('safeValidateAssessmentResponse', () => {
    const validResponseData = {
      id: 'assessment-safe-response',
      title: 'Safe Response Assessment',
      unitName: 'Art Unit',
      subject: 'Art',
      grade: 10,
      type: 'Assessment',
      dueDate: '2024-12-31T23:59:59Z',
      status: 'live' as const,
      totalRecords: 30,
      pendingRecords: 3,
    }

    it('should return success for valid data', () => {
      const mockSuccessResult = { success: true as const, data: validResponseData }
      mockAssessmentResponseSchema.safeParse.mockReturnValue(mockSuccessResult)

      const result = safeValidateAssessmentResponse(validResponseData)

      expect(mockAssessmentResponseSchema.safeParse).toHaveBeenCalledWith(validResponseData)
      expect(result).toBe(mockSuccessResult)
    })

    it('should return error for invalid data', () => {
      const invalidData = { id: null, title: undefined }
      const mockErrorResult = { 
        success: false as const, 
        error: new z.ZodError([]) 
      }
      mockAssessmentResponseSchema.safeParse.mockReturnValue(mockErrorResult)

      const result = safeValidateAssessmentResponse(invalidData)

      expect(mockAssessmentResponseSchema.safeParse).toHaveBeenCalledWith(invalidData)
      expect(result).toBe(mockErrorResult)
    })
  })

  describe('Integration Tests', () => {
    it('should work together: map API data then validate response', () => {
      const apiAssessment: ApiAssessment = {
        id: 'integration-test',
        title: 'Integration Assessment',
        subject: 'Computer Science',
        grade: 11,
        status: 'active',
        totalRecords: 30,
        pendingRecords: 3,
      }

      // Map API data
      const mappedAssessment = mapApiAssessmentToAssessment(apiAssessment)

      // Validate response (mock success)
      const mockSuccessResult = { 
        success: true as const, 
        data: mappedAssessment as unknown as z.infer<typeof AssessmentResponseSchema>
      }
      mockAssessmentResponseSchema.safeParse.mockReturnValue(mockSuccessResult)

      const validationResult = safeValidateAssessmentResponse(mappedAssessment)

      expect(mappedAssessment.id).toBe('integration-test')
      expect(mappedAssessment.title).toBe('Integration Assessment')
      expect(mappedAssessment.subject).toBe('Computer Science')
      expect(validationResult.success).toBe(true)
    })

    it('should handle error scenarios gracefully', () => {
      const invalidApiData = {
        id: null,
        title: '',
        subject: undefined,
      }

      // This should not throw but create a partial mapping
      const mappedData = mapApiAssessmentToAssessment(invalidApiData as unknown as ApiAssessment)

      // Validation should fail
      const mockErrorResult = { 
        success: false as const, 
        error: new z.ZodError([]) 
      }
      mockAssessmentResponseSchema.safeParse.mockReturnValue(mockErrorResult)

      const validationResult = safeValidateAssessmentResponse(mappedData)

      expect(validationResult.success).toBe(false)
    })
  })
})
