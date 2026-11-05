import assert from 'node:assert/strict'
import { test } from 'node:test'
import { filterLessonsForBrowseView } from '../lib/library/browse/filter-lessons.ts'
import { loadUnitBrowseData } from '../lib/library/browse/load-unit-browse.ts'

test('should list lessons in storyline order for default table view', () => {
  const unit = loadUnitBrowseData('8.1', 8)
  assert.ok(unit)

  const lessonNumbers = unit.lessons.map((lesson) => lesson.lessonNumber)
  assert.deepEqual(lessonNumbers, Array.from({ length: 16 }, (_, index) => index + 1))
})

test('should include storyline lessons that only have assessment opportunities', () => {
  const unit = loadUnitBrowseData('8.1', 8)
  assert.ok(unit)

  const opportunityOnlyLessons = unit.lessons.filter(
    (lesson) => lesson.assessments.length === 0 && lesson.opportunities.length > 0,
  )

  assert.ok(opportunityOnlyLessons.length > 0)
})

test('should expose assessment row metadata for category swatch and subtitle', () => {
  const unit = loadUnitBrowseData('8.1', 8)
  assert.ok(unit)

  const formativeAssessment = unit.lessons
    .flatMap((lesson) => lesson.assessments)
    .find((assessment) => assessment.category === 'Formative')

  assert.ok(formativeAssessment)
  assert.equal(formativeAssessment.categoryLabel, 'Formative assessment')
  assert.ok(formativeAssessment.slug)
})

test('should expose opportunity counts per lesson for collapsed summary rows', () => {
  const unit = loadUnitBrowseData('8.1', 8)
  assert.ok(unit)

  const lesson6 = unit.lessons.find((lesson) => lesson.lessonNumber === 6)
  assert.ok(lesson6)
  assert.equal(lesson6.opportunities.length, 2)
})

test('should expose opportunity row metadata with long-form category label', () => {
  const unit = loadUnitBrowseData('8.1', 8)
  assert.ok(unit)

  const lesson6 = unit.lessons.find((lesson) => lesson.lessonNumber === 6)
  assert.ok(lesson6)
  assert.ok(lesson6.opportunities.length > 0)

  const formativeOpportunity = lesson6.opportunities.find(
    (opportunity) => opportunity.category === 'Formative',
  )
  assert.ok(formativeOpportunity)
  assert.equal(formativeOpportunity.categoryLabel, 'Formative assessment')
})

test('should expose TE facilitation fields on opportunity detail data', () => {
  const unit = loadUnitBrowseData('8.1', 8)
  assert.ok(unit)

  const lesson6 = unit.lessons.find((lesson) => lesson.lessonNumber === 6)
  assert.ok(lesson6)

  const facilitationOpportunity = lesson6.opportunities.find(
    (opportunity) =>
      opportunity.buildingTowards &&
      opportunity.whatToLookFor &&
      opportunity.whatToDo &&
      opportunity.whatToLookFor !== opportunity.whatToDo,
  )
  assert.ok(facilitationOpportunity)
})

test('should keep all lessons in Assessments & opportunities view', () => {
  const unit = loadUnitBrowseData('8.1', 8)
  assert.ok(unit)

  const visibleLessons = filterLessonsForBrowseView(unit.lessons, 'all', '')
  assert.equal(visibleLessons.length, 16)
})

test('should show only lessons with standalone assessments in Assessments only view', () => {
  const unit = loadUnitBrowseData('8.1', 8)
  assert.ok(unit)

  const visibleLessons = filterLessonsForBrowseView(unit.lessons, 'assessments-only', '')
  assert.ok(visibleLessons.length > 0)
  assert.ok(visibleLessons.every((lesson) => lesson.assessments.length > 0))
})

test('should hide opportunity-only lessons in Assessments only view', () => {
  const unit = loadUnitBrowseData('8.1', 8)
  assert.ok(unit)

  const opportunityOnlyLessons = unit.lessons.filter(
    (lesson) => lesson.assessments.length === 0 && lesson.opportunities.length > 0,
  )
  assert.ok(opportunityOnlyLessons.length > 0)

  const visibleLessons = filterLessonsForBrowseView(unit.lessons, 'assessments-only', '')
  for (const lesson of opportunityOnlyLessons) {
    assert.ok(!visibleLessons.some((visible) => visible.lessonNumber === lesson.lessonNumber))
  }
})

test('should expose per-lesson driving questions for storyline context', () => {
  const unit = loadUnitBrowseData('8.1', 8)
  assert.ok(unit)

  const lesson1 = unit.lessons.find((lesson) => lesson.lessonNumber === 1)
  const lesson2 = unit.lessons.find((lesson) => lesson.lessonNumber === 2)

  assert.ok(lesson1?.drivingQuestion)
  assert.ok(lesson2?.drivingQuestion)
  assert.notEqual(lesson1?.drivingQuestion, lesson2?.drivingQuestion)
})
