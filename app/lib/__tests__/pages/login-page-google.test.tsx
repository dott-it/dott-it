import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginPage from '@/app/(auth)/login/page'

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: jest.fn(() => null),
  }),
  usePathname: () => '/',
}))

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
})

// Mock fetch for API calls
globalThis.fetch = jest.fn()

// Mock next-auth signIn
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}))

import { signIn } from 'next-auth/react'
const mockSignIn = jest.mocked(signIn)
const mockFetch = jest.mocked(fetch)

describe('LoginPage with Google Sign-in', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders Google sign-in button', () => {
    render(<LoginPage />)
    expect(screen.getByText('Continue with Google')).toBeInTheDocument()
  })

  it('shows separator between email/password and Google sign-in', () => {
    render(<LoginPage />)
    expect(screen.getByText('Or continue with')).toBeInTheDocument()
  })

  it('handles Google sign-in click', async () => {
    render(<LoginPage />)

    const googleButton = screen.getByText('Continue with Google')
    fireEvent.click(googleButton)

    // Should call signIn with Google provider
    expect(mockSignIn).toHaveBeenCalledWith('google', { callbackUrl: '/workspace' })
  })

  it('maintains existing email/password functionality', async () => {
    // Mock successful API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Login successful' }),
    } as Response)

    // Mock successful signIn
    mockSignIn.mockResolvedValueOnce({
      url: '/workspace',
      error: undefined,
      status: 200,
      ok: true,
      code: 'success',
    })

    render(<LoginPage />)

    const emailInput = screen.getByPlaceholderText('teacher@school.edu')
    const passwordInput = screen.getByPlaceholderText('Enter your password')
    const signInButton = screen.getByText('Login')

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(signInButton)

    // Should call signIn with credentials
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(
        'credentials',
        expect.objectContaining({
          redirect: false,
          email: 'test@example.com',
          password: 'password123',
        }),
      )
    })
  })

  it('shows both login methods are available', () => {
    render(<LoginPage />)

    // Email/password form
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Password')).toBeInTheDocument()
    expect(screen.getByText('Login')).toBeInTheDocument()

    // Google sign-in
    expect(screen.getByText('Continue with Google')).toBeInTheDocument()
  })
})
