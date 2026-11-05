import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const file = 'lib/data-service.ts';

test('Data service exists and exports required functions', async () => {
  const contents = await readFile(file, 'utf8');
  expect(contents).toContain('getAssessments');
  expect(contents).toContain('getAssessmentRecords');
});

test('Data service uses Prisma client', async () => {
  const contents = await readFile(file, 'utf8');
  expect(contents).toContain('PrismaClient');
  expect(contents).toContain('prisma.assessment.findMany');
});
