import type { ActiveAssessment } from '@/types'
import type { FormSelectOption } from '@/components/backoffice/common/form-field'
import { collapseCaseInsensitiveLabels } from '@/lib/browse-labels'
import { getCurrentSchoolYear } from '@/lib/school-year'

export type AssessmentBrowseViewMode = 'grid' | 'list'

/** Server-side scope for the assessments list. "all" omits the schoolYear query param. */
export type AssessmentBrowseSchoolYear = 'current' | 'prior' | 'all'

export const defaultAssessmentBrowseSchoolYear: AssessmentBrowseSchoolYear = 'current'

export function isAssessmentBrowseSchoolYear(value: string): value is AssessmentBrowseSchoolYear {
  return value === 'current' || value === 'prior' || value === 'all'
}

export function assessmentListSchoolYearParam(
  schoolYear: AssessmentBrowseSchoolYear,
): { schoolYear?: 'current' | 'prior' } {
  if (schoolYear === 'all') return {}
  return { schoolYear }
}

/** Tenant, teacher, and school year shown the same way in grid and list. */
export function assessmentBrowseContextLine(assessment: {
  schoolYear?: string | null
  tenant?: { name?: string | null } | null
  teacher?: { name?: string | null; email?: string | null } | null
}): string {
  const teacherLabel = assessment.teacher?.name?.trim() || assessment.teacher?.email?.trim() || ''
  return [assessment.schoolYear?.trim(), assessment.tenant?.name?.trim(), teacherLabel]
    .filter(Boolean)
    .join(' · ')
}

export function assessmentBrowseSchoolYearOptions(now: Date = new Date()): FormSelectOption[] {
  const current = getCurrentSchoolYear(now)
  return [
    { value: 'current', label: `Current (${current})` },
    { value: 'prior', label: 'Prior years' },
    { value: 'all', label: 'All years' },
  ]
}

export type AssessmentBrowseFilters = {
  search: string
  unitCode: string
  lessonNumber: string
  subject: string
  type: string
}

