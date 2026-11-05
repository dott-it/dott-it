# Testing Documentation

## Overview

This document provides comprehensive information about the testing strategy implemented in the Dott.it Workspace project. The testing setup includes both unit tests and end-to-end (E2E) tests to ensure application reliability and functionality.

## Test Architecture

### Test Types

1. **Unit Tests** - Fast, isolated tests for individual components and utilities
2. **E2E Tests** - Full application testing using Playwright
3. **Link Validation** - Automated broken link detection and reporting

### Test Environment

- **Port**: 34567 (unique to avoid conflicts)
- **Framework**: Node.js test module + Playwright
- **Language**: JavaScript + TypeScript
- **Isolation**: Clean environment per test run

## Unit Tests

### Location

- `tests/*.test.js`

### Framework

- Node.js built-in `test` module
- No external dependencies
- Fast execution

### Available Tests

#### Core Functionality

- `anon-id.test.js` - Anonymous ID generation
- `app-load.test.js` - Application loading
- `basic.test.js` - Basic functionality
- `db-connections.test.js` - Database connectivity

#### Data Validation

- `unit-overviews.test.js` - Unit overview data structure
- `unit-overviews-structure.test.js` - Data structure validation
- `highSchoolSubjects.test.js` - High school subjects data

#### UI Components

- `app-sidebar-style.test.js` - Sidebar styling
- `floating-sidebar-trigger.test.js` - Sidebar interactions
- `generated-feedback-label.test.js` - Feedback labels

#### Integration

- `green-anole.test.js` - Green anole data
- `openscied-urls.test.js` - OpenSciEd URL validation
- `session-links.test.js` - Session link validation

### Running Unit Tests

```bash
# Run all unit tests
pnpm test

# Run with online checks (if available)
TEST_ONLINE=1 pnpm test
```

## E2E Tests (Playwright)

### Configuration

#### Playwright Config (`playwright.config.ts`)

```typescript
import { PlaywrightTestConfig } from '@playwright/test'

const config: PlaywrightTestConfig = {
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:34567',
    extraHTTPHeaders: {
      'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET!,
      'x-vercel-set-bypass-cookie': 'true',
    },
  },
}

export default config
```

#### Package.json Scripts

```json
{
  "dev:test": "next dev -p 34567",
  "test:crawl": "playwright install --with-deps && start-server-and-test dev:test http://localhost:34567 \"playwright test tests/playwright-crawl-links.spec.ts\"",
  "test:e2e": "playwright install --with-deps && start-server-and-test dev:test http://localhost:34567 \"playwright test tests/playwright-crawl-links.spec.ts\"",
  "test:e2e:ui": "playwright install --with-deps && start-server-and-test dev:test http://localhost:34567 \"playwright test tests/playwright-crawl-links.spec.ts\""
}
```

### Link Crawling Test

#### Purpose

Validates all internal links work correctly and identifies broken pages or navigation issues.

#### Features

- **Comprehensive Crawling**: Visits all internal links found in the application
- **Button Interaction**: Clicks visible buttons to reveal additional content
- **Retry Logic**: 3 attempts with 30-second timeout for resilience
- **Error Reporting**: Detailed reporting of broken links and failures
- **Status Validation**: Ensures all pages return 200 status codes

#### Test Flow

1. Start Next.js server on port 34567
2. Navigate to base URL
3. Collect all internal links
4. Visit each link and validate response
5. Click buttons to reveal additional content
6. Generate comprehensive report

#### Output

- **Console**: Real-time test progress and results
- **Report File**: `playwright-link-report.txt` with detailed results
- **Test Results**: Playwright HTML report in `playwright-report/`

### Running E2E Tests

```bash
# Full E2E test suite
pnpm test:e2e

# Link crawling only
pnpm test:crawl

# E2E with UI mode (for debugging)
pnpm test:e2e:ui
```

## Continuous Integration

### GitHub Actions

#### Link Check Workflow (`.github/workflows/link-check.yml`)

