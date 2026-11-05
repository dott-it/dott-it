export type AiFeedbackSectionShape = {
  type?: string | null
  content?: string | null
}

export type AiSuggestionShape = {
  feedback?: AiFeedbackSectionShape[] | null
}

const DISPLAYABLE_TYPES = new Set(['strength', 'suggestion', 'improvement'])

function sectionsOf(suggestions: AiSuggestionShape[] | null | undefined): AiFeedbackSectionShape[] {
  return (suggestions ?? []).flatMap((suggestion) => suggestion.feedback ?? [])
}

/** Strengths or suggestions the teacher can actually see. */
export function hasDisplayableAiFeedback(
  suggestions: AiSuggestionShape[] | null | undefined,
): boolean {
  return sectionsOf(suggestions).some((section) => {
    const type = (section.type ?? '').trim().toLowerCase()
    return DISPLAYABLE_TYPES.has(type) && (section.content ?? '').trim().length > 0
  })
}

/**
 * True when a later sync should call the model again.
 * Empty rows are the parse-failure case. Error rows are the thrown-model case.
 * A general placeholder ("no valid responses", "review manually") stays put.
 */
export function needsAiFeedbackGeneration(
  suggestions: AiSuggestionShape[] | null | undefined,
): boolean {
  if (hasDisplayableAiFeedback(suggestions)) return false
  const sections = sectionsOf(suggestions)
  if (sections.length === 0) return true
  return sections.every((section) => (section.type ?? '').trim().toLowerCase() === 'error')
}
