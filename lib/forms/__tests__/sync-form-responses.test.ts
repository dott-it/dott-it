/**
 * @jest-environment node
 */

const mockFindUnique = jest.fn()
const mockFindFirst = jest.fn()
const mockAssessmentRecordUpsert = jest.fn()
const mockAssessmentRecordUpdate = jest.fn()
const mockStudentAnswerFindFirst = jest.fn()
const mockStudentAnswerUpdate = jest.fn()
const mockAiSuggestionsCreate = jest.fn()
const mockAiSuggestionsDeleteMany = jest.fn()
const mockFeedbackSectionDeleteMany = jest.fn()
const mockRubricEvaluationDeleteMany = jest.fn()
const mockTransaction = jest.fn(async (ops: Promise<unknown>[]) => Promise.all(ops))
const mockRefreshCount = jest.fn()

jest.mock('@/lib/prisma', () => ({
  prisma: {
    assessment: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
    studentAnswer: {
      findFirst: (...args: unknown[]) => mockStudentAnswerFindFirst(...args),
      update: (...args: unknown[]) => mockStudentAnswerUpdate(...args),
    },
    aiSuggestions: {
      create: (...args: unknown[]) => mockAiSuggestionsCreate(...args),
      deleteMany: (...args: unknown[]) => mockAiSuggestionsDeleteMany(...args),
    },
    feedbackSection: {
      deleteMany: (...args: unknown[]) => mockFeedbackSectionDeleteMany(...args),
    },
    rubricEvaluation: {
      create: jest.fn(),
      deleteMany: (...args: unknown[]) => mockRubricEvaluationDeleteMany(...args),
    },
    assessmentRecord: {
      upsert: (...args: unknown[]) => mockAssessmentRecordUpsert(...args),
      update: (...args: unknown[]) => mockAssessmentRecordUpdate(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...(args as [Promise<unknown>[]])),
  },
}))

jest.mock('@/lib/user-prisma', () => ({
  userPrisma: {
    learner: { upsert: jest.fn(), updateMany: jest.fn() },
    teacher: { findFirst: jest.fn() },
  },
}))

jest.mock('@/lib/langsmith/index', () => ({
  generateAiResponse: jest.fn(),
}))

jest.mock('@/lib/thematic-analysis/student-responses-count', () => ({
  refreshStudentResponsesCount: (...args: unknown[]) => mockRefreshCount(...args),
}))

import { generateAiResponse } from '@/lib/langsmith/index'
import { syncFormResponses } from '../sync-form-responses'

function ingestedAnswer(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sa-1',
    assessmentRecordId: 'record-1',
    assessmentRecord: { status: 'ready_for_review' },
    aiSuggestions: [{ id: 'ai-1', feedback: [{ type: 'strength', content: 'Clear claim.' }] }],
    ...overrides,
  }
}

