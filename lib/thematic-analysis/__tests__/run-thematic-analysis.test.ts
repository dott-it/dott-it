import { prisma } from '@/lib/prisma'
import { generateThematicAnalysis } from '@/lib/langsmith/thematic-analysis'
import { formatInstructions } from '@/app/(dashboard)/backoffice/assessments/utils/format-instructions'
import { THEMATIC_PROCESSING_STALE_MS } from '../first-run-eligibility'
import {
  RunThematicAnalysisError,
  THEMATIC_MANUAL_DAILY_MAX_RUNS,
  THEMATIC_MANUAL_RUN_COOLDOWN_MS,
  runThematicAnalysis,
} from '../run-thematic-analysis'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    assessment: { findUnique: jest.fn() },
    assessmentRecord: { findMany: jest.fn() },
    thematicAnalysis: {
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    thematicAnalysisItem: { create: jest.fn(), deleteMany: jest.fn() },
    $transaction: jest.fn(),
  },
}))

jest.mock('@/lib/langsmith/thematic-analysis', () => ({
  generateThematicAnalysis: jest.fn(),
}))

jest.mock(
  '@/app/(dashboard)/backoffice/assessments/utils/format-instructions',
  () => ({
    formatInstructions: jest.fn(() => 'formatted reviewer instructions'),
  }),
)

const mockAssessmentFindUnique = prisma.assessment.findUnique as jest.Mock
const mockAssessmentRecordFindMany = prisma.assessmentRecord.findMany as jest.Mock
const mockThematicAnalysisCreate = prisma.thematicAnalysis.create as jest.Mock
const mockThematicAnalysisUpdate = prisma.thematicAnalysis.update as jest.Mock
const mockThematicAnalysisUpdateMany = prisma.thematicAnalysis.updateMany as jest.Mock
const mockThematicAnalysisFindFirst = prisma.thematicAnalysis.findFirst as jest.Mock
const mockThematicAnalysisCount = prisma.thematicAnalysis.count as jest.Mock
const mockThematicAnalysisItemCreate = prisma.thematicAnalysisItem.create as jest.Mock
const mockThematicAnalysisItemDeleteMany = prisma.thematicAnalysisItem
  .deleteMany as jest.Mock
const mockTransaction = prisma.$transaction as jest.Mock
const mockGenerateThematicAnalysis = generateThematicAnalysis as jest.Mock
const mockFormatInstructions = formatInstructions as jest.Mock

const assessmentId = 'assess-1'
const learnerId = 'cmlearneraaa111'

const completedAnalysis = {
  id: 'analysis-1',
  assessmentId,
  status: 'completed',
  responsesCount: 1,
  summary: 'Overall summary',
  createdAt: new Date('2026-05-20T12:00:00.000Z'),
  updatedAt: new Date('2026-05-20T12:00:00.000Z'),
  items: [
    {
      id: 'item-1',
      type: 'need',
      title: 'Evidence',
      description: 'Needs evidence',
      order: 0,
      citations: [
        {
          id: 'cite-1',
          learnerId,
          learnerName: '',
          highlights: ['weak claim'],
          annotation: 'Add data',
        },
      ],
    },
  ],
}

const tx = {
  thematicAnalysis: {
    updateMany: mockThematicAnalysisUpdateMany,
    findFirst: mockThematicAnalysisFindFirst,
    count: mockThematicAnalysisCount,
    create: mockThematicAnalysisCreate,
    update: mockThematicAnalysisUpdate,
  },
  thematicAnalysisItem: {
    create: mockThematicAnalysisItemCreate,
    deleteMany: mockThematicAnalysisItemDeleteMany,
  },
}

