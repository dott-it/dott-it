import { 
  CreateAssessmentSchema, 
  UpdateAssessmentSchema, 
  AssessmentResponseSchema,
  StudentRecordSchema 
} from '../assessment-schemas'

describe('Assessment Schemas', () => {
  describe('CreateAssessmentSchema', () => {
    const validCreateData = {
      title: 'Test Assessment',
      unitName: 'Test Unit',
      subject: 'Science',
      grade: 8,
      type: 'formative',
      dueDate: '2025-01-31T23:59:59.000Z',
      description: 'A test assessment'
    }

    it('should validate correct assessment data', () => {
      const result = CreateAssessmentSchema.safeParse(validCreateData)
      expect(result.success).toBe(true)
    })

    it('should reject empty title', () => {
      const result = CreateAssessmentSchema.safeParse({ ...validCreateData, title: '' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Title is required')
      }
    })

    it('should reject title too long', () => {
      const result = CreateAssessmentSchema.safeParse({ 
        ...validCreateData, 
        title: 'a'.repeat(201) 
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Title must be less than 200 characters')
      }
    })

    it('should reject invalid grade', () => {
      const result = CreateAssessmentSchema.safeParse({ ...validCreateData, grade: 13 })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Grade must be at most 12')
      }
    })

    it('should accept null grade', () => {
      const result = CreateAssessmentSchema.safeParse({ ...validCreateData, grade: null })
      expect(result.success).toBe(true)
    })

    it('should reject invalid date format', () => {
      const result = CreateAssessmentSchema.safeParse({ 
        ...validCreateData, 
        dueDate: 'invalid-date' 
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid date format')
      }
    })
  })

  describe('UpdateAssessmentSchema', () => {
    it('should accept partial data', () => {
      const partialData = { title: 'Updated Title' }
      const result = UpdateAssessmentSchema.safeParse(partialData)
      expect(result.success).toBe(true)
    })

    it('should accept empty object', () => {
      const result = UpdateAssessmentSchema.safeParse({})
      expect(result.success).toBe(true)
    })
  })

  describe('AssessmentResponseSchema', () => {
    const validResponseData = {
      id: 'assessment-123',
      title: 'Test Assessment',
      unitName: 'Test Unit',
      subject: 'Science',
      grade: 8,
      type: 'formative',
      dueDate: '2025-01-31T23:59:59.000Z',
      status: 'live' as const,
      totalRecords: 25,
      pendingRecords: 10,
      studentCount: 25,
      submissionStats: {
        readyForReview: 5,
        revisionRequested: 2,
        done: 8
      },
      description: 'Test description'
    }

    it('should validate correct response data', () => {
      const result = AssessmentResponseSchema.safeParse(validResponseData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid status', () => {
      const result = AssessmentResponseSchema.safeParse({ 
        ...validResponseData, 
        status: 'invalid-status' 
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Status must be one of: draft, live, completed, expired')
      }
    })

    it('should reject negative records count', () => {
      const result = AssessmentResponseSchema.safeParse({ 
        ...validResponseData, 
        totalRecords: -1 
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Total records must be non-negative')
      }
    })
  })

  describe('StudentRecordSchema', () => {
    const validStudentData = {
      id: 'student-123',
      name: 'John Doe',
      email: 'john.doe@example.com',
      status: 'ready_for_review' as const,
      submittedAt: '2025-01-15T10:30:00.000Z',
      score: 85,
      feedback: 'Great work!',
      classSection: 'A-1',
      lastActionDate: '2025-01-15T10:30:00.000Z'
    }

    it('should validate correct student data', () => {
      const result = StudentRecordSchema.safeParse(validStudentData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const result = StudentRecordSchema.safeParse({ 
        ...validStudentData, 
        email: 'invalid-email' 
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email format')
      }
    })

    it('should reject score above 100', () => {
      const result = StudentRecordSchema.safeParse({ 
        ...validStudentData, 
        score: 105 
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Score must be at most 100')
      }
    })

    it('should reject invalid status', () => {
      const result = StudentRecordSchema.safeParse({ 
        ...validStudentData, 
        status: 'invalid-status' 
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid student status')
      }
    })
  })
})
