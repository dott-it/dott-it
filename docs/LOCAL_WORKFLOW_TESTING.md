# Local GitHub Actions Workflow Testing

This document explains how to test GitHub Actions workflows locally using `act`, a tool that runs your GitHub Actions locally using Docker.

## Prerequisites

1. **Docker**: Must be installed and running
2. **act**: Must be installed (see installation instructions below)
3. **Node.js**: Version 20 or higher

## Installation

### Install act

**macOS (using Homebrew):**

```bash
brew install act
```

**Linux:**

```bash
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
```

**Windows:**

```bash
choco install act-cli
```

### Verify Installation

```bash
act --version
```

## Testing Your Workflow

### Quick Test (Recommended)

Use the provided script for a simple test without verbose output:

```bash
./scripts/test-workflow-simple.sh
```

### Detailed Test

Use the verbose script for detailed debugging information:

```bash
./scripts/test-workflow.sh
```

### Manual Testing

You can also run act directly:

```bash
# Test the test workflow
act push --workflows .github/workflows/test.yml --container-architecture linux/amd64

# Test with verbose output
act push --workflows .github/workflows/test.yml --container-architecture linux/amd64 --verbose

# Test a specific job
act push --job test --container-architecture linux/amd64
```

## Workflow Configuration

The test workflow (`.github/workflows/test.yml`) includes:

1. **Setup Node.js**: Installs Node.js 20
2. **Setup pnpm**: Installs pnpm package manager
3. **Install dependencies**: Installs project dependencies using pnpm
4. **Run tests**: Executes Node.js tests
5. **Run link checker**: Validates URLs in the codebase
6. **Install Playwright browsers**: Installs browser dependencies
7. **Run Playwright tests**: Executes end-to-end tests

## Troubleshooting

### Common Issues

1. **Docker not running**: Make sure Docker Desktop is started
2. **Architecture issues on Apple Silicon**: Use `--container-architecture linux/amd64` flag
3. **Permission issues**: Make sure scripts are executable (`chmod +x scripts/*.sh`)

### Debugging

- Use `--verbose` flag for detailed output
- Check Docker logs if containers fail to start
- Verify all dependencies are properly configured

### Performance Tips

- The first run will be slower as it downloads Docker images
- Subsequent runs will be faster due to caching
- Use the simple script for faster iteration during development

## Workflow Files

- `.github/workflows/test.yml`: Main test workflow
- `scripts/test-workflow.sh`: Verbose test script
- `scripts/test-workflow-simple.sh`: Simple test script

## What Gets Tested

1. **Node.js Tests**: All `.test.js` files in the `tests/` directory
2. **Link Validation**: Checks all URLs in the codebase for accessibility
3. **Playwright Tests**: End-to-end tests in `playwright/tests/` directory
4. **Dependency Installation**: Ensures all packages install correctly
5. **Build Process**: Validates the project can be built successfully

## Continuous Integration

The same workflow runs automatically on:

- Push to `main` and `develop` branches
- Pull requests to `main` branch

This ensures that local testing matches the CI environment.
