import {
  normalizeSuggestionFavoritePayload,
  savedFeedbackFavoriteStorageKey,
} from '../normalize-suggestion-favorite'

describe('normalizeSuggestionFavoritePayload', () => {
  it('should accept suggestion and trim fields', () => {
    const r = normalizeSuggestionFavoritePayload({
      type: 'suggestion',
      section: '  Reasoning  ',
      content: '  Add evidence  ',
    })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value).toEqual({
        type: 'suggestion',
        section: 'Reasoning',
        content: 'Add evidence',
      })
    }
  })

  it('should map improvement to suggestion', () => {
    const r = normalizeSuggestionFavoritePayload({
      type: 'improvement',
      section: 'x',
      content: 'body',
    })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.type).toBe('suggestion')
    }
  })

  it('should default empty section per type', () => {
    const sug = normalizeSuggestionFavoritePayload({ type: 'suggestion', section: '', content: 'x' })
    expect(sug.ok).toBe(true)
    if (sug.ok) expect(sug.value.section).toBe('suggestion')

    const str = normalizeSuggestionFavoritePayload({ type: 'strength', section: '', content: 'x' })
    expect(str.ok).toBe(true)
    if (str.ok) expect(str.value.section).toBe('strength')

    const com = normalizeSuggestionFavoritePayload({ type: 'comment', section: '', content: 'x' })
    expect(com.ok).toBe(true)
    if (com.ok) expect(com.value.section).toBe('comment')
  })

  it('should accept strength and comment', () => {
    const s = normalizeSuggestionFavoritePayload({
      type: 'strength',
      section: 'Claim',
      content: 'Nice claim',
    })
    expect(s.ok).toBe(true)
    if (s.ok) expect(s.value.type).toBe('strength')

    const c = normalizeSuggestionFavoritePayload({
      type: 'comment',
      section: 'note',
      content: 'Well done',
    })
    expect(c.ok).toBe(true)
    if (c.ok) expect(c.value.type).toBe('comment')
  })

  it('should reject empty content', () => {
    const r = normalizeSuggestionFavoritePayload({
      type: 'suggestion',
      section: 'a',
      content: '   ',
    })
    expect(r.ok).toBe(false)
  })

  it('should reject unknown types', () => {
    const r = normalizeSuggestionFavoritePayload({
      type: 'other',
      section: 'a',
      content: 'text',
    })
    expect(r.ok).toBe(false)
  })
})

describe('savedFeedbackFavoriteStorageKey', () => {
  it('should return stable keys for equal normalized payloads', () => {
    const a = savedFeedbackFavoriteStorageKey({
      type: 'improvement',
      section: '  x ',
      content: '  body ',
    })
    const b = savedFeedbackFavoriteStorageKey({
      type: 'suggestion',
      section: 'x',
      content: 'body',
    })
    expect(a).toBe(b)
    expect(a).toBeTruthy()
  })

  it('should return null for invalid payloads', () => {
    expect(savedFeedbackFavoriteStorageKey({ type: 'strength', section: 'a', content: '   ' })).toBeNull()
  })
})
