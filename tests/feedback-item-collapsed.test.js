import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('feedback item should start collapsed using shadcn expander', async () => {
  const contents = await readFile('components/feedback-display.tsx', 'utf8');
  expect(contents).toMatch(/useState\(false\)/);
  expect(contents).toMatch(/<Collapsible/);
});
