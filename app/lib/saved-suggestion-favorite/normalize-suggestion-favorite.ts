export type NormalizedFeedbackFavoriteType = 'strength' | 'suggestion' | 'comment'

export type NormalizedFeedbackFavorite = {
  type: NormalizedFeedbackFavoriteType
  section: string
  content: string
}

export type NormalizeSavedFeedbackFavoriteResult =
  | { ok: true; value: NormalizedFeedbackFavorite }
  | { ok: false; error: string }

function defaultSectionForType(t: NormalizedFeedbackFavoriteType): string {
  if (t === 'suggestion') return 'suggestion'
  if (t === 'comment') return 'comment'
  return 'strength'
}

/**
 * Validates and normalizes body for saving a feedback favorite (API + client).
 * Allowed types: `strength`, `suggestion`, `comment`; `improvement` maps to `suggestion`.
 */
export function normalizeSuggestionFavoritePayload(input: {
  type?: unknown
  section?: unknown
  content?: unknown
}): NormalizeSavedFeedbackFavoriteResult {
  const content = String(input.content ?? '').trim()
  if (!content) {
    return { ok: false, error: 'content is required' }
  }

  const rawType = String(input.type ?? 'suggestion').trim().toLowerCase()
  let normalizedType: NormalizedFeedbackFavoriteType
  switch (rawType) {
    case 'improvement':
    case 'suggestion': {
      normalizedType = 'suggestion'
      break
    }
    case 'comment': {
      normalizedType = 'comment'
      break
    }
    case 'strength': {
      normalizedType = 'strength'
      break
    }
    default: {
      return { ok: false, error: 'type must be strength, suggestion, or comment' }
    }
  }

  let section = String(input.section ?? '').trim()
  if (!section) {
    section = defaultSectionForType(normalizedType)
  }

  return {
    ok: true,
    value: { type: normalizedType, section, content },
  }
}

/**
 * Stable key for comparing a feedback row with saved favorites (same rules as persist).
 */
export function savedFeedbackFavoriteStorageKey(input: {
  type?: unknown
  section?: unknown
  content?: unknown
}): string | null {
  const n = normalizeSuggestionFavoritePayload(input)
  if (!n.ok) return null
  const { type, section, content } = n.value
  return JSON.stringify([type, section, content])
}
