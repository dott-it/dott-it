import { ChatOpenAI } from '@langchain/openai'
import { generateThematicAnalysis } from '../thematic-analysis'

jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn().mockImplementation(() => ({
    invoke: jest.fn(),
  })),
}))

const mockInvoke = (ChatOpenAI as jest.Mock).mock.results[0].value
  .invoke as jest.Mock

describe('generateThematicAnalysis', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should re-throw when the LLM invocation fails', async () => {
    mockInvoke.mockRejectedValue(new Error('LLM unavailable'))

    await expect(
      generateThematicAnalysis(
        {
          curriculumTeachersEdition: '',
          curriculumAnswerKey: '',
          customInstructions: '',
        },
        [{ id: 'student-1', answers: [{ title: 'Q1', value: 'answer' }] }],
      ),
    ).rejects.toThrow('LLM unavailable')
  })

  it('should return parsed output when the LLM invocation succeeds', async () => {
    mockInvoke.mockResolvedValue({
      content: JSON.stringify({
        thematic_analysis: [
          {
            type: 'need',
            title: 'Evidence',
            description: 'Needs evidence',
            citations: [],
          },
        ],
        summary: 'Summary',
      }),
    })

    await expect(
      generateThematicAnalysis(
        {
          curriculumTeachersEdition: '',
          curriculumAnswerKey: '',
          customInstructions: '',
        },
        [{ id: 'student-1', answers: [{ title: 'Q1', value: 'answer' }] }],
      ),
    ).resolves.toEqual({
      thematic_analysis: [
        {
          type: 'need',
          title: 'Evidence',
          description: 'Needs evidence',
          citations: [],
        },
      ],
      summary: 'Summary',
    })
  })
})
