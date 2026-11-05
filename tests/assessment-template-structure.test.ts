import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  lessonFieldError,
  resolveEditLessonOptions,
  resolveEditUnitOptions,
} from '../components/backoffice/assessment-templates/lesson-field-error.ts'
import { applyEditStructureChange } from '../components/backoffice/assessment-templates/template-edit-structure.ts'
import {
  UNIT_LESSONS_BROWSE_ERROR,
  UNIT_LESSONS_EMPTY_ERROR,
  unitLessonsLoadError,
} from '../components/backoffice/assessment-templates/use-openscied-unit-lessons.ts'
import { resolveTemplateStructure } from '../lib/assessment-template-structure.ts'

const lessonOptions = [
  { value: '6', label: 'Lesson 6' },
  { value: '7', label: 'Lesson 7' },
]

describe('assessment template structure', () => {
  it('should require unit and lesson on create', () => {
    const missing = resolveTemplateStructure(
      { unitCode: '8.1', lessonNumber: null },
      { requireUnitAndLesson: true },
    )
    assert.equal(missing.ok, false)
    if (!missing.ok) {
      assert.equal(missing.message, 'Lesson is required')
    }
  })

  it('should reject a lesson that is not in the unit catalog', () => {
    const result = resolveTemplateStructure(
      { unitCode: '8.1', lessonNumber: 99 },
      { requireUnitAndLesson: true },
    )
    assert.equal(result.ok, false)
    if (!result.ok) {
      assert.match(result.details, /Lesson 99 is not in unit 8.1/)
    }
  })

  it('should accept a real unit and lesson on create', () => {
    const result = resolveTemplateStructure(
      { unitCode: ' 8.1 ', lessonNumber: '6' },
      { requireUnitAndLesson: true },
    )
    assert.deepEqual(result, { ok: true, unitCode: '8.1', lessonNumber: 6 })
  })

  it('should allow a legacy update with no unit and no lesson', () => {
    const result = resolveTemplateStructure(
      { unitCode: null, lessonNumber: null },
      { requireUnitAndLesson: false },
    )
    assert.deepEqual(result, { ok: true, unitCode: null, lessonNumber: null })
  })

  it('should reject clearing unit and lesson when the record already has a unit', () => {
    const result = resolveTemplateStructure(
      { unitCode: null, lessonNumber: null },
      { requireUnitAndLesson: true },
    )
    assert.equal(result.ok, false)
    if (!result.ok) {
      assert.equal(result.message, 'Unit is required')
    }
  })

  it('should reject an update that sets a unit without a lesson', () => {
    const result = resolveTemplateStructure(
      { unitCode: '8.1', lessonNumber: '' },
      { requireUnitAndLesson: false },
    )
    assert.equal(result.ok, false)
  })

  it('should keep a saved unit that has no lesson', () => {
    const result = resolveTemplateStructure(
      { unitCode: '8.1', lessonNumber: null },
      {
        requireUnitAndLesson: true,
        preserved: { unitCode: '8.1', lessonNumber: null },
      },
    )
    assert.deepEqual(result, { ok: true, unitCode: '8.1', lessonNumber: null })
  })

  it('should keep a saved unit and lesson when the catalog has no such unit', () => {
    const result = resolveTemplateStructure(
      { unitCode: '99.9', lessonNumber: 3 },
      {
        requireUnitAndLesson: true,
        preserved: { unitCode: '99.9', lessonNumber: 3 },
      },
    )
    assert.deepEqual(result, { ok: true, unitCode: '99.9', lessonNumber: 3 })
  })

  it('should require a lesson when the update changes the unit', () => {
    const missingLesson = resolveTemplateStructure(
      { unitCode: '8.1', lessonNumber: null },
      {
        requireUnitAndLesson: true,
        preserved: { unitCode: '6.1', lessonNumber: null },
      },
    )
    assert.equal(missingLesson.ok, false)
    if (!missingLesson.ok) {
      assert.equal(missingLesson.message, 'Lesson is required')
    }

    const catalogLesson = resolveTemplateStructure(
      { unitCode: '8.1', lessonNumber: 6 },
      {
        requireUnitAndLesson: true,
        preserved: { unitCode: '6.1', lessonNumber: null },
      },
    )
    assert.deepEqual(catalogLesson, { ok: true, unitCode: '8.1', lessonNumber: 6 })
  })

  it('should reject a changed lesson that is not in the catalog', () => {
    const result = resolveTemplateStructure(
      { unitCode: '99.9', lessonNumber: 4 },
      {
        requireUnitAndLesson: true,
        preserved: { unitCode: '99.9', lessonNumber: 3 },
      },
    )
    assert.equal(result.ok, false)
    if (!result.ok) {
      assert.match(result.details, /Lesson 4 is not in unit 99.9/)
    }
  })
})

