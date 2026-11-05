import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  EDDO_FORM_MARKER,
  eddoFormTitle,
  isEddoFormNameForAssessment,
} from '../lib/library/digitize/naming.ts'

test('should append the Eddo marker to the assessment title', () => {
  assert.equal(eddoFormTitle('Baseball Assessment 1'), `Baseball Assessment 1 ${EDDO_FORM_MARKER}`)
})

test('should not duplicate the Eddo marker when already present', () => {
  assert.equal(
    eddoFormTitle(`Baseball Assessment 1 ${EDDO_FORM_MARKER}`),
    `Baseball Assessment 1 ${EDDO_FORM_MARKER}`,
  )
})

test('should match Eddo form names for the assessment title stem', () => {
  assert.equal(
    isEddoFormNameForAssessment(`Baseball Assessment 1 ${EDDO_FORM_MARKER}`, 'Baseball Assessment 1'),
    true,
  )
  assert.equal(
    isEddoFormNameForAssessment(`Soccer Assessment ${EDDO_FORM_MARKER}`, 'Baseball Assessment 1'),
    false,
  )
  assert.equal(isEddoFormNameForAssessment('Baseball Assessment 1', 'Baseball Assessment 1'), false)
})

test('should not match short titles against longer Eddo form names in the same folder', () => {
  assert.equal(
    isEddoFormNameForAssessment(
      `8.2 Lesson 6 Teacher Reference Assessment Key ${EDDO_FORM_MARKER}`,
      'Assessment',
    ),
    false,
  )
  assert.equal(isEddoFormNameForAssessment(`Assessment ${EDDO_FORM_MARKER}`, 'Assessment'), true)
})

test('should treat hyphen and space title variants as the same Form name', () => {
  assert.equal(
    isEddoFormNameForAssessment(
      `8.2 Lesson 2 Handout Self Assessment ${EDDO_FORM_MARKER}`,
      '8.2 Lesson 2 Handout Self-Assessment',
    ),
    true,
  )
})
