/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import {
  checkAssessmentTenantAccess,
  requireWorkspaceAuth,
} from '@/app/lib/api/feedback-access'
import { findPreferredThematicAnalysis } from '@/lib/thematic-analysis/find-preferred-thematic-analysis'
import { formatThematicAnalysisResponse } from '@/lib/thematic-analysis/format-thematic-analysis-response'
import {
  RunThematicAnalysisError,
  continueThematicAnalysis,
  startThematicAnalysis,
} from '@/lib/thematic-analysis/run-thematic-analysis'
import { GET, POST, maxDuration } from '../route'

const mockAfter = jest.fn((fn: () => void | Promise<void>) => {
  void fn()
})

jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server')
  return {
    ...actual,
    after: (fn: () => void | Promise<void>) => mockAfter(fn),
  }
})

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
  feedbackForbiddenResponse: jest.fn(),
  feedbackNotFoundResponse: jest.fn(),
}))

jest.mock('@/lib/thematic-analysis/find-preferred-thematic-analysis', () => ({
  findPreferredThematicAnalysis: jest.fn(),
}))

jest.mock('@/lib/thematic-analysis/format-thematic-analysis-response', () => ({
  formatThematicAnalysisResponse: jest.fn(),
}))

jest.mock('@/lib/thematic-analysis/run-thematic-analysis', () => {
  class RunThematicAnalysisError extends Error {
    readonly code: string

    constructor(code: string, message: string) {
      super(message)
      this.name = 'RunThematicAnalysisError'
      this.code = code
    }
  }

  return {
    RunThematicAnalysisError,
    startThematicAnalysis: jest.fn(),
    continueThematicAnalysis: jest.fn(),
    runThematicAnalysis: jest.fn(),
  }
})

const mockRequireWorkspaceAuth = requireWorkspaceAuth as jest.Mock
const mockCheckAssessmentTenantAccess = checkAssessmentTenantAccess as jest.Mock
const mockFindPreferred = findPreferredThematicAnalysis as jest.Mock
const mockFormat = formatThematicAnalysisResponse as jest.Mock
const mockStart = startThematicAnalysis as jest.Mock
const mockContinue = continueThematicAnalysis as jest.Mock

const assessmentId = 'assess-1'
const routeParams = { params: Promise.resolve({ assessmentId }) }
const authContext = { ownerUserId: 'user-1', tenantId: 'tenant-1' }

function createRequest(): NextRequest {
  return new NextRequest(`http://localhost/api/thematic-analysis/${assessmentId}`)
}

function mockAuthorized() {
  mockRequireWorkspaceAuth.mockResolvedValue({ ok: true, auth: authContext })
  mockCheckAssessmentTenantAccess.mockResolvedValue('ok')
}

function mockUnauthorized() {
  mockRequireWorkspaceAuth.mockResolvedValue({
    ok: false,
    response: new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), {
      status: 401,
    }),
  })
}

describe('GET /api/thematic-analysis/[assessmentId]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthorized()
  })

  it('should export maxDuration aligned with the cron route', () => {
    expect(maxDuration).toBe(300)
  })

  it('should return 401 when workspace auth fails', async () => {
    mockUnauthorized()

    const response = await GET(createRequest(), routeParams)

    expect(response.status).toBe(401)
    expect(mockFindPreferred).not.toHaveBeenCalled()
  })

  it('should return 403 when tenant access is forbidden', async () => {
    mockCheckAssessmentTenantAccess.mockResolvedValue('forbidden')

    const response = await GET(createRequest(), routeParams)

    expect(response.status).toBe(403)
    expect(mockFindPreferred).not.toHaveBeenCalled()
  })

  it('should return 404 when assessment is not found for tenant', async () => {
    mockCheckAssessmentTenantAccess.mockResolvedValue('not_found')

    const response = await GET(createRequest(), routeParams)

    expect(response.status).toBe(404)
    expect(mockFindPreferred).not.toHaveBeenCalled()
  })

  it('should return formatted completed analysis', async () => {
    const dbRow = { id: 'analysis-1', status: 'completed' }
    const formatted = { id: 'analysis-1', assessmentId, status: 'completed', items: [] }

    mockFindPreferred.mockResolvedValue(dbRow)
    mockFormat.mockResolvedValue(formatted)

    const response = await GET(createRequest(), routeParams)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual(formatted)
    expect(mockFindPreferred).toHaveBeenCalledWith(assessmentId)
    expect(mockFormat).toHaveBeenCalledWith(assessmentId, dbRow, {
      includeNames: false,
    })
  })

  it('should pass includeNames true when query param is set', async () => {
    const dbRow = { id: 'analysis-1', status: 'completed' }
    const formatted = { id: 'analysis-1', assessmentId, status: 'completed', items: [] }

    mockFindPreferred.mockResolvedValue(dbRow)
    mockFormat.mockResolvedValue(formatted)

    const request = new NextRequest(
      `http://localhost/api/thematic-analysis/${assessmentId}?includeNames=true`,
    )
    const response = await GET(request, routeParams)

    expect(response.status).toBe(200)
    expect(mockFormat).toHaveBeenCalledWith(assessmentId, dbRow, {
      includeNames: true,
    })
  })

  it('should return formatted failed analysis when no completed run exists', async () => {
    const dbRow = { id: 'analysis-2', status: 'failed', items: [] }
    const formatted = { id: 'analysis-2', assessmentId, status: 'failed', items: [] }

    mockFindPreferred.mockResolvedValue(dbRow)
    mockFormat.mockResolvedValue(formatted)

    const response = await GET(createRequest(), routeParams)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(formatted)
  })

  it('should return null when no analysis exists', async () => {
    mockFindPreferred.mockResolvedValue(null)
    mockFormat.mockResolvedValue(null)

    const response = await GET(createRequest(), routeParams)

    expect(response.status).toBe(200)
    expect(await response.json()).toBeNull()
  })

  it('should return 500 when the database query fails', async () => {
    mockFindPreferred.mockRejectedValue(new Error('db down'))

    const response = await GET(createRequest(), routeParams)

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: 'Failed to fetch thematic analysis' })
  })
})

