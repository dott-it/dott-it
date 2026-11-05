import type { FormSelectOption } from '@/components/backoffice/common/form-field'
import { listIngestedUnitCodes } from '@/lib/library/ingest/ingested-unit-codes'
import {
  listOpenSciEdUnitOptions,
  listOpenSciEdUnitOptionsForGrade,
} from '@/lib/openscied-unit-options'

export const TEMPLATE_TYPE_OPTIONS = [
  'Formative',
  'Summative',
  'Self-Assessment',
  'Peer-Assessment',
  'Progress Tracker',
  'Entrance/Exit Ticket',
  'Other',
] as const

export const TEMPLATE_GRADE_LEVEL_OPTIONS = [
  'Kindergarten',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
] as const

export const TEMPLATE_SUBJECT_OPTIONS = [
  'Life Science',
  'Physical Science',
  'Earth & Space Science',
  'Biology',
  'Chemistry',
  'Physics',
] as const

export type TemplateType = (typeof TEMPLATE_TYPE_OPTIONS)[number]
export type TemplateGradeLevel = (typeof TEMPLATE_GRADE_LEVEL_OPTIONS)[number]
export type TemplateSubject = (typeof TEMPLATE_SUBJECT_OPTIONS)[number]

function toSelectOptions(values: readonly string[]): FormSelectOption[] {
  return values.map((value) => ({ value, label: value }))
}

const ingestedUnitCodeSet = new Set(listIngestedUnitCodes())

/** Units that have library ingest data (lessons / TE) available for template hydration. */
function listAvailableOpenSciEdUnitOptions() {
  return listOpenSciEdUnitOptions().filter((unit) => ingestedUnitCodeSet.has(unit.value))
}

function listAvailableOpenSciEdUnitOptionsForGrade(gradeLevel: string | null | undefined) {
  return listOpenSciEdUnitOptionsForGrade(gradeLevel).filter((unit) =>
    ingestedUnitCodeSet.has(unit.value),
  )
}

export const templateTypeSelectOptions = toSelectOptions(TEMPLATE_TYPE_OPTIONS)
export const templateGradeLevelSelectOptions = toSelectOptions(TEMPLATE_GRADE_LEVEL_OPTIONS)
export const templateSubjectSelectOptions = toSelectOptions(TEMPLATE_SUBJECT_OPTIONS)

export const templateGradeLevelSelectOptionsWithNone: FormSelectOption[] = [
  { value: 'none', label: 'No grade level' },
  ...templateGradeLevelSelectOptions,
]

export const templateUnitSelectOptions: FormSelectOption[] = listAvailableOpenSciEdUnitOptions().map(
  (unit) => ({
    value: unit.value,
    label: unit.label,
  }),
)

export const templateUnitSelectOptionsWithNone: FormSelectOption[] = [
  { value: 'none', label: 'No unit' },
  ...templateUnitSelectOptions,
]

export function templateUnitSelectOptionsForGrade(
  gradeLevel: string | null | undefined,
): FormSelectOption[] {
  return [
    { value: 'none', label: 'No unit' },
    ...listAvailableOpenSciEdUnitOptionsForGrade(gradeLevel).map((unit) => ({
      value: unit.value,
      label: unit.label,
    })),
  ]
}
