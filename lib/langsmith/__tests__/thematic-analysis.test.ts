import {
  parseThematicAnalysisResponse,
  buildStudentResponseList,
  resolveCitationLearnerId,
} from '../thematic-analysis-utils'

describe('parseThematicAnalysisResponse', () => {
  it('should parse valid JSON response', () => {
    const raw = JSON.stringify({
      thematic_analysis: [
        {
          type: 'need',
          title: 'Biological Accuracy',
          description: 'Students struggle with biological accuracy.',
          citations: [
            {
              student_id: 'student-1',
              highlights: ['Cancer steals resources from the body.'],
              annotation: 'This reflects a common misconception.',
            },
          ],
        },
        {
          type: 'strength',
          title: 'Evidence Use',
          description: 'Students effectively use evidence.',
          citations: [],
        },
      ],
      summary: 'Overview of the analysis.',
    })

    const result = parseThematicAnalysisResponse(raw)

    expect(result.thematic_analysis).toHaveLength(2)
    expect(result.thematic_analysis[0].type).toBe('need')
    expect(result.thematic_analysis[0].title).toBe('Biological Accuracy')
    expect(result.thematic_analysis[0].citations).toHaveLength(1)
    expect(result.thematic_analysis[0].citations[0].student_id).toBe('student-1')
    expect(result.thematic_analysis[0].citations[0].highlights).toEqual([
      'Cancer steals resources from the body.',
    ])
    expect(result.thematic_analysis[1].type).toBe('strength')
    expect(result.thematic_analysis[1].citations).toHaveLength(0)
    expect(result.summary).toBe('Overview of the analysis.')
  })

  it('should handle markdown-wrapped JSON', () => {
    const raw = '```json\n{"thematic_analysis":[],"summary":"test"}\n```'

    const result = parseThematicAnalysisResponse(raw)

    expect(result.thematic_analysis).toHaveLength(0)
    expect(result.summary).toBe('test')
  })

  it('should handle missing thematic_analysis array', () => {
    const raw = JSON.stringify({ summary: 'Only summary' })

    const result = parseThematicAnalysisResponse(raw)

    expect(result.thematic_analysis).toHaveLength(0)
    expect(result.summary).toBe('Only summary')
  })

  it('should handle missing summary', () => {
    const raw = JSON.stringify({
      thematic_analysis: [
        {
          type: 'need',
          title: 'Test',
          description: 'Desc',
          citations: [],
        },
      ],
    })

    const result = parseThematicAnalysisResponse(raw)

    expect(result.thematic_analysis).toHaveLength(1)
    expect(result.summary).toBe('')
  })

  it('should handle citations with missing highlights', () => {
    const raw = JSON.stringify({
      thematic_analysis: [
        {
          type: 'strength',
          title: 'Test',
          description: 'Desc',
          citations: [
            {
              student_id: 's1',
              annotation: 'Good work',
            },
          ],
        },
      ],
      summary: '',
    })

    const result = parseThematicAnalysisResponse(raw)

    expect(result.thematic_analysis[0].citations[0].highlights).toEqual([])
  })

  it('should throw on invalid JSON', () => {
    expect(() => parseThematicAnalysisResponse('not json')).toThrow()
  })

  it('should throw when root JSON is not an object', () => {
    expect(() => parseThematicAnalysisResponse('[]')).toThrow(
      'Thematic analysis response must be a JSON object',
    )
  })

  it('should skip theme items with invalid type or missing required fields', () => {
    const raw = JSON.stringify({
      thematic_analysis: [
        {
          type: 'unknown',
          title: 'Bad type',
          description: 'Desc',
          citations: [],
        },
        {
          type: 'need',
          title: '',
          description: 'Empty title',
          citations: [],
        },
        {
          type: 'strength',
          title: 'Valid',
          description: 'Kept',
          citations: [
            { student_id: '', annotation: 'missing id' },
            {
              student_id: 's1',
              annotation: 'ok',
              highlights: ['phrase', 42, null],
            },
          ],
        },
      ],
      summary: 123,
    })

    const result = parseThematicAnalysisResponse(raw)

    expect(result.thematic_analysis).toHaveLength(1)
    expect(result.thematic_analysis[0]).toEqual({
      type: 'strength',
      title: 'Valid',
      description: 'Kept',
      citations: [
        {
          student_id: 's1',
          annotation: 'ok',
          highlights: ['phrase'],
        },
      ],
    })
    expect(result.summary).toBe('')
  })
})