- **Trigger**: Daily and on commits to main
- **Purpose**: Automated broken link detection
- **Target**: `https://dott-it-workspace.vercel.app`
- **Alerts**: Slack notifications for failures

#### Configuration

```yaml
name: Link Check
on:
  schedule:
    - cron: '0 0 * * *' # Daily at midnight
  push:
    branches: [main]
```

#### Demo Test Workflow (`.github/workflows/test.yml`)

- **Trigger**: Pushes to `develop` and `main` branches
- **Purpose**: Runs the full test suite for demo deployments
- **Notes**: Skips non-essential E2E scenarios

### Pre-commit Recommendations

```bash
# Recommended pre-commit checks
pnpm lint
pnpm test
pnpm test:e2e  # For comprehensive validation
```

## Troubleshooting

### Common Issues

#### Port Conflicts

```bash
# Check for processes using port 34567
lsof -i :34567

# Kill conflicting processes
pkill -f "next dev"
```

#### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
pnpm build
```

#### Missing Dependencies

```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Generate Prisma client
pnpm prisma generate
```

#### Vendor Chunk Errors

```bash
# Complete clean install
rm -rf .next node_modules pnpm-lock.yaml
pnpm install
pnpm prisma generate
```

### Test Debugging

#### UI Mode

```bash
# Run with visual browser for debugging
pnpm test:e2e:ui
```

#### Report Analysis

```bash
# Check test report
cat playwright-link-report.txt

# View HTML report
open playwright-report/
```

#### Manual Testing

```bash
# Start test server manually
pnpm dev:test

# Test specific URLs
curl -s -o /dev/null -w "%{http_code}" http://localhost:34567
```

## Test Data

### Unit Overviews

- **File**: `lib/unit-overviews.js`
- **Tests**: `tests/unit-overviews.test.js`
- **Purpose**: Validates curriculum data structure

### Database Connections

- **Tests**: `tests/db-connections.test.js`
- **Coverage**: Both tenant and global database connectivity
- **Validation**: Schema and connection integrity

### Mock Data

- **Location**: `lib/` directory
- **Purpose**: Provides test data for various scenarios
- **Validation**: Ensures data structure consistency

## Performance Considerations

### Test Execution Time

- **Unit Tests**: < 5 seconds
- **E2E Tests**: ~8-10 seconds
- **Full Suite**: ~15 seconds

### Resource Usage

- **Memory**: Minimal for unit tests, moderate for E2E
- **CPU**: Low for unit tests, moderate for E2E
- **Network**: None for unit tests, local for E2E

### Optimization

- **Parallel Execution**: Unit tests run in parallel
- **Caching**: Playwright caches browser downloads
- **Isolation**: Each test run uses fresh environment

## Best Practices

### Writing Tests

1. **Descriptive Names**: Use clear, descriptive test names
2. **Single Responsibility**: Each test should test one thing
3. **Setup/Teardown**: Clean up after each test
4. **Assertions**: Use clear, meaningful assertions

### Test Maintenance

1. **Regular Updates**: Keep tests in sync with code changes
2. **Documentation**: Document complex test scenarios
3. **Review**: Review test failures promptly
4. **Refactoring**: Refactor tests when code changes

### CI/CD Integration

1. **Automated Runs**: Tests run on every commit
2. **Failure Alerts**: Immediate notification of test failures
3. **Report Generation**: Automated test reports
4. **Quality Gates**: Block deployments on test failures

## Future Enhancements

### Planned Improvements

1. **Visual Regression Testing**: Screenshot comparison tests
2. **Performance Testing**: Load and stress testing
3. **Accessibility Testing**: Automated a11y validation
4. **API Testing**: Dedicated API test suite

### Monitoring

1. **Test Metrics**: Track test execution times and success rates
2. **Coverage Reports**: Code coverage analysis
3. **Trend Analysis**: Historical test performance data
4. **Alerting**: Proactive failure detection

---

For questions or issues with testing, please open a GitHub issue or contact the development team.