describe('runThematicAnalysis', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAssessmentFindUnique.mockResolvedValue({
      id: assessmentId,
      instructions: { sections: [] },
      template: {
        curriculumTeachersEdition: 'teacher edition',
        curriculumAnswerKey: 'answer key',
      },
    })
    mockAssessmentRecordFindMany.mockResolvedValue([
      {
        learnerId,
        studentAnswers: [
          {
            answers: [{ title: 'Question 1', value: 'My response text' }],
          },
        ],
      },
    ])
    mockThematicAnalysisUpdateMany.mockResolvedValue({ count: 0 })
    mockThematicAnalysisFindFirst.mockResolvedValue(null)
    mockThematicAnalysisCount.mockResolvedValue(0)
    mockThematicAnalysisCreate.mockResolvedValue({
      id: 'analysis-1',
      assessmentId,
      status: 'processing',
      responsesCount: 1,
    })
    mockTransaction.mockImplementation(async (fn: (client: typeof tx) => unknown) =>
      fn(tx),
    )
    mockGenerateThematicAnalysis.mockResolvedValue({
      thematic_analysis: [
        {
          type: 'need',
          title: 'Evidence',
          description: 'Needs evidence',
          citations: [
            {
              student_id: '1',
              highlights: ['weak claim'],
              annotation: 'Add data',
            },
          ],
        },
      ],
      summary: 'Overall summary',
    })
    mockThematicAnalysisItemCreate.mockResolvedValue({ id: 'item-1' })
    mockThematicAnalysisItemDeleteMany.mockResolvedValue({ count: 0 })
    mockThematicAnalysisUpdate.mockResolvedValue(completedAnalysis)
  })

  it('should throw assessment_not_found when assessment is missing', async () => {
    mockAssessmentFindUnique.mockResolvedValue(null)

    await expect(runThematicAnalysis(assessmentId)).rejects.toMatchObject({
      code: 'assessment_not_found',
    })
    expect(mockTransaction).not.toHaveBeenCalled()
  })

  it('should throw no_responses when no student answers exist', async () => {
    mockAssessmentRecordFindMany.mockResolvedValue([
      { learnerId, studentAnswers: [] },
    ])

    await expect(runThematicAnalysis(assessmentId)).rejects.toMatchObject({
      code: 'no_responses',
    })
    expect(mockTransaction).not.toHaveBeenCalled()
  })

  it('should mark stale processing rows as failed before starting a new run', async () => {
    await runThematicAnalysis(assessmentId)

    expect(mockThematicAnalysisUpdateMany).toHaveBeenCalledWith({
      where: {
        assessmentId,
        status: 'processing',
        updatedAt: {
          lte: expect.any(Date),
        },
      },
      data: { status: 'failed' },
    })

    const staleCutoff =
      mockThematicAnalysisUpdateMany.mock.calls[0][0].where.updatedAt.lte as Date
    expect(Date.now() - staleCutoff.getTime()).toBeGreaterThanOrEqual(
      THEMATIC_PROCESSING_STALE_MS - 1000,
    )
  })

  it('should throw already_in_progress when a recent processing row exists', async () => {
    mockThematicAnalysisFindFirst.mockResolvedValue({
      id: 'analysis-active',
      status: 'processing',
    })

    await expect(runThematicAnalysis(assessmentId)).rejects.toMatchObject({
      code: 'already_in_progress',
    })

    expect(mockThematicAnalysisCreate).not.toHaveBeenCalled()
    expect(mockGenerateThematicAnalysis).not.toHaveBeenCalled()
  })

  it('should map serializable conflicts to already_in_progress', async () => {
    mockTransaction.mockRejectedValue({ code: 'P2034', message: 'conflict' })

    await expect(runThematicAnalysis(assessmentId)).rejects.toMatchObject({
      code: 'already_in_progress',
    })
  })

  it('should throw rate_limited when manual cooldown is enabled and a recent completed run exists', async () => {
    mockThematicAnalysisFindFirst
      .mockResolvedValueOnce(null) // no active processing
      .mockResolvedValueOnce({
        id: 'analysis-recent',
        status: 'completed',
        createdAt: new Date(),
      })

    await expect(
      runThematicAnalysis(assessmentId, { enforceManualCooldown: true }),
    ).rejects.toMatchObject({
      code: 'rate_limited',
      message: 'Please wait before running analysis again',
    })

    expect(mockTransaction).toHaveBeenCalledWith(
      expect.any(Function),
      { isolationLevel: 'Serializable' },
    )
    expect(mockThematicAnalysisCreate).not.toHaveBeenCalled()
    expect(mockGenerateThematicAnalysis).not.toHaveBeenCalled()
    expect(mockThematicAnalysisCount).not.toHaveBeenCalled()
  })

  it('should throw rate_limited when the daily manual run budget is exhausted', async () => {
    mockThematicAnalysisFindFirst
      .mockResolvedValueOnce(null) // no active processing
      .mockResolvedValueOnce(null) // cooldown ok
    mockThematicAnalysisCount.mockResolvedValue(THEMATIC_MANUAL_DAILY_MAX_RUNS)

    await expect(
      runThematicAnalysis(assessmentId, { enforceManualCooldown: true }),
    ).rejects.toMatchObject({
      code: 'rate_limited',
      message: 'Daily analysis limit reached for this assessment',
    })

    expect(mockTransaction).toHaveBeenCalledWith(
      expect.any(Function),
      { isolationLevel: 'Serializable' },
    )
    expect(mockThematicAnalysisCount).toHaveBeenCalledWith({
      where: {
        assessmentId,
        createdAt: { gt: expect.any(Date) },
      },
    })
    expect(mockThematicAnalysisCreate).not.toHaveBeenCalled()
    expect(mockGenerateThematicAnalysis).not.toHaveBeenCalled()
  })

  it('should allow manual rerun when the latest completed run is outside cooldown', async () => {
    mockThematicAnalysisFindFirst
      .mockResolvedValueOnce(null) // in-progress check
      .mockResolvedValueOnce(null) // cooldown check
    mockThematicAnalysisCount.mockResolvedValue(THEMATIC_MANUAL_DAILY_MAX_RUNS - 1)

    await runThematicAnalysis(assessmentId, { enforceManualCooldown: true })

    expect(mockThematicAnalysisCreate).toHaveBeenCalled()
  })

  it('should allow manual rerun after a recent failed run', async () => {
    mockThematicAnalysisFindFirst
      .mockResolvedValueOnce(null) // in-progress check
      .mockResolvedValueOnce(null) // cooldown check (no recent completed)
    mockThematicAnalysisCount.mockResolvedValue(0)

    await runThematicAnalysis(assessmentId, { enforceManualCooldown: true })

    expect(mockThematicAnalysisFindFirst).toHaveBeenNthCalledWith(2, {
      where: {
        assessmentId,
        status: 'completed',
        createdAt: {
          gt: expect.any(Date),
        },
      },
    })

    const cooldownCutoff =
      mockThematicAnalysisFindFirst.mock.calls[1][0].where.createdAt.gt as Date
    expect(Date.now() - cooldownCutoff.getTime()).toBeGreaterThanOrEqual(
      THEMATIC_MANUAL_RUN_COOLDOWN_MS - 1000,
    )
    expect(mockThematicAnalysisCreate).toHaveBeenCalled()
  })

  it('should not enforce manual cooldown for cron-triggered runs', async () => {
    await runThematicAnalysis(assessmentId)

    expect(mockThematicAnalysisFindFirst).toHaveBeenCalledTimes(1)
    expect(mockThematicAnalysisCount).not.toHaveBeenCalled()
    expect(mockThematicAnalysisCreate).toHaveBeenCalled()
  })

  it('should mark analysis failed and throw llm_failed when generation throws', async () => {
    mockGenerateThematicAnalysis.mockRejectedValue(new Error('LLM unavailable'))

    await expect(runThematicAnalysis(assessmentId)).rejects.toMatchObject({
      code: 'llm_failed',
    })

    expect(mockThematicAnalysisUpdate).toHaveBeenCalledWith({
      where: { id: 'analysis-1' },
      data: { status: 'failed' },
    })
    expect(mockThematicAnalysisItemCreate).not.toHaveBeenCalled()
  })

  it('should mark analysis failed and throw llm_failed when LLM returns empty output', async () => {
    mockGenerateThematicAnalysis.mockResolvedValue({
      thematic_analysis: [],
      summary: '',
    })

    await expect(runThematicAnalysis(assessmentId)).rejects.toMatchObject({
      code: 'llm_failed',
    })

    expect(mockThematicAnalysisUpdate).toHaveBeenCalledWith({
      where: { id: 'analysis-1' },
      data: { status: 'failed' },
    })
    expect(mockThematicAnalysisItemCreate).not.toHaveBeenCalled()
  })

  it('should purge partial items and mark failed when persisting theme items throws', async () => {
    mockThematicAnalysisItemCreate.mockRejectedValue(new Error('insert failed'))

    await expect(runThematicAnalysis(assessmentId)).rejects.toMatchObject({
      code: 'llm_failed',
    })

    expect(mockThematicAnalysisItemDeleteMany).toHaveBeenCalledWith({
      where: { thematicAnalysisId: 'analysis-1' },
    })
    expect(mockThematicAnalysisUpdate).toHaveBeenCalledWith({
      where: { id: 'analysis-1' },
      data: { status: 'failed' },
    })
  })

  it('should persist themes, citations, and return completed analysis', async () => {
    const result = await runThematicAnalysis(assessmentId)

    expect(mockFormatInstructions).toHaveBeenCalled()
    expect(mockGenerateThematicAnalysis).toHaveBeenCalledWith(
      {
        curriculumTeachersEdition: 'teacher edition',
        curriculumAnswerKey: 'answer key',
        customInstructions: 'formatted reviewer instructions',
      },
      [
        {
          id: learnerId,
          answers: [{ title: 'Question 1', value: 'My response text' }],
        },
      ],
    )
    expect(mockTransaction).toHaveBeenCalledWith(
      expect.any(Function),
      { isolationLevel: 'Serializable' },
    )
    expect(mockThematicAnalysisCreate).toHaveBeenCalledWith({
      data: {
        assessmentId,
        status: 'processing',
        responsesCount: 1,
      },
    })
    expect(mockThematicAnalysisItemCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        thematicAnalysisId: 'analysis-1',
        type: 'need',
        title: 'Evidence',
        citations: {
          create: [
            expect.objectContaining({
              learnerId,
              learnerName: '',
              highlights: ['weak claim'],
            }),
          ],
        },
      }),
    })
    expect(mockThematicAnalysisUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: { id: 'analysis-1' },
        data: { status: 'completed', summary: 'Overall summary' },
      }),
    )
    expect(result).toEqual(completedAnalysis)
  })
})

describe('RunThematicAnalysisError', () => {
  it('should expose error code on the error instance', () => {
    const error = new RunThematicAnalysisError('no_responses', 'No student responses')
    expect(error).toBeInstanceOf(Error)
    expect(error.code).toBe('no_responses')
    expect(error.message).toBe('No student responses')
  })
})
