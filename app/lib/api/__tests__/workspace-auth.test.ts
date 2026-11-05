/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth.config'
import { getTokenFromRequest, verifyAuthToken } from '@/lib/auth'
import { userPrisma } from '@/lib/user-prisma'
import { getWorkspaceAuthFromRequest } from '../workspace-auth'

jest.mock('@/lib/auth.config', () => ({
  auth: jest.fn(),
}))

jest.mock('@/lib/auth', () => ({
  getTokenFromRequest: jest.fn(),
  verifyAuthToken: jest.fn(),
}))

jest.mock('@/lib/user-prisma', () => ({
  userPrisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}))

const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockGetTokenFromRequest = getTokenFromRequest as jest.Mock
const mockVerifyAuthToken = verifyAuthToken as jest.Mock
const mockFindUnique = userPrisma.user.findUnique as jest.Mock

function createRequest(): NextRequest {
  return new NextRequest('http://localhost/api/thematic-analysis/assess-1')
}

describe('getWorkspaceAuthFromRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetTokenFromRequest.mockReturnValue(null)
    mockVerifyAuthToken.mockReturnValue(null)
  })

  it('should resolve auth from session when tenantId is present', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', tenantId: 'tenant-1' },
    } as never)

    const result = await getWorkspaceAuthFromRequest(createRequest())

    expect(result).toEqual({
      ownerUserId: 'user-1',
      tenantId: 'tenant-1',
    })
    expect(mockFindUnique).not.toHaveBeenCalled()
  })

  it('should fall back to user DB tenantId when session tenantId is missing', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', tenantId: null },
    } as never)
    mockFindUnique.mockResolvedValue({
      tenantId: 'tenant-from-db',
      active: true,
    })

    const result = await getWorkspaceAuthFromRequest(createRequest())

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { tenantId: true, active: true },
    })
    expect(result).toEqual({
      ownerUserId: 'user-1',
      tenantId: 'tenant-from-db',
    })
  })

  it('should not use inactive user tenant from DB fallback', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', tenantId: null },
    } as never)
    mockFindUnique.mockResolvedValue({
      tenantId: 'tenant-from-db',
      active: false,
    })

    const result = await getWorkspaceAuthFromRequest(createRequest())

    expect(result).toBeNull()
  })

  it('should resolve auth from bearer token when session is missing', async () => {
    mockAuth.mockResolvedValue(null as never)
    mockGetTokenFromRequest.mockReturnValue('bearer-token')
    mockVerifyAuthToken.mockReturnValue({
      sub: 'user-2',
      tenantId: 'tenant-2',
    })

    const result = await getWorkspaceAuthFromRequest(createRequest())

    expect(result).toEqual({
      ownerUserId: 'user-2',
      tenantId: 'tenant-2',
    })
  })
})
