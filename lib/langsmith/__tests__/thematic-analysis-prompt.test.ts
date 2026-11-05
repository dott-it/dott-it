import { buildThematicAnalysisSystemPrompt } from '../thematic-analysis-prompt'
import type { ThematicAnalysisReviewerInstructions } from '@/app/types'

describe('buildThematicAnalysisSystemPrompt', () => {
  const fullReviewer: ThematicAnalysisReviewerInstructions = {
    curriculumTeachersEdition: 'Teachers edition content',
    curriculumAnswerKey: 'Answer key content',
    customInstructions: 'Custom per-assessment instructions',
  }

  it('includes all three reviewer instruction blocks when provided', () => {
    const prompt = buildThematicAnalysisSystemPrompt(fullReviewer)

    expect(prompt).toContain('REVIEWER INSTRUCTIONS')
    expect(prompt).toContain('Teachers edition content')
    expect(prompt).toContain('Answer key content')
    expect(prompt).toContain('Custom per-assessment instructions')
    expect(prompt).toContain('REVIEWER GUIDANCE')
    expect(prompt).toContain('thematic_analysis')
  })

  it('omits empty reviewer sections without extra blank lines', () => {
    const prompt = buildThematicAnalysisSystemPrompt({
      curriculumTeachersEdition: '',
      curriculumAnswerKey: '',
      customInstructions: 'Only custom',
    })

    expect(prompt).toContain('REVIEWER INSTRUCTIONS\nOnly custom')
    expect(prompt).not.toContain('Teachers edition')
    expect(prompt).not.toContain('Answer key')
  })

  it('trims whitespace-only sections', () => {
    const prompt = buildThematicAnalysisSystemPrompt({
      curriculumTeachersEdition: '  ',
      curriculumAnswerKey: 'Key',
      customInstructions: '   ',
    })

    expect(prompt).toContain('REVIEWER INSTRUCTIONS\nKey')
    expect(prompt).not.toMatch(/REVIEWER INSTRUCTIONS\n\nKey/)
  })
})
