import { test, expect } from '@playwright/test';
import { unitOverviews, getUnitOverview } from '../lib/unit-overviews.js';

test('each unit overview contains required fields', () => {
  for (const overview of unitOverviews) {
    expect(overview.unitCode).toBeDefined();
    expect(overview.unitName).toBeDefined();
    expect(overview.drivingQuestion).toBeDefined();
    expect(Array.isArray(overview.opportunities)).toBe(true);
    expect(Array.isArray(overview.supplementalTools)).toBe(true);
  }
});

test('supplemental tools lists are not empty', () => {
  for (const overview of unitOverviews) {
    expect(overview.supplementalTools.length).toBeGreaterThan(0);
  }
});

test('getUnitOverview returns matching object', () => {
  const code = unitOverviews[0].unitCode;
  const overview = getUnitOverview(code);
  expect(overview).toEqual(unitOverviews[0]);
});
