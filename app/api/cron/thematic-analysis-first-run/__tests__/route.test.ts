/**
 * @jest-environment node
 */

import { Prisma } from '@prisma/assessmentDB'
import { findAssessmentsEligibleForFirstThematicRun } from '@/lib/thematic-analysis/first-run-eligibility'
import {
  RunThematicAnalysisError,
  runThematicAnalysis,
} from '@/lib/thematic-analysis/run-thematic-analysis'
import { refreshAllStudentResponsesCounts } from '@/lib/thematic-analysis/student-responses-count'
import { GET } from '../route'

jest.mock('@/lib/thematic-analysis/first-run-eligibility', () => ({
  findAssessmentsEligibleForFirstThematicRun: jest.fn(),
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
    runThematicAnalysis: jest.fn(),
  }
})

jest.mock('@/lib/thematic-analysis/student-responses-count', () => ({
  refreshAllStudentResponsesCounts: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {},
}))

const mockFindEligible = findAssessmentsEligibleForFirstThematicRun as jest.Mock
const mockRun = runThematicAnalysis as jest.Mock
const mockRefreshCounts = refreshAllStudentResponsesCounts as jest.Mock

const originalCronSecret = process.env.CRON_SECRET
const originalMaxAssessments = process.env.THEMATIC_CRON_MAX_ASSESSMENTS

function authorizedRequest(): Request {
  return new Request('http://localhost/api/cron/thematic-analysis-first-run', {
    headers: { authorization: 'Bearer test-cron-secret' },
  })
}

describe('GET /api/cron/thematic-analysis-first-run', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.CRON_SECRET = 'test-cron-secret'
    delete process.env.THEMATIC_CRON_MAX_ASSESSMENTS
    mockFindEligible.mockResolvedValue([])
    mockRun.mockResolvedValue({ id: 'analysis-1' })
    mockRefreshCounts.mockResolvedValue(0)
  })

  afterAll(() => {
    if (originalCronSecret === undefined) {
      delete process.env.CRON_SECRET
    } else {
      process.env.CRON_SECRET = originalCronSecret
    }
    if (originalMaxAssessments === undefined) {
      delete process.env.THEMATIC_CRON_MAX_ASSESSMENTS
    } else {
      process.env.THEMATIC_CRON_MAX_ASSESSMENTS = originalMaxAssessments
    }
  })

  it('should return 401 when authorization header is missing', async () => {
    const response = await GET(new Request('http://localhost'))

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Unauthorized' })
    expect(mockFindEligible).not.toHaveBeenCalled()
  })

  it('should return 401 when bearer token does not match CRON_SECRET', async () => {
    const response = await GET(
      new Request('http://localhost', {
        headers: { authorization: 'Bearer wrong-secret' },
      }),
    )

    expect(response.status).toBe(401)
    expect(mockFindEligible).not.toHaveBeenCalled()
  })

  it('should return 401 when CRON_SECRET is not configured', async () => {
    delete process.env.CRON_SECRET

    const response = await GET(authorizedRequest())

    expect(response.status).toBe(401)
    expect(mockFindEligible).not.toHaveBeenCalled()
  })

  it('should process eligible assessments and report failures', async () => {
    mockFindEligible.mockResolvedValue(['assess-1', 'assess-2', 'assess-3'])
    mockRun
      .mockResolvedValueOnce({ id: 'a1' })
      .mockRejectedValueOnce(
        new RunThematicAnalysisError('no_responses', 'No student responses available'),
      )
      .mockResolvedValueOnce({ id: 'a3' })

    const response = await GET(authorizedRequest())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({
      eligibleCount: 3,
      processed: ['assess-1', 'assess-3'],
      deferred: [],
      failed: [
        {
          assessmentId: 'assess-2',
          error: 'No student responses available',
        },
      ],
      responseCountsUpdated: 0,
    })
    expect(mockRefreshCounts).toHaveBeenCalledTimes(1)
    expect(mockRun).toHaveBeenCalledTimes(3)
  })

  it('should cap processed assessments when THEMATIC_CRON_MAX_ASSESSMENTS is set', async () => {
    process.env.THEMATIC_CRON_MAX_ASSESSMENTS = '2'
    mockFindEligible.mockResolvedValue(['assess-1', 'assess-2', 'assess-3'])

    const response = await GET(authorizedRequest())
    const body = await response.json()

    expect(body.processed).toEqual(['assess-1', 'assess-2'])
    expect(body.deferred).toEqual(['assess-3'])
    expect(mockRun).toHaveBeenCalledTimes(2)
  })

  it('should return 503 when the database is unreachable', async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('connection failed', {
      code: 'P1001',
      clientVersion: 'test',
    })
    mockFindEligible.mockRejectedValue(prismaError)

    const response = await GET(authorizedRequest())

    expect(response.status).toBe(503)
    expect(await response.json()).toMatchObject({
      error: 'Database unavailable',
    })
    expect(mockRun).not.toHaveBeenCalled()
  })
})
