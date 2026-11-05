import type { AssessmentRecord, FeedbackSection } from '../../types'
import { pickCanonicalPendingFeedback } from './resolve-canonical-pending-feedback'
import {
  aiTemplateDisplayListKey,
  aiTemplateSemanticKey,
  shouldShowPendingFeedbackSection,
} from './merge-feedback-sections'

/** Client-only section ids (never sent to the API as persisted keys). */
export const OPTIMISTIC_SECTION_ID_PREFIX = 'dott-opt-'

export function isOptimisticFeedbackSectionId(id: string | undefined): boolean {
  return Boolean(id?.startsWith(OPTIMISTIC_SECTION_ID_PREFIX))
}

/**
 * After seeding a completed snapshot into pending, map a source section to the
 * corresponding pending row id. Skips client-only optimistic ids so callers never
 * PATCH/DELETE `dott-opt-*` keys.
 */
export function resolvePendingSectionIdAfterSnapshotSeed(
  rec: AssessmentRecord | undefined,
  sourceSection: FeedbackSection,
): string | undefined {
  const pending = pickCanonicalPendingFeedback(rec?.feedbacks)
  const visible = (pending?.feedbackSections ?? []).filter(
    (s) =>
      shouldShowPendingFeedbackSection(s) && !isOptimisticFeedbackSectionId(s.id),
  )
  const oid = sourceSection.originalSectionId
  if (oid != null && String(oid) !== '') {
    const hit = visible.find((s) => String(s.originalSectionId ?? '') === String(oid))
    if (hit?.id) return hit.id
  }
  const key = aiTemplateSemanticKey(sourceSection)
  const hit = visible.find((s) => aiTemplateSemanticKey(s) === key)
  if (hit?.id) return hit.id
  return undefined
}

/**
 * Whether a draft feedback row should survive cleanup after an AI template body edit.
 * Keeps the edited template's linked copies and rows linked to *other* templates;
 * drops unlinked drafts that still show the pre-edit body (seeded ghosts).
 */
export function shouldKeepDraftSectionAfterAiTemplateEdit(
  section: FeedbackSection,
  templateId: string,
  previousKey: string | null,
): boolean {
  if (previousKey == null) return true
  if (String(section.originalSectionId ?? '') === String(templateId)) return true
  if (
    section.originalSectionId != null &&
    String(section.originalSectionId) !== '' &&
    String(section.originalSectionId) !== String(templateId)
  ) {
    return true
  }
  return aiTemplateDisplayListKey(section) !== previousKey
}

/**
 * Whether an AI suggestion template row should survive cleanup after a body edit.
 * Keeps the edited template; drops other templates that still show the pre-edit body
 * (client-only ghosts that disappear on reload).
 */
export function shouldKeepAiTemplateAfterBodyEdit(
  section: FeedbackSection,
  editedTemplateId: string,
  previousKey: string | null,
): boolean {
  if (previousKey == null) return true
  if (String(section.id) === String(editedTemplateId)) return true
  return aiTemplateDisplayListKey(section) !== previousKey
}

/**
 * Drop pending draft rows that still carry a pre-edit body after a section content change.
 * Keeps the edited row and AI-linked drafts (originalSectionId set) so two legitimate
 * custom cards with the same text are only at risk when both are unlinked customs.
 */
export function shouldKeepDraftAfterSectionContentEdit(
  section: FeedbackSection,
  editedSectionId: string,
  previousKey: string | null,
): boolean {
  if (previousKey == null) return true
  if (String(section.id) === String(editedSectionId)) return true
  if (section.originalSectionId != null && String(section.originalSectionId) !== '') {
    return true
  }
  return aiTemplateDisplayListKey(section) !== previousKey
}

/** Thrown when an optimistic/client-only row cannot be mapped to a persisted id for PATCH. */
export class FeedbackEditNotPersistedError extends Error {
  constructor(message = 'Feedback edit could not be saved yet. Please try again in a moment.') {
    super(message)
    this.name = 'FeedbackEditNotPersistedError'
  }
}
