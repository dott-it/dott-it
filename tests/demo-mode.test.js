import { test } from 'node:test'
import assert from 'node:assert'

// Mock environment variables for testing
const originalEnv = { ...process.env }

test('should detect demo mode when DEMO_MODE is set to true', async () => {
  process.env.DEMO_MODE = 'true'

  // Import after setting env var
  const { isDemoMode } = await import('../lib/demo-mode.ts')

  assert.strictEqual(isDemoMode(), true)

  // Cleanup
  process.env = { ...originalEnv }
})

test('should not detect demo mode when DEMO_MODE is not set', async () => {
  delete process.env.DEMO_MODE

  // Import after clearing env var
  const { isDemoMode } = await import('../lib/demo-mode.ts')

  assert.strictEqual(isDemoMode(), false)

  // Cleanup
  process.env = { ...originalEnv }
})

test('should not detect demo mode when DEMO_MODE is set to false', async () => {
  process.env.DEMO_MODE = 'false'

  // Import after setting env var
  const { isDemoMode } = await import('../lib/demo-mode.ts')

  assert.strictEqual(isDemoMode(), false)

  // Cleanup
  process.env = { ...originalEnv }
})

test('should return demo mode configuration', async () => {
  process.env.DEMO_MODE = 'true'
  process.env.DEMO_ASSESSMENT_ID = 'test-assessment'
  process.env.DEMO_TENANT_ID = 'test-tenant'
  process.env.DEMO_DOMAIN = 'test.demo.com'

  // Import after setting env vars
  const { getDemoModeConfig } = await import('../lib/demo-mode.ts')
  const config = getDemoModeConfig()

  assert.strictEqual(config.isEnabled, true)
  assert.strictEqual(config.showDemoBanner, true)
  assert.strictEqual(config.useMockData, true)
  assert.strictEqual(config.allowAnonymousAccess, true)
  assert.strictEqual(config.demoAssessmentId, 'test-assessment')
  assert.strictEqual(config.demoTenantId, 'test-tenant')
  assert.strictEqual(config.demoDomain, 'test.demo.com')

  // Cleanup
  process.env = { ...originalEnv }
})

test('should return default demo mode message', async () => {
  process.env.DEMO_MODE = 'true'
  delete process.env.DEMO_MODE_MESSAGE

  // Import after clearing env var
  const { getDemoModeMessage } = await import('../lib/demo-mode.ts')
  const message = getDemoModeMessage()

  assert.strictEqual(message, 'Demo mode: showing all assessments and simulating activity')

  // Cleanup
  process.env = { ...originalEnv }
})

test('should return custom demo mode message', async () => {
  process.env.DEMO_MODE = 'true'
  process.env.DEMO_MODE_MESSAGE = 'Custom demo message'

  // Import after setting env var
  const { getDemoModeMessage } = await import('../lib/demo-mode.ts')
  const message = getDemoModeMessage()

  assert.strictEqual(message, 'Custom demo message')

  // Cleanup
  process.env = { ...originalEnv }
})

test('should return demo mode features', async () => {
  process.env.DEMO_MODE = 'true'
  process.env.DEMO_READ_ONLY = 'true'

  // Import after setting env vars
  const { getDemoModeFeatures } = await import('../lib/demo-mode.ts')
  const features = getDemoModeFeatures()

  assert.strictEqual(features.features.anonymousView, true)
  assert.strictEqual(features.features.mockData, true)
  assert.strictEqual(features.features.demoAssessments, true)
  assert.strictEqual(features.limitations.readOnlyMode, true)

  // Cleanup
  process.env = { ...originalEnv }
})
