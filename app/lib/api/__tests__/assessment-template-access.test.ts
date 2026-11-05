/**
 * @jest-environment node
 */

import { auth } from '@/lib/auth.config'
import { isBackofficeTenant } from '../backoffice-tenant'
import { assessmentTemplateAccessResponse } from '../assessment-template-access'

jest.mock('@/lib/auth.config', () => ({
  auth: jest.fn(),
}))

jest.mock('../backoffice-tenant', () => ({
  isBackofficeTenant: jest.fn(),
}))

const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockIsBackofficeTenant = isBackofficeTenant as jest.MockedFunction<typeof isBackofficeTenant>

describe('assessment template access', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should reject a missing session before reading templates', async () => {
    mockAuth.mockResolvedValue(null)

    const response = await assessmentTemplateAccessResponse('Please log in to access this resource')

    expect(response?.status).toBe(401)
    expect(mockIsBackofficeTenant).not.toHaveBeenCalled()
    await expect(response?.json()).resolves.toMatchObject({
      error: 'Unauthorized',
      details: 'Please log in to access this resource',
    })
  })

  it('should reject a signed-in tenant that is not backoffice', async () => {
    mockAuth.mockResolvedValue({
      user: { tenantId: 'tenant-other' },
      expires: '2099-01-01',
    })
    mockIsBackofficeTenant.mockResolvedValue(false)

    const response = await assessmentTemplateAccessResponse('Please log in to access this resource')

    expect(mockIsBackofficeTenant).toHaveBeenCalledWith('tenant-other')
    expect(response?.status).toBe(403)
    await expect(response?.json()).resolves.toMatchObject({
      error: 'Forbidden',
      details: 'Assessment templates are restricted to Dott.it tenant users',
    })
  })

  it('should allow an Dott.it backoffice session to continue', async () => {
    mockAuth.mockResolvedValue({
      user: { tenantId: 'tenant-dott-it' },
      expires: '2099-01-01',
    })
    mockIsBackofficeTenant.mockResolvedValue(true)

    await expect(
      assessmentTemplateAccessResponse('Please log in to access this resource'),
    ).resolves.toBeNull()
  })
})
