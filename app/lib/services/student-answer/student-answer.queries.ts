import { router } from 'react-query-kit';
import { auth } from '../queries';
import { successOrThrowAsync } from '@/utils/result';
import {
  getStudentAnswers,
  regenerateAiFeedback,
} from './student-answer.service';
import { StudentAnswer } from '@/app/types/api/student-answer';

export const studentAnswerQueries = router(
  [...auth.getKey(), 'studentAnswers'],
  {
    getStudentAnswers: router.query<
      StudentAnswer[],
      { assessmentRecordId: string }
    >({
      fetcher: (params) =>
        successOrThrowAsync(getStudentAnswers({ assessmentRecordId: params.assessmentRecordId })),
    }),
    regenerateAiFeedback: router.mutation<
      StudentAnswer,
      { studentAnswerId: string }
    >({
      mutationFn: (params): Promise<StudentAnswer> =>
        successOrThrowAsync(regenerateAiFeedback({ studentAnswerId: params.studentAnswerId })),
    }),
  }
);
