/**
 * Helpers for PATCH /api/feedback-sections/[id] when editing AI template rows.
 */

export const FEEDBACK_SECTION_PATCH_KEYS = [
  'content',
  'type',
  'section',
  'order',
  'used',
  'discarted',
] as const

export type FeedbackSectionWhitelistPatch = Partial<{
  content: string
  type: string
  section: string
  order: number
  used: boolean
  discarted: boolean
}>

export function parseFeedbackSectionWhitelistPatch(body: unknown): FeedbackSectionWhitelistPatch | null {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) return null
  const raw = body as Record<string, unknown>
  const out: FeedbackSectionWhitelistPatch = {}

  for (const key of FEEDBACK_SECTION_PATCH_KEYS) {
    if (!(key in raw) || raw[key] === undefined) continue
    const v = raw[key]
    switch (key) {
      case 'order': {
        if (typeof v === 'number' && Number.isFinite(v)) {
          out.order = v
        } else if (typeof v === 'string' && v.trim() !== '') {
          const n = Number.parseInt(v, 10)
          if (!Number.isNaN(n)) {
            out.order = n
          }
        }
        break
      }
      case 'used': {
        if (typeof v === 'boolean') {
          out.used = v
        } else if (v === 'true') {
          out.used = true
        } else if (v === 'false') {
          out.used = false
        }
        break
      }
      case 'discarted': {
        if (typeof v === 'boolean') {
          out.discarted = v
        } else if (v === 'true') {
          out.discarted = true
        } else if (v === 'false') {
          out.discarted = false
        }
        break
      }
      case 'content': {
        if (typeof v === 'string') {
          out.content = v
        }
        break
      }
      case 'type': {
        if (typeof v === 'string') {
          out.type = v
        }
        break
      }
      case 'section': {
        if (typeof v === 'string') {
          out.section = v
        }
        break
      }
      default: {
        break
      }
    }
  }

  return Object.keys(out).length > 0 ? out : null
}

export function isAiSuggestionTemplateSection(section: {
  feedbackId: string | null
  aiSuggestionsId: string | null
}): boolean {
  return (
    section.aiSuggestionsId != null &&
    section.aiSuggestionsId !== '' &&
    (section.feedbackId == null || section.feedbackId === '')
  )
}

/**
 * On first content change for an AI-owned template row, persist the previous `content`
 * into `originalAiContent`. Later edits leave `originalAiContent` unchanged.
 */
export function withOriginalAiContentSnapshot(params: {
  section: {
    content: string
    originalAiContent: string | null
    feedbackId: string | null
    aiSuggestionsId: string | null
  }
  patch: FeedbackSectionWhitelistPatch
}): FeedbackSectionWhitelistPatch & { originalAiContent?: string } {
  const { section, patch } = params
  if (!isAiSuggestionTemplateSection(section)) return patch
  if (typeof patch.content !== 'string') return patch
  if (patch.content === section.content) return patch
  if (section.originalAiContent != null) return patch
  return { ...patch, originalAiContent: section.content }
}

export function shouldCascadePendingCopies(
  section: { feedbackId: string | null; aiSuggestionsId: string | null },
  patch: FeedbackSectionWhitelistPatch,
): boolean {
  return (
    isAiSuggestionTemplateSection(section) &&
    (patch.content !== undefined || patch.type !== undefined || patch.section !== undefined)
  )
}
