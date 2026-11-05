/**
 * @jest-environment node
 */

const mockSyncAssessment = jest.fn()
const mockTenantFindUnique = jest.fn()

jest.mock('@/lib/forms/sync-form-responses', () => ({
  syncAssessmentResponsesFromGoogle: (...args: unknown[]) => mockSyncAssessment(...args),
}))

jest.mock('@/app/api/middleware/authorization.middleware', () => ({
  withAuth: (handler: (...args: unknown[]) => unknown) => handler,
}))

jest.mock('@/lib/user-prisma', () => ({
  userPrisma: {
    tenant: {
      findUnique: (...args: unknown[]) => mockTenantFindUnique(...args),
    },
  },
}))

import { POST } from '../route'

describe('POST /api/assessments/[id]/sync-responses', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockTenantFindUnique.mockResolvedValue({ name: 'Eddo', slug: 'eddo' })
  })

  it('should return success when sync completes', async () => {
    mockSyncAssessment.mockResolvedValue({
      assessmentId: 'assess-1',
      googleFormId: 'form-1',
      responseCount: 10,
    })

    const response = await POST(
      { user: { tenantId: 'tenant-eddo' } } as never,
      { params: Promise.resolve({ id: 'assess-1' }) },
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      success: true,
      googleFormId: 'form-1',
      responseCount: 10,
    })
    expect(mockSyncAssessment).toHaveBeenCalledWith('assess-1')
  })

  it('should return 400 when assessment has no googleFormId', async () => {
    mockSyncAssessment.mockRejectedValue(new Error('Assessment is missing googleFormId'))

    const response = await POST(
      { user: { tenantId: 'tenant-eddo' } } as never,
      { params: Promise.resolve({ id: 'assess-1' }) },
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.message).toMatch(/googleFormId/i)
  })

  it('should return 404 when assessment is missing', async () => {
    mockSyncAssessment.mockRejectedValue(new Error('Assessment not found'))

    const response = await POST(
      { user: { tenantId: 'tenant-eddo' } } as never,
      { params: Promise.resolve({ id: 'missing' }) },
    )

    expect(response.status).toBe(404)
  })

  it('should return 404 when no assessment matches googleFormId', async () => {
    mockSyncAssessment.mockRejectedValue(
      new Error('No assessment found for googleFormId: form-xyz'),
    )

    const response = await POST(
      { user: { tenantId: 'tenant-eddo' } } as never,
      { params: Promise.resolve({ id: 'assess-1' }) },
    )
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.message).toMatch(/No assessment found for googleFormId/)
    expect(body.details).toMatch(/googleFormId/)
  })

  it('should deny callers without backoffice access', async () => {
    mockTenantFindUnique.mockResolvedValue({ name: 'Other', slug: 'other' })

    const response = await POST(
      { user: { tenantId: 'tenant-other' } } as never,
      { params: Promise.resolve({ id: 'assess-1' }) },
    )

    expect(response.status).toBe(403)
    expect(mockSyncAssessment).not.toHaveBeenCalled()
  })
})
