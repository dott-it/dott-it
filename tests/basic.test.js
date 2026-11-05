import { test, expect } from '@playwright/test';

test('simple addition', () => {
  expect(1 + 1).toBe(2);
});

test('async promise resolves', async () => {
  const result = await Promise.resolve(42);
  expect(result).toBe(42);
});
