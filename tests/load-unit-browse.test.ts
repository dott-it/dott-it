import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildTimeline, loadUnitBrowseData } from '../lib/library/browse/load-unit-browse.ts'

test('should load Unit 8.1 with lesson table and timeline data', () => {
  const unit = loadUnitBrowseData('8.1', 8)

  assert.ok(unit)
  assert.equal(unit.unitCode, '8.1')
  assert.equal(unit.lessons.length, 16)
  assert.equal(unit.timeline.length, 16)
  assert.equal(unit.assessmentShape.lessonCount, 16)
  assert.equal(unit.assessmentShape.totalPacingDays, 33)
})

test('should order timeline lessons sequentially', () => {
  const unit = loadUnitBrowseData('8.1', 8)
  assert.ok(unit)

  const lessonNumbers = unit.timeline.map((segment) => segment.lessonNumber)
  assert.deepEqual(lessonNumbers, Array.from({ length: 16 }, (_, index) => index + 1))
  assert.equal(unit.timeline[0]?.label, '01')
  assert.equal(unit.timeline[15]?.label, '16')
})

test('should place markers on lessons with assessments or opportunities', () => {
  const unit = loadUnitBrowseData('8.1', 8)
  assert.ok(unit)

  const lesson1 = unit.timeline.find((segment) => segment.lessonNumber === 1)
  const lesson6 = unit.timeline.find((segment) => segment.lessonNumber === 6)

  assert.ok(lesson1)
  assert.ok(lesson1.markers.length > 0)
  assert.ok(lesson1.markers.some((marker) => marker.kind === 'opportunity'))
  assert.ok(!lesson1.markers.some((marker) => marker.kind === 'assessment'))

  assert.ok(lesson6)
  assert.ok(lesson6.markers.some((marker) => marker.kind === 'opportunity'))
  assert.ok(lesson6.markers.some((marker) => marker.kind === 'assessment'))
})

test('should reflect suggested pacing in segment width fractions', () => {
  const unit = loadUnitBrowseData('8.1', 8)
  assert.ok(unit)

  const lesson1 = unit.timeline.find((segment) => segment.lessonNumber === 1)
  const lesson3 = unit.timeline.find((segment) => segment.lessonNumber === 3)

  assert.ok(lesson1)
  assert.ok(lesson3)
  assert.ok(lesson1.widthFraction > lesson3.widthFraction)
})

test('buildTimeline should default pacing to equal segments when days are missing', () => {
  const timeline = buildTimeline([
    {
      lessonNumber: 1,
      topic: 'Lesson 1',
      assessments: [],
      opportunities: [],
    },
    {
      lessonNumber: 2,
      topic: 'Lesson 2',
      assessments: [],
      opportunities: [],
    },
  ])

  assert.equal(timeline.length, 2)
  assert.equal(timeline[0]?.widthFraction, 0.5)
  assert.equal(timeline[1]?.widthFraction, 0.5)
})

test('should classify Initial Model on lesson 1 as opportunity only, not assessment', () => {
  const unit = loadUnitBrowseData('8.1', 8)
  assert.ok(unit)

  const lesson1 = unit.lessons.find((lesson) => lesson.lessonNumber === 1)
  assert.ok(lesson1)
  assert.equal(lesson1.assessments.length, 0)
  assert.ok(lesson1.opportunities.length > 0)
  assert.ok(
    lesson1.opportunities.some((opportunity) =>
      opportunity.title.toLowerCase().includes('initial model'),
    ),
  )
})

test('should expose assessment shape summary counts from ingested manifest', () => {
  const unit = loadUnitBrowseData('8.1', 8)
  assert.ok(unit)

  assert.equal(unit.assessmentShape.assessmentCount, 8)
  assert.equal(unit.assessmentShape.opportunityCount, 37)
  assert.ok(unit.assessmentShape.opportunityCount > 0)
  assert.ok(unit.assessmentShape.assessmentCount > 0)
  assert.equal(
    unit.assessmentShape.opportunityCount,
    unit.lessons.reduce((sum, lesson) => sum + lesson.opportunities.length, 0),
  )
})

test('should show driving-question topics for Unit 7.1 lessons', () => {
  const unit = loadUnitBrowseData('7.1', 7)
  assert.ok(unit)

  const lesson1 = unit.lessons.find((lesson) => lesson.lessonNumber === 1)
  assert.ok(lesson1)
  assert.notEqual(lesson1.topic, 'Lesson 1')
  assert.match(lesson1.topic, /bath bomb/i)

  const genericTopics = unit.lessons.filter((lesson) =>
    new RegExp(`^Lesson\\s+${lesson.lessonNumber}$`, 'i').test(lesson.topic),
  )
  assert.equal(genericTopics.length, 0)
})

test('should keep curated short topics for Unit 8.1 lessons', () => {
  const unit = loadUnitBrowseData('8.1', 8)
  assert.ok(unit)

  const lesson1 = unit.lessons.find((lesson) => lesson.lessonNumber === 1)
  assert.ok(lesson1)
  assert.equal(lesson1.topic, 'Things hitting each other')
})

test('should expose unique assessment ids for Unit 8.2 browse rows', () => {
  const unit = loadUnitBrowseData('8.2', 8)
  assert.ok(unit)

  const ids = unit.lessons.flatMap((lesson) => lesson.assessments.map((row) => row.id))
  assert.equal(ids.length, new Set(ids).size)
})

test('should list Unit 8.2 standalone assessments on their lessons', () => {
  const unit = loadUnitBrowseData('8.2', 8)
  assert.ok(unit)

  const titles = unit.lessons.flatMap((lesson) => lesson.assessments.map((row) => row.title))
  assert.equal(unit.assessmentShape.assessmentCount, 3)
  assert.deepEqual(titles, [
    'How can objects make different sounds?',
    'How does sound make a window move?',
    'Unit Assessment',
  ])
})