export const emptyAssessmentBrowseFilters: AssessmentBrowseFilters = {
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

export function hasActiveAssessmentBrowseFilters(filters: AssessmentBrowseFilters): boolean {
  return (
    Boolean(filters.search.trim()) ||
    Boolean(normalizeBrowseFilterValue(filters.unitCode)) ||
    Boolean(normalizeBrowseFilterValue(filters.lessonNumber)) ||
    Boolean(normalizeBrowseFilterValue(filters.subject)) ||
    Boolean(normalizeBrowseFilterValue(filters.type))
  )
}

function assessmentUnitCode(assessment: ActiveAssessment): string {
  return (assessment.unitCode ?? '').trim()
}

function assessmentLessonNumber(assessment: ActiveAssessment): number | null {
  if (typeof assessment.lessonNumber === 'number') {
    return assessment.lessonNumber
  }
  if (typeof assessment.template?.lessonNumber === 'number') {
    return assessment.template.lessonNumber
  }
  return null
}

/**
 * Client-side browse filters for backoffice assessments.
 * Search matches title, unit code, description, subject, and tenant name.
 * Unit name is excluded so a synthetic label cannot match.
 * Type matching is case-insensitive so legacy values like "formative" and "Formative" group together.
 */
export function filterAssessments(
  assessments: ActiveAssessment[],
  filters: AssessmentBrowseFilters,
): ActiveAssessment[] {
  const search = filters.search.trim().toLowerCase()
  const unitCode = normalizeBrowseFilterValue(filters.unitCode)
  const lessonNumber = normalizeBrowseFilterValue(filters.lessonNumber)
  const subject = normalizeBrowseFilterValue(filters.subject)
  const type = normalizeBrowseFilterValue(filters.type)
  const lessonAsNumber = lessonNumber ? Number.parseInt(lessonNumber, 10) : null

  return assessments.filter((assessment) => {
    if (search) {
      const title = assessment.title.toLowerCase()
      const unitCodeText = assessmentUnitCode(assessment).toLowerCase()
      const description = (assessment.description ?? '').toLowerCase()
      const subjectText = (assessment.subject ?? '').toLowerCase()
      const tenantName = (assessment.tenant?.name ?? '').toLowerCase()
      if (
        !title.includes(search) &&
        !unitCodeText.includes(search) &&
        !description.includes(search) &&
        !subjectText.includes(search) &&
        !tenantName.includes(search)
      ) {
        return false
      }
    }

    if (unitCode && assessmentUnitCode(assessment) !== unitCode) {
      return false
    }

    if (
      lessonAsNumber !== null &&
      !Number.isNaN(lessonAsNumber) &&
      assessmentLessonNumber(assessment) !== lessonAsNumber
    ) {
      return false
    }

    if (subject && (assessment.subject ?? '').trim() !== subject) {
      return false
    }

    if (type && (assessment.type ?? '').trim().toLowerCase() !== type.toLowerCase()) {
      return false
    }

    return true
  })
}

/**
 * Default browse order: unit code, then lesson number, then title.
 * Assessments without a unit sink to the end.
 */
export function sortAssessmentsByUnit(assessments: ActiveAssessment[]): ActiveAssessment[] {
  return [...assessments].sort((a, b) => {
    const unitA = assessmentUnitCode(a)
    const unitB = assessmentUnitCode(b)

    if (unitA && !unitB) return -1
    if (!unitA && unitB) return 1

    const unitCompare = unitA.localeCompare(unitB, undefined, { numeric: true })
    if (unitCompare !== 0) return unitCompare

    const lessonA = assessmentLessonNumber(a) ?? Number.POSITIVE_INFINITY
    const lessonB = assessmentLessonNumber(b) ?? Number.POSITIVE_INFINITY
    if (lessonA !== lessonB) return lessonA - lessonB

    return a.title.localeCompare(b.title)
  })
}

function uniqueSortedStrings(values: Iterable<string>): string[] {
  return [...new Set(values)].filter(Boolean).sort((a, b) => a.localeCompare(b))
}

export function collectAssessmentBrowseOptions(assessments: ActiveAssessment[]): {
  units: FormSelectOption[]
  lessons: FormSelectOption[]
  subjects: FormSelectOption[]
  types: FormSelectOption[]
} {
  const units = uniqueSortedStrings(
    assessments.map((assessment) => assessmentUnitCode(assessment)).filter(Boolean),
  ).map((value) => ({ value, label: `Unit ${value}` }))

  const lessons = [
    ...new Set(
      assessments
        .map((assessment) => assessmentLessonNumber(assessment))
        .filter((value): value is number => typeof value === 'number' && value > 0),
    ),
  ]
    .sort((a, b) => a - b)
    .map((value) => ({ value: String(value), label: `Lesson ${value}` }))

  const subjects = uniqueSortedStrings(
    assessments.map((assessment) => (assessment.subject ?? '').trim()).filter(Boolean),
  ).map((value) => ({ value, label: value }))

  const types = collapseCaseInsensitiveLabels(
    assessments.map((assessment) => (assessment.type ?? '').trim()),
  ).map((value) => ({ value, label: value }))

  return { units, lessons, subjects, types }
}

/**
 * Lesson options for the currently selected unit (or all lessons when no unit filter).
 */
export function lessonOptionsForAssessmentUnit(
  assessments: ActiveAssessment[],
  unitCode: string,
): FormSelectOption[] {
  const selectedUnit = normalizeBrowseFilterValue(unitCode)
  const scoped = selectedUnit
    ? assessments.filter((assessment) => assessmentUnitCode(assessment) === selectedUnit)
    : assessments

  return [
    ...new Set(
      scoped
        .map((assessment) => assessmentLessonNumber(assessment))
        .filter((value): value is number => typeof value === 'number' && value > 0),
    ),
  ]
    .sort((a, b) => a - b)
    .map((value) => ({ value: String(value), label: `Lesson ${value}` }))
}
