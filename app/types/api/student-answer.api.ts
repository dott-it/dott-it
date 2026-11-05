import { StudentAnswer } from '@/app/types/api/student-answer';
import { ApiError } from './common.api';

// Request params
export interface GetStudentAnswersParams {
  assessmentRecordId: string;
}

export interface GetStudentAnswerParams {
  id: string;
}

export interface RegenerateAiFeedbackParams {
  studentAnswerId: string;
}

export interface CreateStudentAnswerParams {
  assessmentRecordId: string;
  answers: Array<{
    title: string;
    value: string;
    questionId: string;
  }>;
}

export interface UpdateStudentAnswerParams {
  id: string;
  data: Partial<{
    answers: Array<{
      title: string;
      value: string;
      questionId: string;
    }>;
  }>;
}

export interface DeleteStudentAnswerParams {
  id: string;
}

// Response types
export type StudentAnswerResponse = StudentAnswer | ApiError;
export type StudentAnswersResponse = StudentAnswer[] | ApiError;
