import { renderHook } from '@testing-library/react'
import { useAuthHttpClient } from '@/app/lib/hooks/use-auth-http-client'

// Mock the service module
jest.mock('@/lib/service', () => ({
  createHttpClientWithAuth: jest.fn(),
}))

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock console.log to avoid noise in tests
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {})

// Import the mocked function
import { createHttpClientWithAuth } from '@/lib/service'
import { useSession } from 'next-auth/react'
const mockCreateHttpClientWithAuth = createHttpClientWithAuth as jest.MockedFunction<typeof createHttpClientWithAuth>
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

// Helper function to create session mocks
const createSessionMock = (user: Partial<{ id: string; authToken: string; tenantId: string; name: string; email: string }> | null = null) => {
  if (user === null) {
    return {
      data: null,
      status: 'unauthenticated' as const,
      update: jest.fn(),
    }
  }
  
  return {
    data: {
      user: {
        id: 'user-123',
        authToken: 'mock-token',
        tenantId: 'tenant-123',
        name: 'John Doe',
        email: 'john@example.com',
        ...user,
      },
      expires: '2024-12-31T23:59:59.999Z',
    },
    status: 'authenticated' as const,
    update: jest.fn(),
  }
}

describe('useAuthHttpClient Hook', () => {
  const mockHttpClient = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    purge: jest.fn(),
    base: 'http://localhost:3000',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateHttpClientWithAuth.mockReturnValue(mockHttpClient)
  })

  afterAll(() => {
    mockConsoleLog.mockRestore()
  })

  describe('Authentication Token Handling', () => {
    it('should create HTTP client with auth token when session exists', () => {
      mockUseSession.mockReturnValue(createSessionMock({
        authToken: 'mock-auth-token-123',
      }))

      renderHook(() => useAuthHttpClient())

      expect(mockCreateHttpClientWithAuth).toHaveBeenCalledWith('mock-auth-token-123')
    })

    it('should create HTTP client with null token when no session', () => {
      mockUseSession.mockReturnValue(createSessionMock(null))

      renderHook(() => useAuthHttpClient())

      expect(mockCreateHttpClientWithAuth).toHaveBeenCalledWith(null)
    })

    it('should create HTTP client with null token when session has no user', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: null as unknown as { id: string; authToken: string; tenantId: string | null; } & { name?: string; email?: string; image?: string; },
          expires: '2024-12-31T23:59:59.999Z',
        },
        status: 'authenticated' as const,
        update: jest.fn(),
      })

      renderHook(() => useAuthHttpClient())

      expect(mockCreateHttpClientWithAuth).toHaveBeenCalledWith(null)
    })

    it('should create HTTP client with null token when user has no authToken', () => {
      mockUseSession.mockReturnValue(createSessionMock({
        authToken: '',
      }))

      renderHook(() => useAuthHttpClient())

      expect(mockCreateHttpClientWithAuth).toHaveBeenCalledWith(null)
    })

    it('should create HTTP client with null token when authToken is empty string', () => {
      mockUseSession.mockReturnValue(createSessionMock({
        authToken: '',
      }))

      renderHook(() => useAuthHttpClient())

      expect(mockCreateHttpClientWithAuth).toHaveBeenCalledWith(null)
    })
  })

  describe('Return Value', () => {
    it('should return the HTTP client instance', () => {
      mockUseSession.mockReturnValue(createSessionMock({
        authToken: 'mock-token',
      }))

      const { result } = renderHook(() => useAuthHttpClient())

      expect(result.current).toBe(mockHttpClient)
    })

    it('should return the same HTTP client instance on re-renders with same session', () => {
      mockUseSession.mockReturnValue(createSessionMock({
        authToken: 'mock-token',
      }))

      const { result, rerender } = renderHook(() => useAuthHttpClient())

      const firstClient = result.current

      rerender()

      expect(result.current).toBe(firstClient)
      expect(mockCreateHttpClientWithAuth).toHaveBeenCalledTimes(1)
    })
  })

  describe('Logging', () => {
    it('should log authentication details when session exists', () => {
      mockUseSession.mockReturnValue(createSessionMock({
        authToken: 'mock-auth-token-1234567890',
      }))

      renderHook(() => useAuthHttpClient())

      expect(mockConsoleLog).toHaveBeenCalledWith('🔑 useAuthHttpClient:', {
        hasSession: true,
        hasUser: true,
        hasAuthToken: true,
        authToken: '***67890',
      })
    })

    it('should log authentication details when no session', () => {
      mockUseSession.mockReturnValue(createSessionMock(null))

      renderHook(() => useAuthHttpClient())

      expect(mockConsoleLog).toHaveBeenCalledWith('🔑 useAuthHttpClient:', {
        hasSession: false,
        hasUser: false,
        hasAuthToken: false,
        authToken: null,
      })
    })

    it('should log authentication details when session has no user', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: null as unknown as { id: string; authToken: string; tenantId: string | null; } & { name?: string; email?: string; image?: string; },
          expires: '2024-12-31T23:59:59.999Z',
        },
        status: 'authenticated' as const,
        update: jest.fn(),
      })

      renderHook(() => useAuthHttpClient())

      expect(mockConsoleLog).toHaveBeenCalledWith('🔑 useAuthHttpClient:', {
        hasSession: true,
        hasUser: false,
        hasAuthToken: false,
        authToken: null,
      })
    })

    it('should log authentication details when user has no authToken', () => {
      mockUseSession.mockReturnValue(createSessionMock({
        authToken: '',
      }))

      renderHook(() => useAuthHttpClient())

      expect(mockConsoleLog).toHaveBeenCalledWith('🔑 useAuthHttpClient:', {
        hasSession: true,
        hasUser: true,
        hasAuthToken: false,
        authToken: null,
      })
    })

    it('should mask auth token in logs showing only last 10 characters', () => {
      mockUseSession.mockReturnValue(createSessionMock({
        authToken: 'very-long-auth-token-1234567890abcdef',
      }))

      renderHook(() => useAuthHttpClient())

      expect(mockConsoleLog).toHaveBeenCalledWith('🔑 useAuthHttpClient:', {
        hasSession: true,
        hasUser: true,
        hasAuthToken: true,
        authToken: '***bcdef',
      })
    })
  })

  describe('Session Changes', () => {
    it('should update HTTP client when session changes', () => {
      // Start with no session
      mockUseSession.mockReturnValue(createSessionMock(null))

      const { rerender } = renderHook(() => useAuthHttpClient())

      expect(mockCreateHttpClientWithAuth).toHaveBeenCalledWith(null)

      // Update session with auth token
      mockUseSession.mockReturnValue(createSessionMock({
        authToken: 'new-token',
      }))

      rerender()

      expect(mockCreateHttpClientWithAuth).toHaveBeenCalledWith('new-token')
      expect(mockCreateHttpClientWithAuth).toHaveBeenCalledTimes(2)
    })

    it('should update HTTP client when auth token changes', () => {
      // Start with first token
      mockUseSession.mockReturnValue(createSessionMock({
        authToken: 'token-1',
      }))

      const { rerender } = renderHook(() => useAuthHttpClient())

      expect(mockCreateHttpClientWithAuth).toHaveBeenCalledWith('token-1')

      // Change auth token
      mockUseSession.mockReturnValue(createSessionMock({
        authToken: 'token-2',
      }))

      rerender()

      expect(mockCreateHttpClientWithAuth).toHaveBeenCalledWith('token-2')
      expect(mockCreateHttpClientWithAuth).toHaveBeenCalledTimes(2)
    })

    it('should update HTTP client when session is cleared', () => {
      // Start with session
      mockUseSession.mockReturnValue(createSessionMock({
        authToken: 'token',
      }))

      const { rerender } = renderHook(() => useAuthHttpClient())

      expect(mockCreateHttpClientWithAuth).toHaveBeenCalledWith('token')

      // Clear session
      mockUseSession.mockReturnValue(createSessionMock(null))

      rerender()

      expect(mockCreateHttpClientWithAuth).toHaveBeenCalledWith(null)
      expect(mockCreateHttpClientWithAuth).toHaveBeenCalledTimes(2)
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined session gracefully', () => {
      mockUseSession.mockReturnValue(createSessionMock(null))

      renderHook(() => useAuthHttpClient())

      expect(mockCreateHttpClientWithAuth).toHaveBeenCalledWith(null)
    })

    it('should handle session with undefined user', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: null as unknown as { id: string; authToken: string; tenantId: string | null; } & { name?: string; email?: string; image?: string; },
          expires: '2024-12-31T23:59:59.999Z',
        },
        status: 'authenticated' as const,
        update: jest.fn(),
      })

      renderHook(() => useAuthHttpClient())

      expect(mockCreateHttpClientWithAuth).toHaveBeenCalledWith(null)
    })

    it('should handle user with undefined authToken', () => {
      mockUseSession.mockReturnValue(createSessionMock({
        authToken: '',
      }))

      renderHook(() => useAuthHttpClient())

      expect(mockCreateHttpClientWithAuth).toHaveBeenCalledWith(null)
    })
  })
})
