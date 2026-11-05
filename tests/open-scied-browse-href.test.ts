import assert from 'node:assert/strict'
import { test } from 'node:test'
import { openSciEdBrowseHrefForGradeLevel } from '../lib/library/browse/open-scied-browse-href.ts'

test('should route middle-school grades to grade browse pages', () => {
  assert.equal(
    openSciEdBrowseHrefForGradeLevel('Grade 8'),
    '/library/openscied/middle-school/grade-8',
  )
  assert.equal(openSciEdBrowseHrefForGradeLevel('7'), '/library/openscied/middle-school/grade-7')
})

test('should send High School labels to the OpenSciEd landing page', () => {
  assert.equal(openSciEdBrowseHrefForGradeLevel('High School'), '/library/openscied')
  assert.equal(openSciEdBrowseHrefForGradeLevel('High School Biology'), '/library/openscied')
})
