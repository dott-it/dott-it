# End-to-End Tests

This directory contains Playwright end-to-end tests that validate the application's functionality in a real browser environment.

## Test Files

- `openscied-basic.e2e.spec.ts` - Basic OpenSciEd functionality tests
- `openscied-library.e2e.spec.ts` - Library page and navigation tests
- `openscied-search.e2e.spec.ts` - Search functionality tests
- `openscied-metadata.e2e.spec.ts` - API and metadata loading tests
- `playwright-crawl-links.spec.ts` - Link crawling and validation tests
- `feedback-history-thread-view.test.ts` - Feedback history UI tests
- `debug-feedback-history.test.ts` - Debug tests for feedback history

## Running Tests

```bash
# Run all e2e tests (headless)
pnpm test:e2e

# Run tests with visible browser
pnpm test:e2e:headed

# Run tests with Playwright UI
pnpm test:e2e:ui

# Run tests with local config (dev server already running)
pnpm test:e2e:local

# Run specific test file
pnpm exec playwright test e2e/openscied-basic.e2e.spec.ts
```

## Configuration

Tests are configured in `playwright.config.ts` with:

- Base URL: `http://localhost:3000`
- Timeout: 60 seconds
- Headless mode by default
- Vercel protection bypass headers

## Pre-commit Integration

E2E tests are automatically run in the pre-commit hook with a dev server started in the background.
