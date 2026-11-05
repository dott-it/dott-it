/**
 * @jest-environment node
 */

const mockSyncFormResponses = jest.fn()

jest.mock('@/lib/forms/sync-form-responses', () => ({
  syncFormResponses: (...args: unknown[]) => mockSyncFormResponses(...args),
}))

import { POST } from '../route'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/forms/form-1/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/forms/[formId]/sync', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return success when sync completes', async () => {
    mockSyncFormResponses.mockResolvedValue({ assessmentId: 'assess-1' })

    const response = await POST(makeRequest({ formData: { items: [] }, responseData: [] }), {
      params: Promise.resolve({ formId: 'form-1' }),
    })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(mockSyncFormResponses).toHaveBeenCalledWith({
      formId: 'form-1',
      formData: { items: [] },
      responseData: [],
    })
  })

  it('should return 404 when no assessment is linked to the form', async () => {
    mockSyncFormResponses.mockRejectedValue(
      new Error('No assessment found for googleFormId: form-1'),
    )

    const response = await POST(
      makeRequest({
        formData: { items: [] },
        responseData: [{ responseId: 'r1' }],
      }),
      { params: Promise.resolve({ formId: 'form-1' }) },
    )
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.error).toMatch(/No assessment found for googleFormId/)
    expect(body.details).toMatch(/googleFormId/)
  })

  it('should return 500 for unexpected errors', async () => {
    mockSyncFormResponses.mockRejectedValue(new Error('boom'))

    const response = await POST(makeRequest({ formData: {}, responseData: [] }), {
      params: Promise.resolve({ formId: 'form-1' }),
    })

    expect(response.status).toBe(500)
  })
})
