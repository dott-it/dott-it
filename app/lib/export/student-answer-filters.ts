import type { Answers } from '@/types'
import { isClassSectionFieldTitle } from '@/lib/forms/class-section-field'
import { isStudentNameFieldTitle } from '@/lib/forms/resolve-learner-name'

/** Type guard: structured answer rows from Google Form / student answer JSON. */
export function isAnswersArray(value: unknown): value is Answers[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        'title' in item &&
        'value' in item,
    )
  )
}

/** Exact header labels that are not student-name prompts and not class-period fields. */
const EXACT_HEADER_TITLES = new Set(['teacher', 'teacher name'])

function normalizeHeaderTitle(title: string): string {
  return title.toLowerCase().trim().replaceAll(/[.:*]+$/g, '').trim()
}

/**
 * Fields kept off the student response and the export.
 * Name prompts follow the same rule the sync uses when it encrypts a value.
 * Hour, period, class, and block stay exact titles so a stem that only
 * mentions those words ("miles per hour", "the teacher's claim") remains visible.
 */
export function isMetadataAnswerField(answer: Answers): boolean {
  if (isStudentNameFieldTitle(answer.title)) {
    return true
  }
  if (isClassSectionFieldTitle(answer.title)) {
    return true
  }
  return EXACT_HEADER_TITLES.has(normalizeHeaderTitle(answer.title))
}

/** Answers shown in export preview and written to history PDF/DOC (same rules). */
export function filterAnswersForExport(answers: unknown): Answers[] {
  if (!isAnswersArray(answers)) return []
  return answers.filter((a) => !isMetadataAnswerField(a))
}