describe('resolveCitationLearnerId', () => {
  const ordered = ['cmlearneraaa', 'cmlearnerbbb', 'cmlearnerccc']

  it('should return the id when it matches the list exactly', () => {
    expect(resolveCitationLearnerId('cmlearnerbbb', ordered)).toBe('cmlearnerbbb')
  })

  it('should map numeric string to 1-based index', () => {
    expect(resolveCitationLearnerId('1', ordered)).toBe('cmlearneraaa')
    expect(resolveCitationLearnerId('3', ordered)).toBe('cmlearnerccc')
  })

  it('should map "Student N" label to index', () => {
    expect(resolveCitationLearnerId('Student 2', ordered)).toBe('cmlearnerbbb')
    expect(resolveCitationLearnerId('student 1', ordered)).toBe('cmlearneraaa')
  })

  it('should extract embedded id substring', () => {
    expect(
      resolveCitationLearnerId('wrong prefix cmlearneraaa suffix', ordered),
    ).toBe('cmlearneraaa')
  })
})

describe('buildStudentResponseList', () => {
  it('should format student responses correctly', () => {
    const responses = [
      {
        id: 'student-1',
        answers: [
          { title: 'Question 1', value: 'My answer to Q1' },
          { title: 'Question 2', value: 'My answer to Q2' },
        ],
      },
    ]

    const result = buildStudentResponseList(responses)

    expect(result).toContain('Student 1 (id: student-1)')
    expect(result).toContain('(Question 1): My answer to Q1')
    expect(result).toContain('(Question 2): My answer to Q2')
  })

  it('should filter out name-related answers', () => {
    const responses = [
      {
        id: 'student-1',
        answers: [
          { title: 'Student Name', value: 'John Doe' },
          { title: 'Name', value: 'Jane Doe' },
          { title: 'First Name', value: 'Jane' },
          { title: 'Last Name', value: 'Doe' },
          { title: 'Hour', value: '3rd period' },
          {
            title:
              'Please write your name in this format: Last Name, First Name',
            value: 'Doe, Jane',
          },
          { title: 'Question 1', value: 'Real answer' },
        ],
      },
    ]

    const result = buildStudentResponseList(responses)

    expect(result).not.toContain('John Doe')
    expect(result).not.toContain('Jane Doe')
    expect(result).not.toContain('3rd period')
    expect(result).not.toContain('Doe, Jane')
    expect(result).toContain('Real answer')
  })

  it('should keep legitimate questions that contain the word name', () => {
    const responses = [
      {
        id: 'student-1',
        answers: [
          { title: 'Name three organelles', value: 'Nucleus, mitochondria' },
          {
            title: 'What is the chemical name of water?',
            value: 'Dihydrogen monoxide',
          },
          { title: 'Student Name', value: 'Should be filtered' },
        ],
      },
    ]

    const result = buildStudentResponseList(responses)

    expect(result).toContain('Name three organelles')
    expect(result).toContain('Nucleus, mitochondria')
    expect(result).toContain('chemical name of water')
    expect(result).toContain('Dihydrogen monoxide')
    expect(result).not.toContain('Should be filtered')
  })

  it('should filter out empty answers', () => {
    const responses = [
      {
        id: 'student-1',
        answers: [
          { title: 'Question 1', value: '' },
          { title: 'Question 2', value: '  ' },
          { title: 'Question 3', value: 'Valid answer' },
        ],
      },
    ]

    const result = buildStudentResponseList(responses)

    expect(result).toContain('Valid answer')
    expect(result).not.toContain('(Question 1):')
    expect(result).not.toContain('(Question 2):')
  })

  it('should handle multiple students', () => {
    const responses = [
      {
        id: 'student-1',
        answers: [{ title: 'Q1', value: 'Answer 1' }],
      },
      {
        id: 'student-2',
        answers: [{ title: 'Q1', value: 'Answer 2' }],
      },
    ]

    const result = buildStudentResponseList(responses)

    expect(result).toContain('Student 1 (id: student-1)')
    expect(result).toContain('Student 2 (id: student-2)')
  })
})
