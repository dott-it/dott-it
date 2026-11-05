export type EditableTemplateFields = {
  title: string
  type: string
  description: string
  curriculumTeachersEdition: string
  curriculumAnswerKey: string
  subject: string
  gradeLevel: string
  unitCode: string
  lessonNumber: string
}

const CLEARED_CURRICULUM = {
  title: '',
  type: '',
  subject: '',
  description: '',
  curriculumTeachersEdition: '',
  curriculumAnswerKey: '',
} as const

function restoreSavedCurriculum<T extends EditableTemplateFields>(
  prev: T,
  saved: EditableTemplateFields,
  structure: { unitCode: string; lessonNumber: string },
): T {
  return {
    ...prev,
    title: saved.title,
    type: saved.type,
    description: saved.description,
    curriculumTeachersEdition: saved.curriculumTeachersEdition,
    curriculumAnswerKey: saved.curriculumAnswerKey,
    subject: saved.subject,
    gradeLevel: saved.gradeLevel,
    unitCode: structure.unitCode,
    lessonNumber: structure.lessonNumber,
  }
}

/**
 * Changing unit or lesson drops the previous lesson's curriculum text so it
 * cannot be saved onto a different lesson. Returning to the saved pair restores
 * that text instead of fetching a new draft.
 */
export function applyEditStructureChange<T extends EditableTemplateFields>(
  prev: T,
  field: 'unitCode' | 'lessonNumber',
  value: string,
  saved: EditableTemplateFields,
): { form: T; hydrateLesson: boolean } {
  if (field === 'unitCode') {
    if (!value && saved.unitCode) {
      return { form: prev, hydrateLesson: false }
    }
    if (value === saved.unitCode) {
      return {
        form: restoreSavedCurriculum(prev, saved, {
          unitCode: saved.unitCode,
          lessonNumber: saved.lessonNumber,
        }),
        hydrateLesson: false,
      }
    }
    return {
      form: {
        ...prev,
        ...CLEARED_CURRICULUM,
        unitCode: value,
        lessonNumber: '',
      },
      hydrateLesson: false,
    }
  }

  if (prev.unitCode === saved.unitCode && value === saved.lessonNumber) {
    return {
      form: restoreSavedCurriculum(prev, saved, {
        unitCode: prev.unitCode,
        lessonNumber: value,
      }),
      hydrateLesson: false,
    }
  }

  return {
    form: {
      ...prev,
      ...CLEARED_CURRICULUM,
      lessonNumber: value,
    },
    hydrateLesson: Boolean(prev.unitCode.trim() && value.trim()),
  }
}
