import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sidebarFile = readFileSync(join(__dirname, '..', 'components', 'app-sidebar.tsx'), 'utf8');

test('AppSidebar should use theme-based colors', () => {
  expect(sidebarFile).toMatch(/bg-sidebar\/60/);
  expect(sidebarFile).toMatch(/hover:bg-sidebar\/70/);
  expect(sidebarFile).not.toMatch(/bg-white\/60/);
  expect(sidebarFile).toMatch(/bg-transparent/);
  expect(sidebarFile).toMatch(/border-transparent/);
});
