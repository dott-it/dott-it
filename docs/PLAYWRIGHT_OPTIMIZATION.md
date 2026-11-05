# Playwright Dev Server Setup and Concurrency Optimization

This document outlines the improvements made to the Playwright testing setup for better performance, reliability, and developer experience.

## 🚀 Key Improvements

### 1. Enhanced Configuration Files

#### Main Configuration (`playwright.config.ts`)

- **Multi-browser support**: Chrome, Firefox, Safari, and mobile browsers
- **CI/CD optimized**: Conservative settings for reliable CI runs
- **Performance optimizations**: Browser launch arguments for better performance
- **Enhanced reporting**: Multiple reporter formats (list, HTML, JSON, JUnit)
- **Web server management**: Built-in dev server handling

#### Local Development Configuration (`playwright-local.config.ts`)

- **Higher concurrency**: 6 workers for faster local testing
- **Optimized for speed**: Disabled tracing and video recording
- **Reuse existing server**: Leverages running dev server when available
- **Better error tolerance**: Allows more failures before stopping

#### Performance Configuration (`playwright-performance.config.ts`)

- **Maximum concurrency**: 8 workers for performance testing
- **Minimal overhead**: Disabled all non-essential features
- **Aggressive optimizations**: Browser flags for maximum speed
- **No retries**: Zero retries for fastest feedback

### 2. Improved Server Management

#### Enhanced Global Setup (`e2e/global-setup.ts`)

- **Robust port cleanup**: Cross-platform process management
- **Health checks**: Multiple validation attempts with proper timeouts
- **Better logging**: Timestamped output for debugging
- **Error recovery**: Graceful handling of startup failures
- **Directory management**: Automatic test-results directory creation

#### Enhanced Global Teardown (`e2e/global-teardown.ts`)

- **Graceful shutdown**: SIGTERM before SIGKILL
- **Cross-platform cleanup**: Windows, macOS, and Linux support
- **Process verification**: Confirms cleanup success
- **Error resilience**: Continues cleanup even if errors occur

### 3. Optimized Test Scripts

#### New Test Commands

```bash
# Local development with high concurrency
pnpm test:e2e:local

# CI/CD testing with conservative settings
pnpm test:e2e:ci

# Maximum performance testing
pnpm test:e2e:fast

# Debug mode
pnpm test:e2e:debug

# Headed mode for visual debugging
pnpm test:e2e:headed

# View test reports
pnpm test:e2e:report
```

#### Optimized Test Script (`scripts/test-e2e-optimized.sh`)

- **Smart server management**: Reuses existing server or starts new one
- **Configurable concurrency**: Adjustable worker count
- **Cross-platform support**: Works on macOS, Linux, and Windows
- **Colored output**: Better visual feedback
- **Automatic cleanup**: Ensures clean state after tests

## 📊 Performance Improvements

### Concurrency Settings

| Environment | Workers | Max Failures | Retries | Purpose       |
| ----------- | ------- | ------------ | ------- | ------------- |
| Local Dev   | 6       | 15           | 1       | Fast feedback |
| CI/CD       | 2       | 5            | 2       | Reliability   |
| Performance | 8       | 20           | 0       | Maximum speed |

### Browser Optimizations

#### Chrome Launch Arguments

```typescript
launchOptions: {
  args: [
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-features=TranslateUI',
    '--disable-ipc-flooding-protection',
    '--disable-dev-shm-usage',
    '--no-sandbox',
  ]
}
```

### Timeout Optimizations

| Setting      | Local | CI  | Performance |
| ------------ | ----- | --- | ----------- |
| Test Timeout | 60s   | 60s | 45s         |
| Navigation   | 30s   | 30s | 20s         |
| Actions      | 20s   | 20s | 15s         |
| Assertions   | 15s   | 15s | 10s         |

## 🔧 Usage Examples

### Basic Local Testing

```bash
# Run tests with local optimizations
pnpm test:e2e:local

# Run with custom worker count
scripts/test-e2e-optimized.sh --local --workers 8

# Run with custom port
scripts/test-e2e-optimized.sh --local --port 3001
```

### CI/CD Testing

```bash
# Run tests with CI optimizations
pnpm test:e2e:ci

# Run with custom timeout
scripts/test-e2e-optimized.sh --ci --timeout 180
```

