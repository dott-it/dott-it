import { renderHook, act, waitFor } from '@testing-library/react'
import { useGoogleAuth } from '@/app/lib/hooks/use-google-auth'

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('useGoogleAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock localStorage
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    })
  })

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useGoogleAuth())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe('')
  })

  it('handles successful Google sign-in', async () => {
    const { result } = renderHook(() => useGoogleAuth())

    await act(async () => {
      await result.current.signInWithGoogle()
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockPush).toHaveBeenCalledWith('/workspace')
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'v2-auth',
      expect.stringContaining('Demo Teacher'),
    )
  })

  it('shows loading state during sign-in', async () => {
    const { result } = renderHook(() => useGoogleAuth())

    act(() => {
      result.current.signInWithGoogle()
    })

    expect(result.current.isLoading).toBe(true)
  })

  it('stores user data in localStorage on successful sign-in', async () => {
    const { result } = renderHook(() => useGoogleAuth())

    await act(async () => {
      await result.current.signInWithGoogle()
    })

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'v2-auth',
        expect.stringContaining('Demo Teacher'),
      )
    })

    const storedData = JSON.parse((localStorage.setItem as jest.Mock).mock.calls[0][1])
    expect(storedData.user.email).toBe('demo.teacher@gmail.com')
    expect(storedData.user.name).toBe('Demo Teacher')
    expect(storedData.token).toMatch(/google-token-/)
  })

  it('redirects to workspace on successful sign-in', async () => {
    const { result } = renderHook(() => useGoogleAuth())

    await act(async () => {
      await result.current.signInWithGoogle()
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/workspace')
    })
  })
})