describe('lesson field error', () => {
  it('should require a catalog lesson when the unit catalog has loaded', () => {
    assert.equal(
      lessonFieldError({
        unitCode: '8.1',
        lessonNumber: '',
        lessonOptions,
        lessonsLoading: false,
        catalogReady: true,
      }),
      'Lesson is required',
    )
    assert.equal(
      lessonFieldError({
        unitCode: '8.1',
        lessonNumber: '99',
        lessonOptions,
        lessonsLoading: false,
        catalogReady: true,
      }),
      'Choose a lesson from this unit',
    )
    assert.equal(
      lessonFieldError({
        unitCode: '8.1',
        lessonNumber: '6',
        lessonOptions,
        lessonsLoading: false,
        catalogReady: true,
      }),
      undefined,
    )
  })

  it('should keep a saved lesson when the catalog is still loading or unavailable', () => {
    assert.equal(
      lessonFieldError({
        unitCode: '8.1',
        lessonNumber: '6',
        lessonOptions: [],
        lessonsLoading: true,
        catalogReady: false,
      }),
      undefined,
    )
    assert.equal(
      lessonFieldError({
        unitCode: '8.1',
        lessonNumber: '6',
        lessonOptions: [],
        lessonsLoading: false,
        catalogReady: false,
      }),
      undefined,
    )
  })

  it('should reject a new lesson number while the catalog has not loaded', () => {
    assert.equal(
      lessonFieldError({
        unitCode: '8.1',
        lessonNumber: '10',
        lessonOptions: [],
        lessonsLoading: false,
        catalogReady: false,
        savedUnitCode: '8.1',
        savedLessonNumber: '6',
      }),
      'Choose a lesson from this unit',
    )
    assert.equal(
      lessonFieldError({
        unitCode: '8.1',
        lessonNumber: '10',
        lessonOptions: [],
        lessonsLoading: true,
        catalogReady: false,
        savedUnitCode: '8.1',
        savedLessonNumber: '6',
      }),
      'Lessons are still loading',
    )
  })

  it('should keep a saved unit with no lesson when the catalog is unavailable', () => {
    assert.equal(
      lessonFieldError({
        unitCode: '8.1',
        lessonNumber: '',
        lessonOptions: [],
        lessonsLoading: false,
        catalogReady: false,
        savedUnitCode: '8.1',
        savedLessonNumber: '',
      }),
      undefined,
    )
  })

  it('should keep a saved unit with no lesson when the catalog loaded other lessons', () => {
    assert.equal(
      lessonFieldError({
        unitCode: '8.1',
        lessonNumber: '',
        lessonOptions,
        lessonsLoading: false,
        catalogReady: true,
        savedUnitCode: '8.1',
        savedLessonNumber: '',
      }),
      undefined,
    )
  })

  it('should keep an unchanged lesson that is missing from the catalog', () => {
    assert.equal(
      lessonFieldError({
        unitCode: '99.9',
        lessonNumber: '3',
        lessonOptions,
        lessonsLoading: false,
        catalogReady: true,
        savedUnitCode: '99.9',
        savedLessonNumber: '3',
      }),
      undefined,
    )
  })

  it('should require a lesson when the unit changes', () => {
    assert.equal(
      lessonFieldError({
        unitCode: '8.2',
        lessonNumber: '',
        lessonOptions,
        lessonsLoading: false,
        catalogReady: true,
        savedUnitCode: '8.1',
        savedLessonNumber: '',
      }),
      'Lesson is required',
    )
  })

  it('should skip the lesson check when no unit is selected', () => {
    assert.equal(
      lessonFieldError({
        unitCode: '',
        lessonNumber: '',
        lessonOptions: [],
        lessonsLoading: false,
        catalogReady: false,
      }),
      undefined,
    )
  })
})

