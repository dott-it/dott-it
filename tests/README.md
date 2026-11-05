# Test Suite Documentation

## Link Checker Tests

The link checker validates all URLs in the metadata files to ensure they are accessible and working correctly.

### Quick Start

```bash
# Run all tests (including link checker)
pnpm test

# Run only unit tests (excluding link checker for speed)
pnpm test:unit

# Run only link checker tests
pnpm test:links

# Run link checker with verbose output
pnpm test:links:verbose

# Run pre-commit checks (including link checker)
pnpm test:pre-commit
```

### Environment Variables

| Variable               | Default | Description                                            |
| ---------------------- | ------- | ------------------------------------------------------ |
| `TEST_ONLINE`          | `false` | Enable online URL checking                             |
| `CI`                   | `false` | Automatically enables online checking in CI            |
| `PRE_COMMIT`           | `false` | Enables online checking and strict mode for pre-commit |
| `SKIP_LINK_CHECKER`    | `true`  | Skip link checker tests entirely                       |
| `VERBOSE`              | `false` | Show detailed failure information                      |
| `LINK_CHECKER_TIMEOUT` | `30000` | Timeout for link checking in milliseconds              |

### Test Modes

#### 1. **Offline Mode** (Default)

- Validates metadata file structure
- Checks URL format consistency
- Verifies all referenced standards are defined
- No network requests

#### 2. **Online Mode** (When `TEST_ONLINE=1` or `CI=true`)

- Performs all offline validations
- Makes HTTP requests to check URL accessibility
- Reports 404s, timeouts, and connection errors
- Provides success rate statistics

#### 3. **CI Mode** (When `CI=true`)

- Automatically enables online checking
- Stricter failure thresholds (max 10% failures)
- More detailed error reporting
- Faster timeouts for CI environments

### What Gets Checked

#### OpenSciEd Unit URLs

- Validates all unit links in `openscied_units.json`
- Checks URL format: `https://openscied.org/instructional-materials/...`
- Reports 404s for unpublished units

#### NGSS Standard URLs

- Validates all standard URLs in `ngss_alignment.json`
- Checks URL format: `https://www.nextgenscience.org/pe/...`
- Ensures all referenced standards are defined

#### Data Integrity

- Verifies all referenced standards exist in alignment data
- Checks required fields are present
- Validates data structure consistency

### Expected Failures

Some URLs may legitimately return 404s:

1. **OpenSciEd Units**: Units that haven't been published yet (e.g., Unit 7.6)
2. **NGSS Standards**: Standards with different URL patterns or not publicly available

### Performance

- **Offline Mode**: ~1-2 seconds
- **Online Mode**: ~20-30 seconds (depending on network)
- **Batch Processing**: 3 URLs at a time with 500ms delays
- **Timeout**: 30 seconds total (configurable)

### Integration

The link checker is integrated in different ways:

- `pnpm test` - Includes link checker with online validation
- `pnpm test:unit` - Skips link checker for speed (offline validation only)
- `pnpm test:links` - Link checker only with online validation
- Pre-commit hooks - Requires link checker with strict validation
- CI/CD pipelines - Runs online validation with strict thresholds

### Troubleshooting

#### High Failure Rate

```bash
# Check specific failures
pnpm test:links:verbose

# Increase timeout for slow networks
LINK_CHECKER_TIMEOUT=60000 pnpm test:links
```

#### Skip Link Checking

```bash
# Skip entirely
pnpm test:unit

# Or run offline only
pnpm test:unit
```

#### Fix URL Issues

1. Check the failing URLs manually
2. Update URLs in the metadata files
3. Re-run the link checker to verify fixes

### Output Examples

#### Success

```
🔍 Checking 72 unique URLs...

📊 Results Summary:
✅ Successful: 66
❌ Failed: 6
📈 Success Rate: 91.7%

📋 Status Code Distribution:
  200: 66 URLs
  404: 6 URLs
```

#### Failure (CI Mode)

```
🚨 Critical Failures (404s, 500s, connection errors): 6
  https://openscied.org/instructional-materials/7-6-earth-resources-human-impact/
    Issue: 404
    Sources: OpenSciEd Unit 7.6
```
