import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  DOTT_FORM_MARKER,
  dottFormTitle,
  isDottFormNameForAssessment,
} from '../lib/library/digitize/naming.ts'

test('should append the Dott.it marker to the assessment title', () => {
  assert.equal(dottFormTitle('Baseball Assessment 1'), `Baseball Assessment 1 ${DOTT_FORM_MARKER}`)
})

test('should not duplicate the Dott.it marker when already present', () => {
  assert.equal(
    dottFormTitle(`Baseball Assessment 1 ${DOTT_FORM_MARKER}`),
    `Baseball Assessment 1 ${DOTT_FORM_MARKER}`,
  )
})

test('should match Dott.it form names for the assessment title stem', () => {
  assert.equal(
    isDottFormNameForAssessment(`Baseball Assessment 1 ${DOTT_FORM_MARKER}`, 'Baseball Assessment 1'),
    true,
  )
  assert.equal(
    isDottFormNameForAssessment(`Soccer Assessment ${DOTT_FORM_MARKER}`, 'Baseball Assessment 1'),
    false,
  )
  assert.equal(isDottFormNameForAssessment('Baseball Assessment 1', 'Baseball Assessment 1'), false)
})

test('should not match short titles against longer Dott.it form names in the same folder', () => {
  assert.equal(
    isDottFormNameForAssessment(
      `8.2 Lesson 6 Teacher Reference Assessment Key ${DOTT_FORM_MARKER}`,
      'Assessment',
    ),
    false,
  )
  assert.equal(isDottFormNameForAssessment(`Assessment ${DOTT_FORM_MARKER}`, 'Assessment'), true)
})

test('should treat hyphen and space title variants as the same Form name', () => {
  assert.equal(
    isDottFormNameForAssessment(
      `8.2 Lesson 2 Handout Self Assessment ${DOTT_FORM_MARKER}`,
      '8.2 Lesson 2 Handout Self-Assessment',
    ),
    true,
  )
})
