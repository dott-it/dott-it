# Test Workflow Guide

## Overview

The test suite has been simplified to provide essential testing capabilities without complex environment variable configurations.

## Quick Reference

### For Daily Development

```bash
# Run all tests (fast, offline)
pnpm test

# Run tests with higher concurrency
pnpm test:fast
```

### For Link Validation

```bash
# Check all links (online)
pnpm test:links
```

### For End-to-End Testing

```bash
# Run E2E tests (headless)
pnpm test:e2e

# Run E2E tests with visible browser
pnpm test:e2e:headed

# Run E2E tests with UI
pnpm test:e2e:ui

# Run E2E tests with local config
pnpm test:e2e:local
```

## Test Scripts Overview

| Script            | Speed | Link Checker | Use Case                   |
| ----------------- | ----- | ------------ | -------------------------- |
| `pnpm test`       | Fast  | ❌ (offline) | Daily development          |
| `pnpm test:fast`  | Fast  | ❌ (offline) | High concurrency testing   |
| `pnpm test:links` | Slow  | ✅ (online)  | URL validation             |
| `pnpm test:e2e`   | Slow  | ❌           | End-to-end browser testing |

## Directory Structure

```
├── tests/          # Unit tests (Node.js)
│   ├── *.test.js   # Unit test files
│   └── README.md   # Test documentation
├── e2e/            # End-to-end tests (Playwright)
│   ├── *.spec.ts   # E2E test files
│   └── README.md   # E2E documentation
└── playwright.config.ts  # Playwright configuration
```

## Default Behavior

- **`pnpm test`**: Runs all unit tests offline (link checker skips network requests)
- **`pnpm test:links`**: Explicitly enables online URL checking with `TEST_ONLINE=1`
- **Link checker**: Automatically skips online tests unless `TEST_ONLINE=1` is set

## Performance

- **Unit tests**: ~300ms-1s (offline, fast)
- **Link checking**: ~30s (online URL validation)
- **E2E tests**: ~30-60s (browser automation)

## Best Practices

1. **Daily Development**: Use `pnpm test` for fast feedback
2. **Before Committing**: Run `pnpm test && pnpm test:links` for complete validation
3. **URL Changes**: Test with `pnpm test:links` after modifying metadata files
4. **Feature Development**: Use `pnpm test:e2e` for integration testing
5. **Debugging**: Use `pnpm test:e2e:headed` to see browser interactions

## Configuration Files

- `playwright.config.ts` - Main Playwright configuration
- `playwright-local.config.ts` - Local development configuration (assumes dev server running)
- `tests/link-checker.test.js` - Configurable online/offline URL validation

## Environment Variables

| Variable      | Default | Description                  |
| ------------- | ------- | ---------------------------- |
| `TEST_ONLINE` | `false` | Enable online URL checking   |
| `CI`          | `false` | Automatically enables online |

The simplified setup removes complex environment combinations while maintaining essential testing capabilities.
