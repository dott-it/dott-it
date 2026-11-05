import {
  isAiSuggestionTemplateSection,
  parseFeedbackSectionWhitelistPatch,
  shouldCascadePendingCopies,
  withOriginalAiContentSnapshot,
} from '../ai-feedback-section-update'

describe('parseFeedbackSectionWhitelistPatch', () => {
  it('should ignore unknown keys and originalAiContent from client', () => {
    expect(
      parseFeedbackSectionWhitelistPatch({
        content: 'x',
        originalAiContent: 'hijack',
        extra: 1,
      }),
    ).toEqual({ content: 'x' })
  })

  it('should return null for empty or invalid body', () => {
    expect(parseFeedbackSectionWhitelistPatch({})).toBeNull()
    expect(parseFeedbackSectionWhitelistPatch(null)).toBeNull()
    expect(parseFeedbackSectionWhitelistPatch([])).toBeNull()
  })
})

describe('isAiSuggestionTemplateSection', () => {
  it('should be true when linked to aiSuggestions and not to feedback', () => {
    expect(
      isAiSuggestionTemplateSection({ feedbackId: null, aiSuggestionsId: 'ai1' }),
    ).toBe(true)
    expect(
      isAiSuggestionTemplateSection({ feedbackId: '', aiSuggestionsId: 'ai1' }),
    ).toBe(true)
  })

  it('should be false for pending feedback copies', () => {
    expect(
      isAiSuggestionTemplateSection({ feedbackId: 'fb1', aiSuggestionsId: 'ai1' }),
    ).toBe(false)
  })
})

describe('withOriginalAiContentSnapshot', () => {
  it('should set originalAiContent on first content change for AI template', () => {
    const out = withOriginalAiContentSnapshot({
      section: {
        content: 'from ai',
        originalAiContent: null,
        feedbackId: null,
        aiSuggestionsId: 'ai1',
      },
      patch: { content: 'edited' },
    })
    expect(out).toEqual({ content: 'edited', originalAiContent: 'from ai' })
  })

  it('should not overwrite originalAiContent on later edits', () => {
    const out = withOriginalAiContentSnapshot({
      section: {
        content: 'edited once',
        originalAiContent: 'from ai',
        feedbackId: null,
        aiSuggestionsId: 'ai1',
      },
      patch: { content: 'edited twice' },
    })
    expect(out).toEqual({ content: 'edited twice' })
  })

  it('should not add snapshot when content unchanged', () => {
    const out = withOriginalAiContentSnapshot({
      section: {
        content: 'same',
        originalAiContent: null,
        feedbackId: null,
        aiSuggestionsId: 'ai1',
      },
      patch: { content: 'same' },
    })
    expect(out).toEqual({ content: 'same' })
  })
})

describe('shouldCascadePendingCopies', () => {
  it('should be true for AI template when text fields change', () => {
    expect(
      shouldCascadePendingCopies(
        { feedbackId: null, aiSuggestionsId: 'ai1' },
        { content: 'x' },
      ),
    ).toBe(true)
  })

  it('should be false when only order changes', () => {
    expect(
      shouldCascadePendingCopies(
        { feedbackId: null, aiSuggestionsId: 'ai1' },
        { order: 2 },
      ),
    ).toBe(false)
  })
})
