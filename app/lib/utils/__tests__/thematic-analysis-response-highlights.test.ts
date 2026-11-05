import {
  escapeHtml,
  buildHtmlWithThematicHighlights,
  buildThematicHighlightSegmentsFromAnalysis,
  normalizeQuotesForMatch,
} from '../thematic-analysis-response-highlights'
import type { ThematicAnalysis } from '@/types'

describe('escapeHtml', () => {
  it('should escape HTML special characters', () => {
    expect(escapeHtml('<a>')).toBe('&lt;a&gt;')
    expect(escapeHtml('a & b')).toBe('a &amp; b')
    expect(escapeHtml(`"'`)).toBe('&quot;&#39;')
  })
})

describe('buildHtmlWithThematicHighlights', () => {
  it('should return escaped plain text when there are no phrases', () => {
    expect(buildHtmlWithThematicHighlights('Hello world', [])).toBe('Hello world')
  })

  it('should wrap a need phrase with orange mark classes', () => {
    const html = buildHtmlWithThematicHighlights('The cat sat', [
      { phrase: 'cat', type: 'need' },
    ])
    expect(html).toContain('The ')
    expect(html).toContain('cat')
    expect(html).toContain(' sat')
    expect(html).toContain('!bg-orange-100')
    expect(html).toContain('<mark')
  })

  it('should wrap a strength phrase with green mark classes', () => {
    const html = buildHtmlWithThematicHighlights('Very good work', [
      { phrase: 'good', type: 'strength' },
    ])
    expect(html).toContain('!bg-green-100')
  })

  it('should prefer need styling when intervals overlap', () => {
    const html = buildHtmlWithThematicHighlights('abcdef', [
      { phrase: 'bcd', type: 'strength' },
      { phrase: 'cde', type: 'need' },
    ])
    expect(html).toContain('!bg-orange-100')
    expect(html).not.toContain('!bg-green-100')
  })
  it('should match when only quote style differs', () => {
    const html = buildHtmlWithThematicHighlights(
      'He said "hello" to me',
      [{ phrase: '\u201Chello\u201D', type: 'strength' }],
    )
    expect(html).toContain('!bg-green-100')
    expect(html).toContain('hello')
  })
})

describe('normalizeQuotesForMatch', () => {
  it('should map curly double quotes to ASCII', () => {
    expect(normalizeQuotesForMatch('\u201CHi\u201D')).toBe('"Hi"')
  })
})

describe('buildThematicHighlightSegmentsFromAnalysis', () => {
  const baseAnalysis: ThematicAnalysis = {
    id: 'ta1',
    assessmentId: 'as1',
    status: 'completed',
    responsesCount: 1,
    summary: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      {
        id: 'i1',
        type: 'need',
        title: 'N',
        description: 'D',
        order: 0,
        citations: [
          {
            id: 'c1',
            learnerId: 'learner-1',
            assessmentRecordId: 'rec-1',
            learnerName: 'A',
            highlights: ['alpha phrase'],
            annotation: 'x',
          },
        ],
      },
      {
        id: 'i2',
        type: 'strength',
        title: 'S',
        description: 'D',
        order: 1,
        citations: [
          {
            id: 'c2',
            learnerId: 'learner-2',
            assessmentRecordId: 'rec-2',
            learnerName: 'B',
            highlights: ['beta'],
            annotation: 'y',
          },
        ],
      },
    ],
  }

  it('should include phrases only for matching assessmentRecordId', () => {
    const phrases = buildThematicHighlightSegmentsFromAnalysis(
      baseAnalysis,
      'rec-1',
      'learner-1',
    )
    expect(phrases).toEqual([{ phrase: 'alpha phrase', type: 'need' }])
  })

  it('should match by learnerId when assessmentRecordId is absent', () => {
    const analysis: ThematicAnalysis = {
      ...baseAnalysis,
      items: [
        {
          id: 'i1',
          type: 'strength',
          title: 'T',
          description: 'D',
          order: 0,
          citations: [
            {
              id: 'c1',
              learnerId: 'learner-x',
              learnerName: 'Student',
              highlights: ['gamma'],
              annotation: 'z',
            },
          ],
        },
      ],
    }
    const phrases = buildThematicHighlightSegmentsFromAnalysis(
      analysis,
      'unknown-rec',
      'learner-x',
    )
    expect(phrases).toEqual([{ phrase: 'gamma', type: 'strength' }])
  })
})
