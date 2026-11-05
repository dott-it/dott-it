/**
 * @jest-environment node
 */

import { isBackofficeTenant } from '../backoffice-tenant'
import { userPrisma } from '@/lib/user-prisma'

jest.mock('@/lib/user-prisma', () => ({
  userPrisma: {
    tenant: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    assessment: {
      findUnique: jest.fn(),
    },
    feedbackSection: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('@/app/lib/api/workspace-auth', () => ({
  requireWorkspaceAuth: jest.fn(),
  workspaceUnauthorizedResponse: jest.fn(),
}))

import { prisma } from '@/lib/prisma'
import {
  checkAssessmentTenantAccess,
  checkFeedbackSectionTenantAccess,
} from '../feedback-access'

const mockTenantFind = userPrisma.tenant.findUnique as jest.Mock
const mockAssessmentFind = prisma.assessment.findUnique as jest.Mock
const mockFeedbackSectionFind = prisma.feedbackSection.findUnique as jest.Mock

describe('isBackofficeTenant', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return true for Dott.it tenant slug', async () => {
    mockTenantFind.mockResolvedValue({ name: 'Dott.it', slug: 'dott-it' })
    await expect(isBackofficeTenant('tenant-dott-it')).resolves.toBe(true)
  })

  it('should return false for other tenants', async () => {
    mockTenantFind.mockResolvedValue({ name: 'Cameron', slug: 'cameron.k12' })
    await expect(isBackofficeTenant('tenant-cameron')).resolves.toBe(false)
  })
})

describe('checkAssessmentTenantAccess with backoffice bypass', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should allow Dott.it users to access assessments from another tenant', async () => {
    mockAssessmentFind.mockResolvedValue({ tenantId: 'tenant-cameron' })
    mockTenantFind.mockResolvedValue({ name: 'Dott.it', slug: 'dott-it' })

    const result = await checkAssessmentTenantAccess(
      { ownerUserId: 'user-1', tenantId: 'tenant-dott-it' },
      'assess-1',
    )

    expect(result).toBe('ok')
  })

  it('should forbid non-backoffice users from another tenant assessment', async () => {
    mockAssessmentFind.mockResolvedValue({ tenantId: 'tenant-cameron' })
    mockTenantFind.mockResolvedValue({ name: 'Other', slug: 'other' })

    const result = await checkAssessmentTenantAccess(
      { ownerUserId: 'user-1', tenantId: 'tenant-other' },
      'assess-1',
    )

    expect(result).toBe('forbidden')
  })
})

describe('checkFeedbackSectionTenantAccess for AI template rows', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should allow access when section has no Feedback but resolves via aiSuggestions', async () => {
    mockFeedbackSectionFind.mockResolvedValue({
      Feedback: null,
      aiSuggestions: {
        studentAnswer: {
          assessmentRecord: { tenantId: 'tenant-cameron' },
        },
      },
    })
    mockTenantFind.mockResolvedValue({ name: 'Dott.it', slug: 'dott-it' })

    const result = await checkFeedbackSectionTenantAccess(
      { ownerUserId: 'user-1', tenantId: 'tenant-dott-it' },
      'ai-template-section-1',
    )

    expect(result).toBe('ok')
  })

  it('should return not_found when section has neither Feedback nor aiSuggestions tenant', async () => {
    mockFeedbackSectionFind.mockResolvedValue({
      Feedback: null,
      aiSuggestions: null,
    })

    const result = await checkFeedbackSectionTenantAccess(
      { ownerUserId: 'user-1', tenantId: 'tenant-dott-it' },
      'orphan-section',
    )

    expect(result).toBe('not_found')
  })
})
