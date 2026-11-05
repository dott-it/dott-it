import assert from 'node:assert/strict'
import test from 'node:test'

import {
  classSectionFromAnswers,
  isClassSectionFieldTitle,
} from '../lib/forms/class-section-field.ts'

test('should treat common class-period field titles as the class section', () => {
  const titles = [
    'Hour',
    'Section',
    'Section *',
    'Period',
    'Class',
    'Block',
    'Class Period',
    'Class Section:',
    'Hour / Section',
    'hour/section',
  ]
  for (const title of titles) {
    assert.equal(isClassSectionFieldTitle(title), true, title)
  }
})

test('should keep a question stem that only mentions hour or class', () => {
  assert.equal(
    isClassSectionFieldTitle(
      'Question 3a. Player #84 is running at a speed of 7 miles per hour.',
    ),
    false,
  )
  assert.equal(
    isClassSectionFieldTitle('Explain what happens during this class period.'),
    false,
  )
})

test('should read the selected class-period choice', () => {
  const section = classSectionFromAnswers([
    { title: 'Student Name', value: 'Ada' },
    { title: 'Section', value: '2nd Hour' },
    { title: '1. How would the forces cause a concussion?', value: 'diagram.png' },
  ])
  assert.equal(section, '2nd Hour')
})

test('should read a Period choice when the form does not use Section', () => {
  const section = classSectionFromAnswers([
    { title: 'Period', value: '7th Hour' },
    { title: 'Block', value: 'A' },
  ])
  assert.equal(section, '7th Hour')
})
