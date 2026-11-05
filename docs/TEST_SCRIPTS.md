# Test Scripts Documentation

This document describes the available test scripts in the project after cleanup.

## Unit Tests

### `pnpm test`

- **Purpose**: Run all unit tests with moderate concurrency (4 workers)
- **Use case**: Standard testing during development
- **Command**: `node --test --test-concurrency=4 tests/**/*.test.js`

### `pnpm test:max`

- **Purpose**: Run all unit tests with maximum concurrency (16 workers)
- **Use case**: Fast testing for CI/CD and pre-commit hooks
- **Command**: `node --test --test-concurrency=16 tests/**/*.test.js`

## Link Validation Tests

### `pnpm test:links`

- **Purpose**: Validate all URLs in metadata (online mode)
- **Use case**: Verify external links are accessible
- **Command**: `TEST_ONLINE=1 node --test tests/link-checker.test.js`

### `pnpm test:links:verbose`

- **Purpose**: Validate all URLs with detailed output
- **Use case**: Debug link issues with comprehensive reporting
- **Command**: `TEST_ONLINE=1 node --test tests/link-checker.test.js --reporter=verbose`

## End-to-End Tests

### `pnpm test:e2e`

- **Purpose**: Run Playwright e2e tests in headless mode
- **Use case**: CI/CD and automated testing
- **Command**: `playwright test`

### `pnpm test:e2e:ui`

- **Purpose**: Run Playwright e2e tests with UI
- **Use case**: Interactive debugging and development
- **Command**: `playwright test --ui`

### `pnpm test:e2e:local`

- **Purpose**: Run Playwright e2e tests with local configuration
- **Use case**: Local development with custom settings
- **Command**: `playwright test --config=playwright-local.config.ts`

## Pre-commit Hook

The pre-commit hook (`.husky/pre-commit`) runs the following checks in order:

1. **Linting**: `pnpm lint` - Checks code style and quality
2. **Unit Tests**: `pnpm test:max` - Runs all unit tests with maximum concurrency
3. **E2E Tests**: `pnpm test:e2e` - Runs end-to-end tests in headless mode

## Removed Scripts

The following redundant scripts were removed during cleanup:

- `test:fast` - Redundant with `test:max`
- `test:e2e:headed` - Redundant with `test:e2e:ui` (UI mode provides better experience)

## Usage Examples

```bash
# Run all tests (development)
pnpm test

# Run tests quickly (CI/pre-commit)
pnpm test:max

# Check external links
pnpm test:links

# Debug link issues
pnpm test:links:verbose

# Run e2e tests
pnpm test:e2e

# Debug e2e tests interactively
pnpm test:e2e:ui
```

## Notes

- All unit tests run with Node.js built-in test runner
- Link tests require internet connection when using online mode
- E2E tests use Playwright for browser automation
- The pre-commit hook ensures code quality before commits
