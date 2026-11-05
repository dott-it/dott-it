import { test, expect } from '@playwright/test';
import { getUnitOverview } from '../lib/unit-overviews.js';

test('should return overview for 8.1 Contact Forces', () => {
  const overview = getUnitOverview('8.1');
  expect(overview).toBeTruthy();
  expect(overview.unitName).toBe('Contact Forces');
});

test('should list assessment opportunities for lesson 1', () => {
  const overview = getUnitOverview('8.1');
  const lesson1 = overview.opportunities.find(o => o.lesson === 1);
  expect(lesson1).toBeTruthy();
  expect(lesson1.type).toBe('Pre-Assessment');
});

test('should return undefined for unknown unit code', () => {
  const overview = getUnitOverview('0.0');
  expect(overview).toBeUndefined();
});
