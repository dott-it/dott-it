import { prisma } from '@/lib/prisma'
import { THEMATIC_PROCESSING_STALE_MS } from '../first-run-eligibility'
import { findPreferredThematicAnalysis } from '../find-preferred-thematic-analysis'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    thematicAnalysis: {
      findFirst: jest.fn(),
    },
  },
}))

const mockFindFirst = prisma.thematicAnalysis.findFirst as jest.Mock

const assessmentId = 'assess-1'
const include = {
  items: {
    orderBy: { order: 'asc' },
    include: { citations: true },
  },
}

describe('findPreferredThematicAnalysis', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return active processing even when a newer failed exists', async () => {
    const processing = { id: 'processing-1', status: 'processing' }
    mockFindFirst.mockResolvedValueOnce(processing)

    const result = await findPreferredThematicAnalysis(assessmentId)

    expect(result).toEqual(processing)
    expect(mockFindFirst).toHaveBeenCalledTimes(1)
    expect(mockFindFirst).toHaveBeenCalledWith({
      where: {
        assessmentId,
        status: 'processing',
        updatedAt: { gt: expect.any(Date) },
      },
      orderBy: { createdAt: 'desc' },
      include,
    })

    const staleCutoff = mockFindFirst.mock.calls[0][0].where.updatedAt.gt as Date
    expect(Date.now() - staleCutoff.getTime()).toBeGreaterThanOrEqual(
      THEMATIC_PROCESSING_STALE_MS - 1000,
    )
  })

  it('should prefer latest completed over a newer failed re-run', async () => {
    const completed = { id: 'completed-1', status: 'completed' }
    mockFindFirst
      .mockResolvedValueOnce(null) // no active processing
      .mockResolvedValueOnce(completed)

    const result = await findPreferredThematicAnalysis(assessmentId)

    expect(result).toEqual(completed)
    expect(mockFindFirst).toHaveBeenNthCalledWith(2, {
      where: {
        assessmentId,
        status: 'completed',
      },
      orderBy: { createdAt: 'desc' },
      include,
    })
    expect(mockFindFirst).toHaveBeenCalledTimes(2)
  })

  it('should return latest failed when no processing or completed exists', async () => {
    const failed = { id: 'failed-1', status: 'failed' }
    mockFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(failed)

    const result = await findPreferredThematicAnalysis(assessmentId)

    expect(result).toEqual(failed)
    expect(mockFindFirst).toHaveBeenNthCalledWith(3, {
      where: {
        assessmentId,
        status: 'failed',
      },
      orderBy: { createdAt: 'desc' },
      include,
    })
  })

  it('should ignore stale processing and fall through to completed', async () => {
    const completed = { id: 'completed-1', status: 'completed' }
    // Active-processing query only matches updatedAt > staleCutoff, so a stale
    // row is simply not returned by the first findFirst.
    mockFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(completed)

    const result = await findPreferredThematicAnalysis(assessmentId)

    expect(result).toEqual(completed)
  })

  it('should return null when no analysis rows exist', async () => {
    mockFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)

    const result = await findPreferredThematicAnalysis(assessmentId)

    expect(result).toBeNull()
  })
})
