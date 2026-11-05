import { test, expect } from '@playwright/test';
import { highSchoolSubjects } from '../lib/high-school-subjects.js';

test('should list Biology, Chemistry, and Physics subjects', () => {
  const subjects = highSchoolSubjects.map(s => s.subject).sort();
  expect(subjects).toEqual(['Biology', 'Chemistry', 'Physics']);
});

test('each subject should contain at least one unit', () => {
  for (const subj of highSchoolSubjects) {
    expect(subj.units.length).toBeGreaterThan(0);
  }
});
