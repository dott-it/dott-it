import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LoginForm } from '@/app/lib/components/auth'

// Mock Next.js router
const mockPush = jest.fn()
const mockSearchParams = new URLSearchParams()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
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

// Mock next-auth signIn function
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}))

import { signIn } from 'next-auth/react'
const mockSignIn = jest.mocked(signIn)
const mockFetch = jest.mocked(fetch)

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders login form with all elements', () => {
    render(<LoginForm />)

    // Check form elements
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
    expect(screen.getByText('Continue with Google')).toBeInTheDocument()
  })

  it('handles email/password login successfully', async () => {
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

    render(<LoginForm />)

    const emailInput = screen.getByPlaceholderText('teacher@school.edu')
    const passwordInput = screen.getByPlaceholderText('Enter your password')
    const submitButton = screen.getByRole('button', { name: /login/i })

    // Fill form
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    // Submit form
    fireEvent.click(submitButton)

    // Check loading state
    expect(screen.getByText('Logging in...')).toBeInTheDocument()

    // Wait for redirect
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/workspace')
    })

    // Check API was called
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    })

    // Check signIn was called with correct parameters
    expect(mockSignIn).toHaveBeenCalledWith('credentials', {
      redirect: false,
      email: 'test@example.com',
      password: 'password123',
      callbackUrl: '/workspace',
    })
  })

  it('keeps email/password redirects on the current deployment when NextAuth returns an absolute URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Login successful' }),
    } as Response)

    mockSignIn.mockResolvedValueOnce({
      url: 'https://stale-preview-host.vercel.app/workspace?from=login#top',
      error: undefined,
      status: 200,
      ok: true,
      code: 'success',
    })

    render(<LoginForm />)

    fireEvent.change(screen.getByPlaceholderText('teacher@school.edu'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/workspace?from=login#top')
    })
  })

  it('shows error for invalid credentials', async () => {
    // Mock failed API response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Invalid credentials' }),
    } as Response)

    render(<LoginForm />)

    const emailInput = screen.getByPlaceholderText('teacher@school.edu')
    const passwordInput = screen.getByPlaceholderText('Enter your password')
    const submitButton = screen.getByRole('button', { name: /login/i })

    // Fill form
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })

    // Submit form
    fireEvent.click(submitButton)

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('handles Google sign in', async () => {
    render(<LoginForm />)

    const googleButton = screen.getByText('Continue with Google')
    fireEvent.click(googleButton)

    // Check that Google signIn was called
    expect(mockSignIn).toHaveBeenCalledWith('google', { callbackUrl: '/workspace' })
  })

  it('uses custom redirect URL', async () => {
    // Mock successful API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Login successful' }),
    } as Response)

    // Mock successful signIn with custom redirect
    mockSignIn.mockResolvedValueOnce({
      url: '/custom-dashboard',
      error: undefined,
      status: 200,
      ok: true,
      code: 'success',
    })

    render(<LoginForm redirectTo="/custom-dashboard" />)

    const emailInput = screen.getByPlaceholderText('teacher@school.edu')
    const passwordInput = screen.getByPlaceholderText('Enter your password')
    const submitButton = screen.getByRole('button', { name: /login/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/custom-dashboard')
    })

    // Check signIn was called with custom redirect URL
    expect(mockSignIn).toHaveBeenCalledWith('credentials', {
      redirect: false,
      email: 'test@example.com',
      password: 'password123',
      callbackUrl: '/custom-dashboard',
    })
  })

  it('hides Google auth when showGoogleAuth is false', () => {
    render(<LoginForm showGoogleAuth={false} />)

    expect(screen.queryByText('Continue with Google')).not.toBeInTheDocument()
    expect(screen.queryByText('Or continue with')).not.toBeInTheDocument()
  })

  it('renders form with proper structure', () => {
    render(<LoginForm />)

    // Check form structure
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Password')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('teacher@school.edu')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument()
  })

  it('forwards ref to form element', () => {
    const ref = React.createRef<HTMLFormElement>()
    render(<LoginForm ref={ref} />)

    expect(ref.current).toBeInstanceOf(HTMLFormElement)
  })

  it('generates consistent IDs for form fields', () => {
    const { rerender } = render(<LoginForm />)

    const firstEmailInput = screen.getByPlaceholderText('teacher@school.edu')
    const firstPasswordInput = screen.getByPlaceholderText('Enter your password')

    const firstEmailId = firstEmailInput.id
    const firstPasswordId = firstPasswordInput.id

    // Re-render and check IDs are consistent
    rerender(<LoginForm />)

    const secondEmailInput = screen.getByPlaceholderText('teacher@school.edu')
    const secondPasswordInput = screen.getByPlaceholderText('Enter your password')

    expect(secondEmailInput.id).toBe(firstEmailId)
    expect(secondPasswordInput.id).toBe(firstPasswordId)
  })
})