describe('POST /api/thematic-analysis/[assessmentId]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthorized()
    mockContinue.mockResolvedValue({ id: 'analysis-1', status: 'completed' })
  })

  it('should return 401 when workspace auth fails', async () => {
    mockUnauthorized()

    const response = await POST(createRequest(), routeParams)

    expect(response.status).toBe(401)
    expect(mockStart).not.toHaveBeenCalled()
  })

  it('should return 403 when tenant access is forbidden', async () => {
    mockCheckAssessmentTenantAccess.mockResolvedValue('forbidden')

    const response = await POST(createRequest(), routeParams)

    expect(response.status).toBe(403)
    expect(mockStart).not.toHaveBeenCalled()
  })

  it('should start analysis, schedule background work, and return 202 processing', async () => {
    const processing = {
      id: 'analysis-1',
      status: 'processing',
      items: [],
    }
    const started = {
      analysis: processing,
      orderedLearnerIds: ['learner-1'],
      studentResponses: [],
      reviewer: {
        curriculumTeachersEdition: '',
        curriculumAnswerKey: '',
        customInstructions: '',
      },
    }
    const formatted = {
      id: 'analysis-1',
      assessmentId,
      status: 'processing',
      items: [],
    }

    mockStart.mockResolvedValue(started)
    mockFormat.mockResolvedValue(formatted)

    const response = await POST(createRequest(), routeParams)

    expect(response.status).toBe(202)
    expect(await response.json()).toEqual(formatted)
    expect(mockStart).toHaveBeenCalledWith(assessmentId, {
      enforceManualCooldown: true,
    })
    expect(mockAfter).toHaveBeenCalledTimes(1)
    expect(mockContinue).toHaveBeenCalledWith(started)
    expect(mockFormat).toHaveBeenCalledWith(assessmentId, processing, {
      includeNames: false,
    })
  })

  it('should return 404 when assessment is not found', async () => {
    mockStart.mockRejectedValue(
      new RunThematicAnalysisError('assessment_not_found', 'Assessment not found'),
    )

    const response = await POST(createRequest(), routeParams)

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'Assessment not found' })
    expect(mockAfter).not.toHaveBeenCalled()
  })

  it('should return 400 when there are no student responses', async () => {
    mockStart.mockRejectedValue(
      new RunThematicAnalysisError('no_responses', 'No student responses available'),
    )

    const response = await POST(createRequest(), routeParams)

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'No student responses available' })
  })

  it('should return 409 when analysis is already in progress', async () => {
    mockStart.mockRejectedValue(
      new RunThematicAnalysisError(
        'already_in_progress',
        'Analysis already in progress',
      ),
    )

    const response = await POST(createRequest(), routeParams)

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({ error: 'Analysis already in progress' })
  })

  it('should return 429 when manual run cooldown has not elapsed', async () => {
    mockStart.mockRejectedValue(
      new RunThematicAnalysisError(
        'rate_limited',
        'Please wait before running analysis again',
      ),
    )

    const response = await POST(createRequest(), routeParams)

    expect(response.status).toBe(429)
    expect(await response.json()).toEqual({
      error: 'Please wait before running analysis again',
    })
  })

  it('should return 500 for unexpected errors', async () => {
    mockStart.mockRejectedValue(new Error('unexpected'))

    const response = await POST(createRequest(), routeParams)

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: 'Failed to trigger thematic analysis' })
  })
})
