import type { AssessmentRecord, StudentAnswer } from '@/app/types'
import { latestStudentAnswer, studentAnswersChronological } from '../chronological-student-answers'

function sa(id: string, createdAt: string): StudentAnswer {
  return {
    id,
    createdAt,
    answers: [],
  } as unknown as StudentAnswer
}

describe('chronological-student-answers', () => {
  it('should order answers oldest to newest regardless of array order', () => {
    const record = {
      studentAnswers: [sa('b', '2025-01-02T00:00:00Z'), sa('a', '2025-01-01T00:00:00Z')],
    } as AssessmentRecord

    const ordered = studentAnswersChronological(record)
    expect(ordered.map((x) => x.id)).toEqual(['a', 'b'])
  })

  it('should return the most recent submission as latestStudentAnswer', () => {
    const record = {
      studentAnswers: [sa('first', '2025-01-01T00:00:00Z'), sa('second', '2025-01-03T00:00:00Z')],
    } as AssessmentRecord

    expect(latestStudentAnswer(record)?.id).toBe('second')
  })

  it('should handle empty studentAnswers', () => {
    const record = { studentAnswers: [] } as unknown as AssessmentRecord
    expect(studentAnswersChronological(record)).toEqual([])
    expect(latestStudentAnswer(record)).toBeUndefined()
  })
})
