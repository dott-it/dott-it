import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test.describe('Student Answers Service', () => {
  test('service file exists and exports getStudentAnswers function', async () => {
    const servicePath = 'app/lib/services/student-answer/student-answer.service.ts';
    const contents = await readFile(servicePath, 'utf8');
    
    expect(contents).toContain('getStudentAnswers');
    expect(contents).toContain('export function getStudentAnswers');
  });

  test('service accepts GetStudentAnswersParams', async () => {
    const servicePath = 'app/lib/services/student-answer/student-answer.service.ts';
    const contents = await readFile(servicePath, 'utf8');
    
    expect(contents).toContain('GetStudentAnswersParams');
    expect(contents).toContain('StudentAnswerService');
  });

  test('service returns Result type', async () => {
    const servicePath = 'app/lib/services/student-answer/student-answer.service.ts';
    const contents = await readFile(servicePath, 'utf8');
    
    expect(contents).toContain('Result<StudentAnswer[]>');
    expect(contents).toContain('Promise<Result');
  });
});
