import { prisma } from '@/lib/prisma'
import {
  FIRST_THEMATIC_RUN_IDLE_MS,
  FIRST_THEMATIC_RUN_MIN_RESPONSES,
  findAssessmentsEligibleForFirstThematicRun,
  isEligibleForFirstThematicRun,
} from '../first-run-eligibility'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
}))

const baseTime = new Date('2026-05-19T12:00:00.000Z')

function hoursAgo(hours: number, now = baseTime): Date {
  return new Date(now.getTime() - hours * 60 * 60 * 1000)
}

describe('isEligibleForFirstThematicRun', () => {
  it('should return false when responseCount is below minimum', () => {
    expect(
      isEligibleForFirstThematicRun({
        responseCount: FIRST_THEMATIC_RUN_MIN_RESPONSES - 1,
        lastSubmissionAt: hoursAgo(4),
        hasBlockingThematicAnalysis: false,
        now: baseTime,
      }),
    ).toBe(false)
  })

  it('should return false when last submission is within idle window', () => {
    expect(
      isEligibleForFirstThematicRun({
        responseCount: FIRST_THEMATIC_RUN_MIN_RESPONSES,
        lastSubmissionAt: hoursAgo(2),
        hasBlockingThematicAnalysis: false,
        now: baseTime,
      }),
    ).toBe(false)
  })

  it('should return false when a completed thematic analysis exists', () => {
    expect(
      isEligibleForFirstThematicRun({
        responseCount: 15,
        lastSubmissionAt: hoursAgo(4),
        hasBlockingThematicAnalysis: true,
        now: baseTime,
      }),
    ).toBe(false)
  })

  it('should return true when only a failed thematic analysis exists', () => {
    expect(
      isEligibleForFirstThematicRun({
        responseCount: 15,
        lastSubmissionAt: hoursAgo(4),
        hasBlockingThematicAnalysis: false,
        hasActiveProcessingThematicAnalysis: false,
        now: baseTime,
      }),
    ).toBe(true)
  })

  it('should return false when thematic analysis is actively processing', () => {
    expect(
      isEligibleForFirstThematicRun({
        responseCount: 15,
        lastSubmissionAt: hoursAgo(4),
        hasBlockingThematicAnalysis: false,
        hasActiveProcessingThematicAnalysis: true,
        now: baseTime,
      }),
    ).toBe(false)
  })

  it('should return false when there is no last submission', () => {
    expect(
      isEligibleForFirstThematicRun({
        responseCount: FIRST_THEMATIC_RUN_MIN_RESPONSES,
        lastSubmissionAt: null,
        hasBlockingThematicAnalysis: false,
        now: baseTime,
      }),
    ).toBe(false)
  })

  it('should return true when all conditions are met', () => {
    expect(
      isEligibleForFirstThematicRun({
        responseCount: FIRST_THEMATIC_RUN_MIN_RESPONSES,
        lastSubmissionAt: hoursAgo(4),
        hasBlockingThematicAnalysis: false,
        now: baseTime,
      }),
    ).toBe(true)
  })

  it('should return true at exactly minimum responses and exactly idle duration', () => {
    expect(
      isEligibleForFirstThematicRun({
        responseCount: FIRST_THEMATIC_RUN_MIN_RESPONSES,
        lastSubmissionAt: new Date(
          baseTime.getTime() - FIRST_THEMATIC_RUN_IDLE_MS,
        ),
        hasBlockingThematicAnalysis: false,
        now: baseTime,
      }),
    ).toBe(true)
  })

  it('should return false just before idle duration elapses', () => {
    expect(
      isEligibleForFirstThematicRun({
        responseCount: FIRST_THEMATIC_RUN_MIN_RESPONSES,
        lastSubmissionAt: new Date(
          baseTime.getTime() - FIRST_THEMATIC_RUN_IDLE_MS + 1,
        ),
        hasBlockingThematicAnalysis: false,
        now: baseTime,
      }),
    ).toBe(false)
  })
})

describe('findAssessmentsEligibleForFirstThematicRun', () => {
  const mockQueryRaw = prisma.$queryRaw as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return assessment ids from the eligibility query', async () => {
    mockQueryRaw.mockResolvedValue([{ id: 'assess-1' }, { id: 'assess-2' }])

    await expect(findAssessmentsEligibleForFirstThematicRun()).resolves.toEqual([
      'assess-1',
      'assess-2',
    ])
    expect(mockQueryRaw).toHaveBeenCalledTimes(1)
  })

  it('should return an empty array when no assessments qualify', async () => {
    mockQueryRaw.mockResolvedValue([])

    await expect(findAssessmentsEligibleForFirstThematicRun()).resolves.toEqual([])
  })
})
