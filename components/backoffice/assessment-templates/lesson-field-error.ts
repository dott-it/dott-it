import type { FormSelectOption } from '@/components/backoffice/common/form-field'

function isPositiveLesson(lessonNumber: string): boolean {
  const lesson = Number.parseInt(lessonNumber, 10)
  return String(lesson) === lessonNumber && lesson >= 1
}

/**
 * Keep a saved lesson visible when the unit catalog has not loaded yet.
 * Matches the unit select, which appends an unknown unit instead of blanking it.
 */
export function resolveEditLessonOptions(
  lessonOptions: FormSelectOption[],
  lessonNumber: string,
): FormSelectOption[] {
  const lesson = lessonNumber.trim()
  if (!lesson || lessonOptions.some((option) => option.value === lesson)) {
    return lessonOptions
  }
  return [...lessonOptions, { value: lesson, label: `Lesson ${lesson}` }]
}

/** Drop "No unit" once the saved template already has a unit. */
export function resolveEditUnitOptions(
  options: FormSelectOption[],
  input: { allowEmptyUnit: boolean; unitCode: string },
): FormSelectOption[] {
  const base = input.allowEmptyUnit
    ? options
    : options.filter((option) => option.value !== 'none')
  const unitCode = input.unitCode.trim()
  if (unitCode && unitCode !== 'none' && !base.some((option) => option.value === unitCode)) {
    return [...base, { value: unitCode, label: unitCode }]
  }
  return base
}

/** True when the form still has the unit and lesson stored on the template. */
export function savedTemplateStructureMatches(input: {
  unitCode: string
  lessonNumber: string
  savedUnitCode?: string
  savedLessonNumber?: string
}): boolean {
  if (input.savedUnitCode === undefined && input.savedLessonNumber === undefined) {
    return false
  }

  const savedUnit = (input.savedUnitCode ?? '').trim()
  const savedLesson = (input.savedLessonNumber ?? '').trim()
  return input.unitCode.trim() === savedUnit && input.lessonNumber.trim() === savedLesson
}

/**
 * Lesson must be a catalog option when the browse catalog loaded.
 * An unchanged saved pair stays valid even when the catalog is empty or unavailable,
 * so title and curriculum fields can still be saved. A new lesson is required only
 * when the unit changes.
 */
export function lessonFieldError(input: {
  unitCode: string
  lessonNumber: string
  lessonOptions: Pick<FormSelectOption, 'value'>[]
  lessonsLoading: boolean
  catalogReady: boolean
  savedUnitCode?: string
  savedLessonNumber?: string
}): string | undefined {
  if (savedTemplateStructureMatches(input)) {
    return undefined
  }

  if (!input.unitCode.trim()) {
    return undefined
  }

  const lesson = input.lessonNumber.trim()

  if (!input.catalogReady) {
    const savedPairKnown =
      input.savedUnitCode !== undefined || input.savedLessonNumber !== undefined
    if (lesson && isPositiveLesson(lesson) && !savedPairKnown) {
      return undefined
    }
    if (input.lessonsLoading) {
      return 'Lessons are still loading'
    }
    if (lesson && isPositiveLesson(lesson)) {
      return 'Choose a lesson from this unit'
    }
    return 'Lesson is required'
  }

  if (!lesson) {
    return 'Lesson is required'
  }

  if (!input.lessonOptions.some((option) => option.value === lesson)) {
    return 'Choose a lesson from this unit'
  }

  return undefined
}