describe('syncFormResponses', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRefreshCount.mockResolvedValue()
  })

  it('should throw when no assessment matches googleFormId (legacy path)', async () => {
    mockFindFirst.mockResolvedValue(null)

    await expect(
      syncFormResponses({
        formId: 'unknown-form',
        formData: { items: [] },
        responseData: [
          {
            responseId: 'resp-1',
            respondentEmail: 'student@example.com',
          },
        ],
      }),
    ).rejects.toThrow('No assessment found for googleFormId: unknown-form')

    expect(mockAssessmentRecordUpsert).not.toHaveBeenCalled()
    expect(mockStudentAnswerFindFirst).not.toHaveBeenCalled()
  })

  it('should throw when assessmentId is provided but assessment is missing', async () => {
    mockFindUnique.mockResolvedValue(null)

    await expect(
      syncFormResponses({
        formId: 'form-1',
        formData: { items: [] },
        responseData: [],
        assessmentId: 'missing-assess',
      }),
    ).rejects.toThrow('Assessment not found')

    expect(mockAssessmentRecordUpsert).not.toHaveBeenCalled()
  })

  it('should succeed without upserting when assessment exists and response list is empty', async () => {
    mockFindFirst.mockResolvedValue({
      id: 'assess-1',
      teacherId: 'teacher-1',
      tenantId: 'tenant-1',
      instructions: '',
      template: { type: 'CER' },
    })

    const result = await syncFormResponses({
      formId: 'form-1',
      formData: { items: [] },
      responseData: [],
    })

    expect(result).toEqual({ assessmentId: 'assess-1' })
    expect(mockAssessmentRecordUpsert).not.toHaveBeenCalled()
    expect(mockRefreshCount).toHaveBeenCalled()
  })

  it('should refresh stored answers from file names and every text choice without rerunning AI', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'assess-1',
      teacherId: 'teacher-1',
      tenantId: 'tenant-1',
      instructions: '',
      template: { type: 'CER' },
    })
    mockStudentAnswerFindFirst.mockResolvedValue(ingestedAnswer())
    mockStudentAnswerUpdate.mockResolvedValue({ id: 'sa-1' })
    mockAssessmentRecordUpdate.mockResolvedValue({ id: 'record-1' })

    const refreshedAnswers = [
      {
        questionId: 'q-file',
        title: '1. Draw two free-body diagrams',
        value: 'diagram.png\nforces.jpg',
      },
      {
        questionId: 'q-multi',
        title: 'Select every system that applies',
        value: 'A. Headed ball\nC. Ground',
      },
    ]

    await syncFormResponses({
      formId: 'form-1',
      assessmentId: 'assess-1',
      formData: {
        items: [
          {
            title: '1. Draw two free-body diagrams',
            questionItem: { question: { questionId: 'q-file' } },
          },
          {
            title: 'Select every system that applies',
            questionItem: { question: { questionId: 'q-multi' } },
          },
        ],
      },
      responseData: [
        {
          responseId: 'resp-1',
          answers: {
            'q-file': {
              fileUploadAnswers: {
                answers: [{ fileName: 'diagram.png' }, { fileName: ' forces.jpg ' }],
              },
            },
            'q-multi': {
              textAnswers: {
                answers: [{ value: 'A. Headed ball' }, { value: 'C. Ground' }],
              },
            },
          },
        },
      ],
    })

    expect(mockStudentAnswerUpdate).toHaveBeenCalledWith({
      where: { id: 'sa-1' },
      data: {
        answers: refreshedAnswers,
      },
    })
    expect(mockAssessmentRecordUpdate).toHaveBeenCalledWith({
      where: { id: 'record-1' },
      data: {
        rawAnswer: refreshedAnswers,
      },
    })
    expect(generateAiResponse).not.toHaveBeenCalled()
    expect(mockAssessmentRecordUpsert).not.toHaveBeenCalled()
    expect(mockTransaction).toHaveBeenCalled()
  })

  it('should leave stored answers in place when the form read has no questions', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'assess-1',
      teacherId: 'teacher-1',
      tenantId: 'tenant-1',
      instructions: '',
      template: { type: 'CER' },
    })
    mockStudentAnswerFindFirst.mockResolvedValue({
      id: 'sa-1',
      assessmentRecordId: 'record-1',
    })

    await syncFormResponses({
      formId: 'form-1',
      assessmentId: 'assess-1',
      formData: { items: [] },
      responseData: [{ responseId: 'resp-1' }],
    })

    expect(mockStudentAnswerUpdate).not.toHaveBeenCalled()
    expect(mockAssessmentRecordUpdate).not.toHaveBeenCalled()
    expect(mockTransaction).not.toHaveBeenCalled()
    expect(generateAiResponse).not.toHaveBeenCalled()
  })

  it('should store the selected Period choice as the class section without rerunning AI', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'assess-1',
      teacherId: 'teacher-1',
      tenantId: 'tenant-1',
      instructions: '',
      template: { type: 'CER' },
    })
    mockStudentAnswerFindFirst.mockResolvedValue(ingestedAnswer())
    mockStudentAnswerUpdate.mockResolvedValue({ id: 'sa-1' })
    mockAssessmentRecordUpdate.mockResolvedValue({ id: 'record-1' })

    await syncFormResponses({
      formId: 'form-1',
      assessmentId: 'assess-1',
      formData: {
        items: [
          {
            title: 'Period',
            questionItem: { question: { questionId: 'q-period' } },
          },
          {
            title: 'Question 3a. Player #84 is running at 7 miles per hour.',
            questionItem: { question: { questionId: 'q-stem' } },
          },
        ],
      },
      responseData: [
        {
          responseId: 'resp-1',
          answers: {
            'q-period': { textAnswers: { answers: [{ value: '7th Hour' }] } },
            'q-stem': { textAnswers: { answers: [{ value: 'C' }] } },
          },
        },
      ],
    })

    expect(mockTransaction).toHaveBeenCalled()
    expect(mockAssessmentRecordUpdate).toHaveBeenCalledWith({
      where: { id: 'record-1' },
      data: {
        rawAnswer: [
          { questionId: 'q-period', title: 'Period', value: '7th Hour' },
          {
            questionId: 'q-stem',
            title: 'Question 3a. Player #84 is running at 7 miles per hour.',
            value: 'C',
          },
        ],
        classSection: '7th Hour',
      },
    })
    expect(generateAiResponse).not.toHaveBeenCalled()
  })

  it('should generate feedback when a synced submission has an empty suggestion row', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'assess-1',
      teacherId: 'teacher-1',
      tenantId: 'tenant-1',
      instructions: 'Grade the claim.',
      template: { type: 'CER' },
    })
    mockStudentAnswerFindFirst.mockResolvedValue(
      ingestedAnswer({
        assessmentRecord: { status: 'shared' },
        aiSuggestions: [{ id: 'ai-empty', feedback: [] }],
      }),
    )
    mockStudentAnswerUpdate.mockResolvedValue({ id: 'sa-1' })
    mockAssessmentRecordUpdate.mockResolvedValue({ id: 'record-1' })
    mockAiSuggestionsCreate.mockResolvedValue({ id: 'ai-new' })
    ;(generateAiResponse as jest.Mock).mockResolvedValue({
      rubricScore: '0/0',
      rubricEvaluation: [],
      feedback: [{ type: 'strength', section: '', content: 'You stated a claim.', order: 1 }],
    })

    await syncFormResponses({
      formId: 'form-1',
      assessmentId: 'assess-1',
      formData: {
        items: [
          {
            title: 'Question 5. Write an argument',
            questionItem: { question: { questionId: 'q-5' } },
          },
        ],
      },
      responseData: [
        {
          responseId: 'resp-1',
          answers: {
            'q-5': { textAnswers: { answers: [{ value: 'System B has more force.' }] } },
          },
        },
      ],
    })

    expect(generateAiResponse).toHaveBeenCalledWith('Grade the claim.', [
      {
        questionId: 'q-5',
        title: 'Question 5. Write an argument',
        value: 'System B has more force.',
      },
    ])
    expect(mockAiSuggestionsDeleteMany).toHaveBeenCalledWith({ where: { id: { in: ['ai-empty'] } } })
    expect(mockAiSuggestionsCreate).toHaveBeenCalled()
    expect(mockAssessmentRecordUpdate).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'ready_for_review' } }),
    )
  })

  it('should leave a general placeholder in place', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'assess-1',
      teacherId: 'teacher-1',
      tenantId: 'tenant-1',
      instructions: '',
      template: { type: 'CER' },
    })
    mockStudentAnswerFindFirst.mockResolvedValue(
      ingestedAnswer({
        aiSuggestions: [
          {
            id: 'ai-general',
            feedback: [{ type: 'general', content: 'No valid responses were found to evaluate.' }],
          },
        ],
      }),
    )
    mockStudentAnswerUpdate.mockResolvedValue({ id: 'sa-1' })
    mockAssessmentRecordUpdate.mockResolvedValue({ id: 'record-1' })

    await syncFormResponses({
      formId: 'form-1',
      assessmentId: 'assess-1',
      formData: {
        items: [
          {
            title: 'Question 1',
            questionItem: { question: { questionId: 'q-1' } },
          },
        ],
      },
      responseData: [
        {
          responseId: 'resp-1',
          answers: { 'q-1': { textAnswers: { answers: [{ value: 'Because.' }] } } },
        },
      ],
    })

    expect(generateAiResponse).not.toHaveBeenCalled()
    expect(mockAiSuggestionsCreate).not.toHaveBeenCalled()
  })

  it('should move handed_in to ready_for_review when missing feedback is generated', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'assess-1',
      teacherId: 'teacher-1',
      tenantId: 'tenant-1',
      instructions: 'Grade the claim.',
      template: { type: 'CER' },
    })
    mockStudentAnswerFindFirst.mockResolvedValue(
      ingestedAnswer({
        assessmentRecord: { status: 'handed_in' },
        aiSuggestions: [{ id: 'ai-empty', feedback: [] }],
      }),
    )
    mockStudentAnswerUpdate.mockResolvedValue({ id: 'sa-1' })
    mockAssessmentRecordUpdate.mockResolvedValue({ id: 'record-1' })
    mockAiSuggestionsCreate.mockResolvedValue({ id: 'ai-new' })
    ;(generateAiResponse as jest.Mock).mockResolvedValue({
      rubricScore: '0/0',
      rubricEvaluation: [],
      feedback: [{ type: 'strength', section: '', content: 'You stated a claim.', order: 1 }],
    })

    await syncFormResponses({
      formId: 'form-1',
      assessmentId: 'assess-1',
      formData: {
        items: [
          {
            title: 'Question 5. Write an argument',
            questionItem: { question: { questionId: 'q-5' } },
          },
        ],
      },
      responseData: [
        {
          responseId: 'resp-1',
          answers: {
            'q-5': { textAnswers: { answers: [{ value: 'System B has more force.' }] } },
          },
        },
      ],
    })

    expect(mockAiSuggestionsCreate).toHaveBeenCalled()
    expect(mockAssessmentRecordUpdate).toHaveBeenCalledWith({
      where: { id: 'record-1' },
      data: { status: 'ready_for_review' },
    })
  })

  it('should leave empty suggestion rows and status alone when regeneration returns only an error', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'assess-1',
      teacherId: 'teacher-1',
      tenantId: 'tenant-1',
      instructions: 'Grade the claim.',
      template: { type: 'CER' },
    })
    mockStudentAnswerFindFirst.mockResolvedValue(
      ingestedAnswer({
        assessmentRecord: { status: 'handed_in' },
        aiSuggestions: [{ id: 'ai-empty', feedback: [] }],
      }),
    )
    mockStudentAnswerUpdate.mockResolvedValue({ id: 'sa-1' })
    mockAssessmentRecordUpdate.mockResolvedValue({ id: 'record-1' })
    ;(generateAiResponse as jest.Mock).mockResolvedValue({
      rubricScore: '0/0',
      rubricEvaluation: [],
      feedback: [
        {
          type: 'error',
          section: 'Error',
          content: 'Unable to generate AI feedback. Please review manually.',
          order: 1,
        },
      ],
    })

    await syncFormResponses({
      formId: 'form-1',
      assessmentId: 'assess-1',
      formData: {
        items: [
          {
            title: 'Question 5. Write an argument',
            questionItem: { question: { questionId: 'q-5' } },
          },
        ],
      },
      responseData: [
        {
          responseId: 'resp-1',
          answers: {
            'q-5': { textAnswers: { answers: [{ value: 'System B has more force.' }] } },
          },
        },
      ],
    })

    expect(generateAiResponse).toHaveBeenCalled()
    expect(mockAiSuggestionsDeleteMany).not.toHaveBeenCalled()
    expect(mockFeedbackSectionDeleteMany).not.toHaveBeenCalled()
    expect(mockAiSuggestionsCreate).not.toHaveBeenCalled()
    expect(mockAssessmentRecordUpdate).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'ready_for_review' } }),
    )
  })

  it('should store a general placeholder from regeneration so later syncs stop retrying', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'assess-1',
      teacherId: 'teacher-1',
      tenantId: 'tenant-1',
      instructions: 'Grade the claim.',
      template: { type: 'CER' },
    })
    mockStudentAnswerFindFirst.mockResolvedValue(
      ingestedAnswer({
        assessmentRecord: { status: 'handed_in' },
        aiSuggestions: [{ id: 'ai-empty', feedback: [] }],
      }),
    )
    mockStudentAnswerUpdate.mockResolvedValue({ id: 'sa-1' })
    mockAssessmentRecordUpdate.mockResolvedValue({ id: 'record-1' })
    mockAiSuggestionsCreate.mockResolvedValue({ id: 'ai-general' })
    ;(generateAiResponse as jest.Mock).mockResolvedValue({
      rubricScore: '0/0',
      rubricEvaluation: [],
      feedback: [
        {
          type: 'general',
          section: 'Feedback',
          content: 'Please review this submission and provide manual feedback.',
          order: 1,
        },
      ],
    })

    await syncFormResponses({
      formId: 'form-1',
      assessmentId: 'assess-1',
      formData: {
        items: [
          {
            title: 'Question 5. Write an argument',
            questionItem: { question: { questionId: 'q-5' } },
          },
        ],
      },
      responseData: [
        {
          responseId: 'resp-1',
          answers: {
            'q-5': { textAnswers: { answers: [{ value: 'System B has more force.' }] } },
          },
        },
      ],
    })

    expect(mockAiSuggestionsDeleteMany).toHaveBeenCalledWith({ where: { id: { in: ['ai-empty'] } } })
    expect(mockAiSuggestionsCreate).toHaveBeenCalled()
    expect(mockAssessmentRecordUpdate).toHaveBeenCalledWith({
      where: { id: 'record-1' },
      data: { status: 'ready_for_review' },
    })
  })

  it('should regenerate when the stored suggestion is only an error', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'assess-1',
      teacherId: 'teacher-1',
      tenantId: 'tenant-1',
      instructions: 'Grade the claim.',
      template: { type: 'CER' },
    })
    mockStudentAnswerFindFirst.mockResolvedValue(
      ingestedAnswer({
        assessmentRecord: { status: 'ready_for_review' },
        aiSuggestions: [
          {
            id: 'ai-error',
            feedback: [
              {
                type: 'error',
                content: 'Unable to generate AI feedback. Please review manually.',
              },
            ],
          },
        ],
      }),
    )
    mockStudentAnswerUpdate.mockResolvedValue({ id: 'sa-1' })
    mockAssessmentRecordUpdate.mockResolvedValue({ id: 'record-1' })
    mockAiSuggestionsCreate.mockResolvedValue({ id: 'ai-new' })
    ;(generateAiResponse as jest.Mock).mockResolvedValue({
      rubricScore: '0/0',
      rubricEvaluation: [],
      feedback: [{ type: 'suggestion', section: '', content: 'Add evidence.', order: 1 }],
    })

    await syncFormResponses({
      formId: 'form-1',
      assessmentId: 'assess-1',
      formData: {
        items: [
          {
            title: 'Question 5. Write an argument',
            questionItem: { question: { questionId: 'q-5' } },
          },
        ],
      },
      responseData: [
        {
          responseId: 'resp-1',
          answers: {
            'q-5': { textAnswers: { answers: [{ value: 'System B has more force.' }] } },
          },
        },
      ],
    })

    expect(generateAiResponse).toHaveBeenCalled()
    expect(mockAiSuggestionsDeleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['ai-error'] } },
    })
    expect(mockAiSuggestionsCreate).toHaveBeenCalled()
    expect(mockAssessmentRecordUpdate).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'ready_for_review' } }),
    )
  })
})
