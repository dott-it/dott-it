import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('should render messages with ReactMarkdown', async () => {
  const contents = await readFile('components/feedback-history-thread-view.tsx', 'utf8');
  expect(contents).toMatch(/import ReactMarkdown from "react-markdown"/);
  expect(contents).toContain('<ReactMarkdown');
});
