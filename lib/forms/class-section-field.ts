import type { Answers } from '@/app/types'

/**
 * Short identity titles for the class-period multiple choice (or short text).
 * Exact match after normalization, so a stem that merely says "miles per hour"
 * or "class period" in a sentence is not the class field.
 */
const CLASS_SECTION_FIELD_TITLES = new Set([
  'hour',
  'section',
  'period',
  'class',
  'block',
  'class period',
  'class section',
  'class hour',
  'hour / section',
  'period / section',
])

export function normalizeClassSectionFieldTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replaceAll(/[.:*]+$/g, '')
    .trim()
    .replaceAll(/\s*\/\s*/g, ' / ')
    .replaceAll(/\s+/g, ' ')
}

export function isClassSectionFieldTitle(title: string): boolean {
  return CLASS_SECTION_FIELD_TITLES.has(normalizeClassSectionFieldTitle(title))
}

/** Selected option (or typed value) from the class-period field, if the form has one. */
export function classSectionFromAnswers(
  answers: Pick<Answers, 'title' | 'value'>[],
): string {
  return answers.find((answer) => isClassSectionFieldTitle(answer.title))?.value?.trim() ?? ''
}