const savedTemplate = {
  title: 'Soccer forces',
  type: 'Formative',
  description: 'Saved description',
  curriculumTeachersEdition: 'Lesson 6 teacher edition',
  curriculumAnswerKey: 'Lesson 6 answer key',
  subject: 'Physical Science',
  gradeLevel: 'Grade 8',
  unitCode: '8.1',
  lessonNumber: '6',
}

describe('edit structure changes', () => {
  it('should clear curriculum text and hydrate when the lesson changes', () => {
    const result = applyEditStructureChange(savedTemplate, 'lessonNumber', '10', savedTemplate)
    assert.equal(result.hydrateLesson, true)
    assert.equal(result.form.lessonNumber, '10')
    assert.equal(result.form.unitCode, '8.1')
    assert.equal(result.form.title, '')
    assert.equal(result.form.curriculumTeachersEdition, '')
    assert.equal(result.form.curriculumAnswerKey, '')
  })

  it('should restore the saved lesson text when the lesson change is reverted', () => {
    const changed = applyEditStructureChange(savedTemplate, 'lessonNumber', '10', savedTemplate)
    const restored = applyEditStructureChange(changed.form, 'lessonNumber', '6', savedTemplate)
    assert.equal(restored.hydrateLesson, false)
    assert.equal(restored.form.title, 'Soccer forces')
    assert.equal(restored.form.curriculumTeachersEdition, 'Lesson 6 teacher edition')
    assert.equal(restored.form.curriculumAnswerKey, 'Lesson 6 answer key')
  })

  it('should clear the lesson and curriculum text when the unit changes', () => {
    const result = applyEditStructureChange(savedTemplate, 'unitCode', '8.2', savedTemplate)
    assert.equal(result.hydrateLesson, false)
    assert.equal(result.form.unitCode, '8.2')
    assert.equal(result.form.lessonNumber, '')
    assert.equal(result.form.curriculumTeachersEdition, '')
    assert.equal(result.form.curriculumAnswerKey, '')
  })

  it('should restore the saved pair when the unit change is reverted', () => {
    const changed = applyEditStructureChange(savedTemplate, 'unitCode', '8.2', savedTemplate)
    const restored = applyEditStructureChange(changed.form, 'unitCode', '8.1', savedTemplate)
    assert.equal(restored.hydrateLesson, false)
    assert.equal(restored.form.lessonNumber, '6')
    assert.equal(restored.form.curriculumAnswerKey, 'Lesson 6 answer key')
  })

  it('should ignore clearing a unit that is already saved', () => {
    const result = applyEditStructureChange(savedTemplate, 'unitCode', '', savedTemplate)
    assert.equal(result.form.unitCode, '8.1')
    assert.equal(result.form.curriculumTeachersEdition, 'Lesson 6 teacher edition')
  })
})

describe('unit lesson browse errors', () => {
  it('should explain a failed lesson browse', () => {
    assert.equal(
      unitLessonsLoadError({ requestFailed: true, lessonCount: 0 }),
      UNIT_LESSONS_BROWSE_ERROR,
    )
  })

  it('should explain a unit that returns no lessons', () => {
    assert.equal(
      unitLessonsLoadError({ requestFailed: false, lessonCount: 0 }),
      UNIT_LESSONS_EMPTY_ERROR,
    )
  })

  it('should stay quiet when the unit returns lessons', () => {
    assert.equal(unitLessonsLoadError({ requestFailed: false, lessonCount: 12 }), null)
  })
})

describe('edit unit and lesson options', () => {
  const unitOptions = [
    { value: 'none', label: 'No unit' },
    { value: '8.1', label: '8.1' },
  ]

  it('should hide No unit when the saved template already has a unit', () => {
    const options = resolveEditUnitOptions(unitOptions, {
      allowEmptyUnit: false,
      unitCode: '8.1',
    })
    assert.equal(
      options.some((option) => option.value === 'none'),
      false,
    )
    assert.ok(options.some((option) => option.value === '8.1'))
  })

  it('should keep a saved lesson visible when the catalog list is empty', () => {
    const options = resolveEditLessonOptions([], '6')
    assert.deepEqual(options, [{ value: '6', label: 'Lesson 6' }])
  })
})
