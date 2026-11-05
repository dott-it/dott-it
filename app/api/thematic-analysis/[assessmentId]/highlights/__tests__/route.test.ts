/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import {
  checkAssessmentTenantAccess,
  requireWorkspaceAuth,
} from '@/app/lib/api/feedback-access'
import { getStudentHighlightPhrases } from '@/lib/thematic-analysis/get-student-highlight-phrases'
import { GET } from '../route'

jest.mock('@/app/lib/api/feedback-access', () => ({
  requireWorkspaceAuth: jest.fn(),
  checkAssessmentTenantAccess: jest.fn(),
  tenantAccessToResponse: jest.fn((result: string) => {
    if (result === 'forbidden') {
      return new Response(JSON.stringify({ error: 'FORBIDDEN' }), { status: 403 })
    }
    if (result === 'not_found') {
      return new Response(JSON.stringify({ error: 'NOT_FOUND' }), { status: 404 })
    }
    return null
  }),
}))

jest.mock('@/lib/thematic-analysis/get-student-highlight-phrases', () => ({
  getStudentHighlightPhrases: jest.fn(),
}))

const mockRequireWorkspaceAuth = requireWorkspaceAuth as jest.Mock
const mockCheckAssessmentTenantAccess = checkAssessmentTenantAccess as jest.Mock
const mockGetPhrases = getStudentHighlightPhrases as jest.Mock

const assessmentId = 'assess-1'
const learnerId = 'learner-1'
const routeParams = { params: Promise.resolve({ assessmentId }) }

describe('GET /api/thematic-analysis/[assessmentId]/highlights', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireWorkspaceAuth.mockResolvedValue({
      ok: true,
      auth: { ownerUserId: 'u1', tenantId: 't1' },
    })
    mockCheckAssessmentTenantAccess.mockResolvedValue('ok')
    mockGetPhrases.mockResolvedValue([{ phrase: 'claim', type: 'need' }])
  })

  it('should return 400 when learnerId is missing', async () => {
    const request = new NextRequest(
      `http://localhost/api/thematic-analysis/${assessmentId}/highlights`,
    )

    const response = await GET(request, routeParams)

    expect(response.status).toBe(400)
    expect(mockGetPhrases).not.toHaveBeenCalled()
  })

  it('should return 401 when workspace auth fails', async () => {
    mockRequireWorkspaceAuth.mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), {
        status: 401,
      }),
    })

    const request = new NextRequest(
      `http://localhost/api/thematic-analysis/${assessmentId}/highlights?learnerId=${learnerId}`,
    )
    const response = await GET(request, routeParams)

    expect(response.status).toBe(401)
    expect(mockGetPhrases).not.toHaveBeenCalled()
  })

  it('should return highlight phrases for the learner', async () => {
    const request = new NextRequest(
      `http://localhost/api/thematic-analysis/${assessmentId}/highlights?learnerId=${learnerId}`,
    )
    const response = await GET(request, routeParams)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      phrases: [{ phrase: 'claim', type: 'need' }],
    })
    expect(mockGetPhrases).toHaveBeenCalledWith({ assessmentId, learnerId })
  })
})
