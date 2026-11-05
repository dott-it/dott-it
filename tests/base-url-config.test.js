import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test, expect } from '@playwright/test'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

test.describe('Base URL Configuration', () => {
  test('should use VERCEL_URL environment variable in production', () => {
    const assessmentPagePath = path.join(__dirname, '../app/(dashboard)/workspace/assessments/[id]/page.tsx')
    const contents = fs.readFileSync(assessmentPagePath, 'utf8')

    // Check that VERCEL_URL is being used
    expect(contents).toMatch(/process\.env\.VERCEL_URL/)

    // Check that there's a fallback for VERCEL_URL
    expect(contents).toMatch(/eddo-workspace\.vercel\.app/)

    // Check that NEXT_PUBLIC_BASE_URL is used for development
    expect(contents).toMatch(/process\.env\.NEXT_PUBLIC_BASE_URL/)

    // Check that localhost is used as fallback for development
    expect(contents).toMatch(/localhost:3000/)
  })

  test('should have proper environment variable configuration', () => {
    // Check that the base URL logic is properly structured
    const assessmentPagePath = path.join(__dirname, '../app/(dashboard)/workspace/assessments/[id]/page.tsx')
    const contents = fs.readFileSync(assessmentPagePath, 'utf8')

    // Should have the ternary operator for production vs development
    expect(contents).toMatch(/process\.env\.NODE_ENV === 'production'/)

    // Should use https for production
    expect(contents).toMatch(/https:\/\/\${process\.env\.VERCEL_URL/)

    // Should use http for development
    expect(contents).toMatch(/http:\/\/localhost:3000/)
  })

  test('should not have hardcoded localhost:3001', () => {
    // Check that the old hardcoded port is not present
    const assessmentPagePath = path.join(__dirname, '../app/(dashboard)/workspace/assessments/[id]/page.tsx')
    const contents = fs.readFileSync(assessmentPagePath, 'utf8')

    // Should not contain the old hardcoded port
    expect(contents).not.toMatch(/localhost:3001/)
  })
})
