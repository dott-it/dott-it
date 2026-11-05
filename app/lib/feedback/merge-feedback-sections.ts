import type { FeedbackSection } from '@/app/types'

/**
 * Pending sections are server-driven. Keep only sections that are not discarded.
 */
export function shouldShowPendingFeedbackSection(s: FeedbackSection): boolean {
  return s.discarted !== true
}

/** Stable key for rows that share the same AI text but different DB ids (duplicate creates). */
export function aiTemplateSemanticKey(s: FeedbackSection): string {
  const type = String(s.type ?? '').trim().toLowerCase()
  const section = String(s.section ?? '').trim().toLowerCase()
  const content = String(s.content ?? '')
    .trim()
    .replaceAll(/\s+/g, ' ')
  return `${type}::${section}::${content}`
}

/**
 * Key for merging duplicate AI rows in the **UI list** (post-export, sync quirks, etc.):
 * same normalized type + same body text, ignoring `section` labels and `used` flags.
 */
export function aiTemplateDisplayListKey(s: FeedbackSection): string {
  const raw = String(s.type ?? '').trim().toLowerCase()
  const type = raw === 'improvement' ? 'suggestion' : raw
  const content = String(s.content ?? '')
    .trim()
    .replaceAll(/\s+/g, ' ')
  return `${type}::${content}`
}

/**
 * Deduplicate AI template rows for the strengths/suggestions lists:
 * 1) by `id` (same row returned twice)
 * 2) by {@link aiTemplateDisplayListKey} (same type + body, different ids / section / used)
 */
export function dedupeAiTemplateFeedbackBySectionId(
  sections: FeedbackSection[] | undefined,
): FeedbackSection[] {
  if (!sections?.length) return []
  const byId = new Map<string, FeedbackSection>()
  for (const s of sections) {
    const id = s.id
    if (id != null && id !== '') {
      if (!byId.has(id)) byId.set(id, s)
    } else {
      byId.set(`__no-id-${byId.size}`, s)
    }
  }
  const byIdSorted = [...byId.values()].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  const bySemantic = new Map<string, FeedbackSection>()
  for (const s of byIdSorted) {
    const key = aiTemplateDisplayListKey(s)
    if (!bySemantic.has(key)) bySemantic.set(key, s)
  }
  return [...bySemantic.values()].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}
