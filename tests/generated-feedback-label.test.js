import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const files = [
  'components/feedback-display.tsx',
  'app/workspace/assessments/[id]/[learnerId]/page.tsx'
];

test('should use ✨ Generated Feedback label', async () => {
  const contents = await readFile('components/feedback-display.tsx', 'utf8');
  expect(contents).toContain('✨ Generated Feedback');
});

test('should include Generate for Student button', async () => {
  const contents = await readFile('components/feedback-display.tsx', 'utf8');
  expect(contents).toContain('Generate for Student');
});
