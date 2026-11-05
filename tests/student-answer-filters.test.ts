import assert from 'node:assert/strict'
import test from 'node:test'

import { filterAnswersForExport, isMetadataAnswerField } from '../app/lib/export/student-answer-filters.ts'

test('should keep a question whose stem mentions miles per hour', () => {
  const answer = {
    questionId: 'q3a',
    title:
      'Question 3a. Considering both objects, player #84 is running at a speed of 7 miles per hour. Choose A, B, or C.',
    value: 'C. Player #84 running and hitting the ground',
  }
  assert.equal(isMetadataAnswerField(answer), false)
  assert.deepEqual(filterAnswersForExport([answer]), [answer])
})

test('should hide name prompts the sync encrypts, including ones that are not exactly Name', () => {
  const prompts = [
    { questionId: 'what', title: 'What is your name?', value: 'U2FsdGVkX1ciphertext' },
    { questionId: 'enter', title: 'Please enter your name', value: 'Ada Lovelace' },
    { questionId: 'format', title: 'Please write your name in this format: Last Name, First Name', value: 'Lovelace, Ada' },
  ]
  for (const answer of prompts) {
    assert.equal(isMetadataAnswerField(answer), true, answer.title)
  }
  assert.deepEqual(filterAnswersForExport(prompts), [])
})

test('should keep a question whose stem mentions the teacher', () => {
  const answer = {
    questionId: 'q-teacher',
    title: "Explain the teacher's claim about the collision.",
    value: 'The teacher said the forces are equal.',
  }
  assert.equal(isMetadataAnswerField(answer), false)
})

test('should leave the class-period choice off the student response', () => {
  const answers = [
    { questionId: 'section', title: 'Section', value: '2nd Hour' },
    { questionId: 'period', title: 'Period', value: '7th Hour' },
    {
      questionId: 'q1',
      title:
        '1. How would the forces from a header from such a light soccer ball cause a concussion?',
      value: 'diagram.png',
    },
    {
      questionId: 'q3a',
      title: 'Question 3a. Player #84 is running at a speed of 7 miles per hour.',
      value: 'C',
    },
  ]
  assert.equal(isMetadataAnswerField(answers[0]), true)
  assert.equal(isMetadataAnswerField(answers[1]), true)
  assert.deepEqual(filterAnswersForExport(answers), [answers[2], answers[3]])
})

test('should drop Name, Hour, and Teacher identity fields', () => {
  const answers = [
    { questionId: 'name', title: 'Name', value: 'Ada' },
    { questionId: 'hour', title: 'Hour', value: '3' },
    { questionId: 'teacher', title: 'Teacher', value: 'Lee' },
    { questionId: 'teacher-name', title: 'Teacher Name:', value: 'Lee' },
    {
      questionId: 'format',
      title: 'Please write your name in this format: Last Name, First Name',
      value: 'Lovelace, Ada',
    },
    { questionId: 'q1', title: '1. How would the forces cause a concussion?', value: 'diagram.png' },
  ]
  assert.equal(isMetadataAnswerField(answers[0]), true)
  assert.equal(isMetadataAnswerField(answers[1]), true)
  assert.equal(isMetadataAnswerField(answers[2]), true)
  assert.equal(isMetadataAnswerField(answers[3]), true)
  assert.equal(isMetadataAnswerField(answers[4]), true)
  assert.deepEqual(filterAnswersForExport(answers), [answers[5]])
})

test('should drop required-field Name titles that end with an asterisk', () => {
  const answers = [
    { questionId: 'first', title: 'First Name *', value: 'Ada' },
    { questionId: 'last', title: 'Last Name *', value: 'Lovelace' },
    { questionId: 'name', title: 'Name *', value: 'Ada Lovelace' },
    { questionId: 'full', title: 'Full Name', value: 'Ada Lovelace' },
    { questionId: 'your', title: 'Your Name', value: 'Ada Lovelace' },
    {
      questionId: 'q1',
      title: '1. How would the forces cause a concussion?',
      value: 'diagram.png',
    },
  ]
  for (const answer of answers.slice(0, 5)) {
    assert.equal(isMetadataAnswerField(answer), true, answer.title)
  }
  assert.deepEqual(filterAnswersForExport(answers), [answers[5]])
})
