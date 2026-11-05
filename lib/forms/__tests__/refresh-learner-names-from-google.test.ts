jest.mock('@/lib/user-prisma', () => ({
  userPrisma: {},
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {},
}))

import {
  resolveDisplayNameFromGoogleFormResponse,
} from '../refresh-learner-names-from-google'
import type { forms_v1 } from 'googleapis'

describe('resolveDisplayNameFromGoogleFormResponse', () => {
  it('should combine First Name and Last Name from Google Form answers', () => {
    const items = [
      {
        title: 'First Name',
        questionItem: { question: { questionId: 'q1' } },
      },
      {
        title: 'Last Name',
        questionItem: { question: { questionId: 'q2' } },
      },
      {
        title: 'Section',
        questionItem: { question: { questionId: 'q3' } },
      },
    ] as forms_v1.Schema$Item[]

    const response = {
      responseId: 'r1',
      answers: {
        q1: { textAnswers: { answers: [{ value: 'Jane' }] } },
        q2: { textAnswers: { answers: [{ value: 'Doe' }] } },
        q3: { textAnswers: { answers: [{ value: '1st hour' }] } },
      },
    } as forms_v1.Schema$FormResponse

    expect(resolveDisplayNameFromGoogleFormResponse(items, response)).toBe('Jane Doe')
  })

  it('should return empty when name answers are missing', () => {
    const items = [
      {
        title: 'Section',
        questionItem: { question: { questionId: 'q3' } },
      },
    ] as forms_v1.Schema$Item[]

    const response = {
      answers: {
        q3: { textAnswers: { answers: [{ value: '1st hour' }] } },
      },
    } as forms_v1.Schema$FormResponse

    expect(resolveDisplayNameFromGoogleFormResponse(items, response)).toBe('')
  })
})