### Performance Testing

```bash
# Run maximum performance tests
pnpm test:e2e:fast

# Run with performance config directly
npx playwright test --config=playwright-performance.config.ts
```

### Debugging

```bash
# Run tests in debug mode
pnpm test:e2e:debug

# Run tests with headed browsers
pnpm test:e2e:headed

# View test reports
pnpm test:e2e:report
```

## 🛠️ Configuration Options

### Environment Variables

```bash
# Override default settings
PLAYWRIGHT_CONFIG_FILE=playwright-performance.config.ts
VERCEL_AUTOMATION_BYPASS_SECRET=your-secret
NODE_ENV=test
PORT=3000
```

### Script Options

```bash
# Available options for test-e2e-optimized.sh
-l, --local     # Local development mode
-c, --ci        # CI mode
-w, --workers   # Number of workers
-p, --port      # Port number
-t, --timeout   # Server startup timeout
-h, --help      # Show help
```

## 📈 Performance Metrics

### Expected Improvements

| Metric              | Before    | After       | Improvement |
| ------------------- | --------- | ----------- | ----------- |
| Test Execution Time | ~120s     | ~60s        | 50% faster  |
| Server Startup      | ~30s      | ~15s        | 50% faster  |
| Concurrency         | 2 workers | 6-8 workers | 3-4x more   |
| Memory Usage        | High      | Optimized   | 30% less    |
| Reliability         | Good      | Excellent   | More stable |

### Monitoring Performance

```bash
# Run performance tests and measure time
time pnpm test:e2e:fast

# Check memory usage during tests
ps aux | grep playwright

# Monitor server startup time
time scripts/test-e2e-optimized.sh --local
```

## 🔍 Troubleshooting

### Common Issues

#### Server Won't Start

```bash
# Check if port is in use
lsof -i :3000

# Kill processes on port
lsof -ti :3000 | xargs kill -9

# Restart with verbose logging
DEBUG=* scripts/test-e2e-optimized.sh --local
```

#### Tests Running Slowly

```bash
# Check system resources
htop

# Reduce worker count
scripts/test-e2e-optimized.sh --local --workers 4

# Use performance config
npx playwright test --config=playwright-performance.config.ts
```

#### Memory Issues

```bash
# Check memory usage
ps aux | grep node

# Kill remaining processes
pkill -f "playwright"
pkill -f "node.*dev"

# Restart with lower memory settings
NODE_OPTIONS="--max-old-space-size=2048" pnpm test:e2e:local
```

### Debug Mode

```bash
# Run with debug logging
DEBUG=playwright:* pnpm test:e2e:debug

# Run specific test with debug
npx playwright test --debug e2e/specific-test.spec.ts

# Run with headed browser
npx playwright test --headed
```

## 🎯 Best Practices

### For Local Development

1. Use `pnpm test:e2e:local` for daily testing
2. Use `pnpm test:e2e:fast` for quick feedback
3. Use `pnpm test:e2e:debug` for troubleshooting
4. Keep dev server running to reuse it

### For CI/CD

1. Use `pnpm test:e2e:ci` for reliable runs
2. Set appropriate environment variables
3. Monitor test results and performance
4. Use retries for flaky tests

### For Performance Testing

1. Use `playwright-performance.config.ts`
2. Run on dedicated hardware
3. Monitor system resources
4. Compare results over time

## 📝 Migration Guide

### From Old Setup

1. Update your test scripts to use new commands
2. Remove manual server management if using webServer config
3. Update CI/CD pipelines to use new configurations
4. Test with new concurrency settings

### Configuration Migration

```typescript
// Old way
export default defineConfig({
  workers: 2,
  use: { baseURL: 'http://localhost:3000' },
})

// New way
export default defineConfig({
  workers: process.env.CI ? 2 : 6,
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

## 🔮 Future Enhancements

### Planned Improvements

- [ ] Docker containerization for consistent environments
- [ ] Parallel test execution across multiple machines
- [ ] Advanced reporting with performance metrics
- [ ] Integration with monitoring tools
- [ ] Automated performance regression detection

### Contributing

To contribute to these optimizations:

1. Test changes with different configurations
2. Measure performance impact
3. Update documentation
4. Add new optimization strategies

---

For questions or issues, please refer to the troubleshooting section or create an issue in the repository.
