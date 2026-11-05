import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { savedFeedbackFavoriteStorageKey } from '../app/lib/saved-suggestion-favorite/normalize-suggestion-favorite.ts'

describe('saved suggestion favorite dedupe key', () => {
  it('should treat improvement and suggestion as the same storage key', () => {
    const suggestionKey = savedFeedbackFavoriteStorageKey({
      type: 'suggestion',
      section: 'suggestion',
      content: 'Great work',
    })
    const improvementKey = savedFeedbackFavoriteStorageKey({
      type: 'improvement',
      section: 'suggestion',
      content: 'Great work',
    })
    assert.equal(suggestionKey, improvementKey)
  })

  it('should differ when content differs', () => {
    const a = savedFeedbackFavoriteStorageKey({
      type: 'strength',
      content: 'A',
    })
    const b = savedFeedbackFavoriteStorageKey({
      type: 'strength',
      content: 'B',
    })
    assert.notEqual(a, b)
  })
})
