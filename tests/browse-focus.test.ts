import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  buildBrowseFocusParam,
  findBrowseFocusInUnit,
  parseBrowseFocusParam,
  unitBrowseFocusPath,
} from '../lib/library/browse/browse-focus.ts'
import { loadUnitBrowseData } from '../lib/library/browse/load-unit-browse.ts'

test('should build unit browse path with focus query for assessments', () => {
  const unit = loadUnitBrowseData('8.1', 8)
  assert.ok(unit)

  const soccer = unit.lessons
    .flatMap((lesson) => lesson.assessments)
    .find((assessment) => assessment.title === 'Soccer Assessment')
  assert.ok(soccer)

  const href = unitBrowseFocusPath(8, '8.1', 'assessment', soccer.slug)
  const focus = parseBrowseFocusParam(new URL(href, 'http://localhost').searchParams.get('focus'))

  assert.match(href, /^\/library\/openscied\/middle-school\/grade-8\/units\/8\.1\?focus=/)
  assert.deepEqual(focus, { kind: 'assessment', slug: soccer.slug })
})

test('should round-trip browse focus params', () => {
  const focus = { kind: 'opportunity' as const, slug: 'review-driving-question-progress-opp-8-1-6-0' }
  const param = buildBrowseFocusParam(focus)

  assert.deepEqual(parseBrowseFocusParam(param), focus)
})

test('should resolve focused activity within unit browse data', () => {
  const unit = loadUnitBrowseData('8.1', 8)
  assert.ok(unit)

  const soccer = unit.lessons
    .flatMap((lesson) => lesson.assessments)
    .find((assessment) => assessment.title === 'Soccer Assessment')
  assert.ok(soccer)

  const resolved = findBrowseFocusInUnit(unit, { kind: 'assessment', slug: soccer.slug })
  assert.ok(resolved)
  assert.equal(resolved.lessonNumber, 6)
})
