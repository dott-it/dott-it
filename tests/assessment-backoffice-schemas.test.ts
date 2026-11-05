import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  createAssessmentSchema,
  editAssessmentSchema,
} from '../app/(dashboard)/backoffice/assessments/schemas.ts'

describe('assessment backoffice schemas', () => {
  it('should require school year and unit on create', () => {
    const result = createAssessmentSchema.safeParse({
      templateId: 't1',
      tenantId: 'tenant',
      assignedBy: 'teacher',
      assignedTo: 'Hour 3',
      status: 'draft',
      numberOfQuestions: '5',
    })
    assert.equal(result.success, false)
  })

  it('should accept a valid create payload', () => {
    const result = createAssessmentSchema.safeParse({
      templateId: 't1',
      tenantId: 'tenant',
      assignedBy: 'teacher',
      assignedTo: 'Hour 3',
      status: 'live',
      schoolYear: '2025-2026',
      unitCode: '8.1',
      numberOfQuestions: '5',
    })
    assert.equal(result.success, true)
  })

  it('should require school year and unit on edit', () => {
    const invalid = editAssessmentSchema.safeParse({
      status: 'live',
      numberOfQuestions: '5',
    })
    assert.equal(invalid.success, false)

    const valid = editAssessmentSchema.safeParse({
      status: 'live',
      schoolYear: '2025-2026',
      unitCode: '8.1',
      numberOfQuestions: '5',
    })
    assert.equal(valid.success, true)
  })
})
