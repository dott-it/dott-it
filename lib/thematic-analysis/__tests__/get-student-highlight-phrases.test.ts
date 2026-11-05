import { prisma } from '@/lib/prisma'
import { getStudentHighlightPhrases } from '../get-student-highlight-phrases'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    thematicAnalysis: {
      findFirst: jest.fn(),
    },
  },
}))

const mockFindFirst = prisma.thematicAnalysis.findFirst as jest.Mock

describe('getStudentHighlightPhrases', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return empty array when learnerId is missing', async () => {
    await expect(
      getStudentHighlightPhrases({ assessmentId: 'a1', learnerId: '' }),
    ).resolves.toEqual([])
    expect(mockFindFirst).not.toHaveBeenCalled()
  })

  it('should return empty array when no completed analysis exists', async () => {
    mockFindFirst.mockResolvedValue(null)

    await expect(
      getStudentHighlightPhrases({
        assessmentId: 'a1',
        learnerId: 'learner-1',
      }),
    ).resolves.toEqual([])
  })

  it('should return only highlight phrases for the learner citations', async () => {
    mockFindFirst.mockResolvedValue({
      items: [
        {
          type: 'need',
          citations: [{ highlights: [' weak ', ''] }],
        },
        {
          type: 'strength',
          citations: [{ highlights: ['strong claim'] }],
        },
      ],
    })

    await expect(
      getStudentHighlightPhrases({
        assessmentId: 'a1',
        learnerId: 'learner-1',
      }),
    ).resolves.toEqual([
      { phrase: 'weak', type: 'need' },
      { phrase: 'strong claim', type: 'strength' },
    ])

    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { assessmentId: 'a1', status: 'completed' },
      orderBy: { createdAt: 'desc' },
      select: {
        items: {
          select: {
            type: true,
            citations: {
              where: { learnerId: 'learner-1' },
              select: { highlights: true },
            },
          },
        },
      },
    })
  })
})
