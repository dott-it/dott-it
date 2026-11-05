import type { AssessmentTemplate } from '@/types'
import type { FormSelectOption } from '@/components/backoffice/common/form-field'
import { collapseCaseInsensitiveLabels } from '@/lib/browse-labels'

/**
 * Fields for GET /api/assessment-templates.
 * Teacher edition and answer key stay on the detail route so the list does not download them.
 * Description and grade stay because the list and cards render them.
 */
export const templateListSelect = {
  id: true,
  title: true,
  type: true,
  subject: true,
  description: true,
  gradeLevel: true,
  unitCode: true,
  lessonNumber: true,
} as const

export type TemplateBrowseViewMode = 'grid' | 'list'

export type TemplateBrowseFilters = {
  search: string
  unitCode: string
  lessonNumber: string
  subject: string
  type: string
}

export const emptyTemplateBrowseFilters: TemplateBrowseFilters = {
  search: '',
  unitCode: '',
  lessonNumber: '',
  subject: '',
  type: '',
}

const ALL_VALUE = 'all'

export function normalizeBrowseFilterValue(value: string): string {
  const trimmed = value.trim()
  return !trimmed || trimmed === ALL_VALUE ? '' : trimmed
}

export function hasActiveTemplateBrowseFilters(filters: TemplateBrowseFilters): boolean {
  return (
    Boolean(filters.search.trim()) ||
    Boolean(normalizeBrowseFilterValue(filters.unitCode)) ||
    Boolean(normalizeBrowseFilterValue(filters.lessonNumber)) ||
    Boolean(normalizeBrowseFilterValue(filters.subject)) ||
    Boolean(normalizeBrowseFilterValue(filters.type))
  )
}

/**
 * Client-side browse filters for assessment templates (name search + structural facets).
 * Type matching is case-insensitive so legacy values like "formative" and "Formative" group together.
 */
export function filterAssessmentTemplates(
  templates: AssessmentTemplate[],
  filters: TemplateBrowseFilters,
): AssessmentTemplate[] {
  const search = filters.search.trim().toLowerCase()
  const unitCode = normalizeBrowseFilterValue(filters.unitCode)
  const lessonNumber = normalizeBrowseFilterValue(filters.lessonNumber)
  const subject = normalizeBrowseFilterValue(filters.subject)
  const type = normalizeBrowseFilterValue(filters.type)
  const lessonAsNumber = lessonNumber ? Number.parseInt(lessonNumber, 10) : null

  return templates.filter((template) => {
    if (search && !template.title.toLowerCase().includes(search)) {
      return false
    }

    if (unitCode && (template.unitCode ?? '').trim() !== unitCode) {
      return false
    }

    if (
      lessonAsNumber !== null &&
      !Number.isNaN(lessonAsNumber) &&
      template.lessonNumber !== lessonAsNumber
    ) {
      return false
    }

    if (subject && (template.subject ?? '').trim() !== subject) {
      return false
    }

    if (type && (template.type ?? '').trim().toLowerCase() !== type.toLowerCase()) {
      return false
    }

    return true
  })
}

/**
 * Default browse order: unit code, then lesson number, then title.
 * Templates without a unit sink to the end.
 */
export function sortAssessmentTemplatesByUnit(
  templates: AssessmentTemplate[],
): AssessmentTemplate[] {
  return [...templates].sort((a, b) => {
    const unitA = (a.unitCode ?? '').trim()
    const unitB = (b.unitCode ?? '').trim()

    if (unitA && !unitB) return -1
    if (!unitA && unitB) return 1

    const unitCompare = unitA.localeCompare(unitB, undefined, { numeric: true })
    if (unitCompare !== 0) return unitCompare

    const lessonA = a.lessonNumber ?? Number.POSITIVE_INFINITY
    const lessonB = b.lessonNumber ?? Number.POSITIVE_INFINITY
    if (lessonA !== lessonB) return lessonA - lessonB

    return a.title.localeCompare(b.title)
  })
}

function uniqueSortedStrings(values: Iterable<string>): string[] {
  return [...new Set(values)].filter(Boolean).sort((a, b) => a.localeCompare(b))
}

export function collectTemplateBrowseOptions(templates: AssessmentTemplate[]): {
  units: FormSelectOption[]
  lessons: FormSelectOption[]
  subjects: FormSelectOption[]
  types: FormSelectOption[]
} {
  const units = uniqueSortedStrings(
    templates.map((template) => (template.unitCode ?? '').trim()).filter(Boolean),
  ).map((value) => ({ value, label: `Unit ${value}` }))

  const lessons = [
    ...new Set(
      templates
        .map((template) => template.lessonNumber)
        .filter((value): value is number => typeof value === 'number' && value > 0),
    ),
  ]
    .sort((a, b) => a - b)
    .map((value) => ({ value: String(value), label: `Lesson ${value}` }))

  const subjects = uniqueSortedStrings(
    templates.map((template) => (template.subject ?? '').trim()).filter(Boolean),
  ).map((value) => ({ value, label: value }))

  const types = collapseCaseInsensitiveLabels(
    templates.map((template) => (template.type ?? '').trim()),
  ).map((value) => ({ value, label: value }))

  return { units, lessons, subjects, types }
}

/**
 * Lesson options for the currently selected unit (or all lessons when no unit filter).
 */
export function lessonOptionsForUnit(
  templates: AssessmentTemplate[],
  unitCode: string,
): FormSelectOption[] {
  const selectedUnit = normalizeBrowseFilterValue(unitCode)
  const scoped = selectedUnit
    ? templates.filter((template) => (template.unitCode ?? '').trim() === selectedUnit)
    : templates

  return [
    ...new Set(
      scoped
        .map((template) => template.lessonNumber)
        .filter((value): value is number => typeof value === 'number' && value > 0),
    ),
  ]
    .sort((a, b) => a - b)
    .map((value) => ({ value: String(value), label: `Lesson ${value}` }))
}
