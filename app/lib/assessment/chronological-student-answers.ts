import type { AssessmentRecord, StudentAnswer } from '@/app/types'

/** Student answers oldest → newest (same ordering as Past Attempts index 0 = first submission). */
export function studentAnswersChronological(
  record: AssessmentRecord | null | undefined,
): StudentAnswer[] {
  return [...(record?.studentAnswers ?? [])].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )
}

/** Most recent submission — matches main Student Response + AI template column. */
export function latestStudentAnswer(
  record: AssessmentRecord | null | undefined,
): StudentAnswer | undefined {
  const list = studentAnswersChronological(record)
  return list.at(-1)
}
