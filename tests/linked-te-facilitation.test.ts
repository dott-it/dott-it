import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  findAssessmentInUnit,
  loadUnitBrowseData,
} from '../lib/library/browse/load-unit-browse.ts'
import { resolveLinkedTeOpportunity } from '../lib/library/browse/te-facilitation.ts'

function allAssessmentsInUnit(unit: NonNullable<ReturnType<typeof loadUnitBrowseData>>) {
  return unit.lessons.flatMap((lesson) => lesson.assessments)
}

test('should carry linkedTeOpportunityId on ingested formal assessments', () => {
  const unit = loadUnitBrowseData('8.1', 8)
  assert.ok(unit)

  const soccer = allAssessmentsInUnit(unit).find((assessment) => assessment.title === 'Soccer Assessment')
  assert.ok(soccer)
  assert.equal(soccer.linkedTeOpportunityId, '81-6-ao-2')
})

test('should resolve linked TE facilitation for Soccer Assessment', () => {
  const unit = loadUnitBrowseData('8.1', 8)
  assert.ok(unit)

  const soccer = findAssessmentInUnit(unit, 'soccer-assessment-81-6-soccer-assessment')
  assert.ok(soccer)

  const linked = resolveLinkedTeOpportunity(unit, soccer)
  assert.ok(linked)
  assert.equal(linked.id, '81-6-ao-2')
  assert.match(linked.buildingTowards ?? '', /6\.A Apply science ideas/i)
  assert.match(linked.whatToLookFor ?? '', /Peak forces on the head/i)
})

test('should resolve linked TE facilitation for Modeling Other Force Interactions', () => {
  const unit = loadUnitBrowseData('8.1', 8)
  assert.ok(unit)

  const modeling = allAssessmentsInUnit(unit).find(
    (assessment) => assessment.title === 'Modeling Other Force Interactions',
  )
  assert.ok(modeling)
  assert.equal(modeling.linkedTeOpportunityId, '81-8-ao-1')

  const linked = resolveLinkedTeOpportunity(unit, modeling)
  assert.ok(linked)
  assert.equal(linked.id, '81-8-ao-1')
  assert.match(linked.buildingTowards ?? '', /8\.A Develop and use a model/i)
  assert.match(linked.whatToDo ?? '', /Modeling other force interactions/i)
})

test('should map all 8 Unit 8.1 assessments to linked TE opportunities', () => {
  const unit = loadUnitBrowseData('8.1', 8)
  assert.ok(unit)

  const assessments = allAssessmentsInUnit(unit)
  assert.equal(assessments.length, 8)

  const linkedCount = assessments.filter(
    (assessment) => resolveLinkedTeOpportunity(unit, assessment) !== undefined,
  ).length

  assert.equal(linkedCount, 8)
})

test('should resolve From Teacher Edition for Unit 8.2 formals without stored links', () => {
  const unit = loadUnitBrowseData('8.2', 8)
  assert.ok(unit)

  const windowAssessment = allAssessmentsInUnit(unit).find((assessment) =>
    assessment.title.includes('window'),
  )
  assert.ok(windowAssessment)

  const linked = resolveLinkedTeOpportunity(unit, windowAssessment)
  assert.ok(linked)
  assert.equal(linked.lessonNumber, windowAssessment.lessonNumber)
  assert.ok(linked.buildingTowards || linked.whatToLookFor || linked.whatToDo)
})
