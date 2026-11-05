import { prisma } from '@/lib/prisma'
import { userPrisma } from '@/lib/user-prisma'
import {
  formatThematicAnalysisResponse,
  type ThematicAnalysisWithRelations,
} from '../format-thematic-analysis-response'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    assessmentRecord: {
      findMany: jest.fn(),
    },
  },
}))

jest.mock('@/lib/user-prisma', () => ({
  userPrisma: {
    learner: {
      findMany: jest.fn(),
    },
  },
}))

jest.mock('@/app/lib/utils', () => ({
  decryptName: (value: string) => (value === 'encrypted:alice' ? 'Alice Smith' : ''),
}))

const mockAssessmentRecordFindMany = prisma.assessmentRecord
  .findMany as jest.MockedFunction<typeof prisma.assessmentRecord.findMany>
const mockLearnerFindMany = userPrisma.learner.findMany as jest.MockedFunction<
  typeof userPrisma.learner.findMany
>

function buildAnalysis(
  overrides: Partial<ThematicAnalysisWithRelations> = {},
): ThematicAnalysisWithRelations {
  return {
    id: 'analysis-1',
    assessmentId: 'assess-1',
    status: 'completed',
    responsesCount: 2,
    summary: 'Class overview',
    createdAt: new Date('2026-05-20T12:00:00.000Z'),
    updatedAt: new Date('2026-05-20T12:00:00.000Z'),
    items: [
      {
        id: 'item-1',
        type: 'need',
        title: 'Evidence',
        description: 'Students need stronger evidence.',
        order: 0,
        citations: [
          {
            id: 'cite-1',
            learnerId: 'learner-aaa',
            learnerName: 'Stored Citation Name',
            highlights: ['needs more data'],
            annotation: 'Weak claim',
          },
        ],
      },
    ],
    ...overrides,
  } as ThematicAnalysisWithRelations
}

describe('formatThematicAnalysisResponse', () => {
  const originalSalt = process.env.NEXT_PUBLIC_STUDENT_NAME_SALT

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_STUDENT_NAME_SALT = 'test-salt'
    mockAssessmentRecordFindMany.mockResolvedValue([
      {
        id: 'record-aaa',
        learnerId: 'learner-aaa',
        studentAnswers: [{ id: 'sa-1' }],
      },
      {
        id: 'record-bbb',
        learnerId: 'learner-bbb',
        studentAnswers: [{ id: 'sa-2' }],
      },
    ] as never)
    mockLearnerFindMany.mockResolvedValue([
      { id: 'learner-aaa', name: 'encrypted:alice' },
      { id: 'learner-bbb', name: 'encrypted:alice' },
    ] as never)
  })

  afterEach(() => {
    if (originalSalt === undefined) {
      delete process.env.NEXT_PUBLIC_STUDENT_NAME_SALT
    } else {
      process.env.NEXT_PUBLIC_STUDENT_NAME_SALT = originalSalt
    }
  })

  it('should return null when analysis is null', async () => {
    await expect(
      formatThematicAnalysisResponse('assess-1', null),
    ).resolves.toBeNull()
    expect(mockAssessmentRecordFindMany).not.toHaveBeenCalled()
  })

  it('should redact learner names by default and skip learner lookups', async () => {
    const result = await formatThematicAnalysisResponse(
      'assess-1',
      buildAnalysis(),
    )

    expect(result?.items[0].citations[0]).toMatchObject({
      learnerId: 'learner-aaa',
      assessmentRecordId: 'record-aaa',
      learnerName: '',
      highlights: ['needs more data'],
    })
    expect(mockLearnerFindMany).not.toHaveBeenCalled()
  })

  it('should ignore includeNames when student name salt is not configured', async () => {
    delete process.env.NEXT_PUBLIC_STUDENT_NAME_SALT

    const result = await formatThematicAnalysisResponse(
      'assess-1',
      buildAnalysis(),
      { includeNames: true },
    )

    expect(result?.items[0].citations[0].learnerName).toBe('')
    expect(mockLearnerFindMany).not.toHaveBeenCalled()
  })

  it('should map items, citations, and assessmentRecordId with names resolved at read time when includeNames is true', async () => {
    const result = await formatThematicAnalysisResponse(
      'assess-1',
      buildAnalysis(),
      { includeNames: true },
    )

    expect(result).toMatchObject({
      id: 'analysis-1',
      assessmentId: 'assess-1',
      status: 'completed',
      summary: 'Class overview',
      items: [
        {
          id: 'item-1',
          type: 'need',
          title: 'Evidence',
          citations: [
            {
              id: 'cite-1',
              learnerId: 'learner-aaa',
              assessmentRecordId: 'record-aaa',
              learnerName: 'Alice Smith',
              highlights: ['needs more data'],
              annotation: 'Weak claim',
            },
          ],
        },
      ],
    })
    expect(mockLearnerFindMany).toHaveBeenCalled()
  })

  it('should resolve numeric citation ids to learner ids and fetch display names when includeNames is true', async () => {
    const result = await formatThematicAnalysisResponse(
      'assess-1',
      buildAnalysis({
        items: [
          {
            id: 'item-1',
            type: 'strength',
            title: 'Clarity',
            description: 'Clear writing',
            order: 0,
            citations: [
              {
                id: 'cite-2',
                learnerId: '2',
                learnerName: '',
                highlights: ['well explained'],
                annotation: 'Strong',
              },
            ],
          },
        ],
      }),
      { includeNames: true },
    )

    expect(result?.items[0].citations[0]).toMatchObject({
      learnerId: 'learner-bbb',
      assessmentRecordId: 'record-bbb',
      learnerName: 'Alice Smith',
    })
    expect(mockLearnerFindMany).toHaveBeenCalledWith({
      where: { id: { in: expect.arrayContaining(['learner-bbb', '2']) } },
      select: { id: true, name: true },
    })
  })

  it('should fall back to student id label when learner name cannot be resolved', async () => {
    mockLearnerFindMany.mockResolvedValue([] as never)

    const result = await formatThematicAnalysisResponse(
      'assess-1',
      buildAnalysis({
        items: [
          {
            id: 'item-1',
            type: 'need',
            title: 'X',
            description: 'Y',
            order: 0,
            citations: [
              {
                id: 'cite-3',
                learnerId: 'unknown-learner-id-xyz',
                learnerName: '',
                highlights: [],
                annotation: '',
              },
            ],
          },
        ],
      }),
      { includeNames: true },
    )

    expect(result?.items[0].citations[0].learnerName).toBe('Student unknown-')
  })

  it('should keep only citations for the requested learner when forLearnerId is set', async () => {
    const result = await formatThematicAnalysisResponse(
      'assess-1',
      buildAnalysis({
        items: [
          {
            id: 'item-1',
            type: 'need',
            title: 'Evidence',
            description: 'D',
            order: 0,
            citations: [
              {
                id: 'cite-1',
                learnerId: 'learner-aaa',
                learnerName: 'A',
                highlights: ['aaa'],
                annotation: 'a',
              },
              {
                id: 'cite-2',
                learnerId: 'learner-bbb',
                learnerName: 'B',
                highlights: ['bbb'],
                annotation: 'b',
              },
            ],
          },
        ],
      }),
      { forLearnerId: 'learner-bbb' },
    )

    expect(result?.items).toHaveLength(1)
    expect(result?.items[0].citations).toHaveLength(1)
    expect(result?.items[0].citations[0].learnerId).toBe('learner-bbb')
    expect(result?.items[0].citations[0].learnerName).toBe('')
  })
})
