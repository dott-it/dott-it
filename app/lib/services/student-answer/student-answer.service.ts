import { Result } from '@/utils/result';
import { StudentAnswerService } from '../../../shared/services/student-answer.service';
import { ServiceOptions } from '../../../shared/services/service';
import {
  StudentAnswer,
} from '@/types';

import { httpClient } from '@/lib/service';
import { CreateStudentAnswerParams, DeleteStudentAnswerParams, GetStudentAnswerParams, GetStudentAnswersParams, RegenerateAiFeedbackParams, UpdateStudentAnswerParams } from '@/app/types/api/student-answer.api';

export const studentAnswerService = new StudentAnswerService(httpClient);

export function getStudentAnswers(
  params: GetStudentAnswersParams,
  options?: ServiceOptions<StudentAnswer[]>,
): Promise<Result<StudentAnswer[]>> {
  return studentAnswerService.getStudentAnswers(params, options);
}

export function getStudentAnswer(
  params: GetStudentAnswerParams,
  options?: ServiceOptions<StudentAnswer>,
): Promise<Result<StudentAnswer>> {
  return studentAnswerService.getStudentAnswer(params, options);
}

export function regenerateAiFeedback(
  params: RegenerateAiFeedbackParams,
  options?: ServiceOptions<StudentAnswer>,
): Promise<Result<StudentAnswer>> {
  return studentAnswerService.regenerateAiFeedback(params, options);
}

export function createStudentAnswer(
  params: CreateStudentAnswerParams,
  options?: ServiceOptions<StudentAnswer>,
): Promise<Result<StudentAnswer>> {
  return studentAnswerService.createStudentAnswer(params, options);
}

export function updateStudentAnswer(
  params: UpdateStudentAnswerParams,
  options?: ServiceOptions<StudentAnswer>,
): Promise<Result<StudentAnswer>> {
  return studentAnswerService.updateStudentAnswer(params, options);
}

export function deleteStudentAnswer(
  params: DeleteStudentAnswerParams,
  options?: ServiceOptions<void>,
): Promise<Result<void>> {
  return studentAnswerService.deleteStudentAnswer(params, options);
}
