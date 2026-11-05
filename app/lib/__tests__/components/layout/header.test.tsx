import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppHeader } from '@/app/lib/components/ui/layout/header/app-header'

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
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

// Mock next-auth
const mockUseSession = jest.fn()

jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
  useSession: () => mockUseSession(),
}))

// Mock fetch
globalThis.fetch = jest.fn()

describe('AppHeader', () => {
  const user = userEvent.setup()
  const mockUser = {
    name: 'John Doe',
    email: 'john.doe@example.com',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-1',
          email: mockUser.email,
          tenantId: null,
        },
      },
      status: 'authenticated',
    })
    ;(globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ canAccess: false }),
    })
  })

  it('renders user information in dropdown', async () => {
    render(<AppHeader user={mockUser} />)

    // User name should be visible in the trigger button
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('renders default title', () => {
    render(<AppHeader user={mockUser} />)

    expect(screen.getByText('dott-it')).toBeInTheDocument()
  })

  it('renders custom title', () => {
    render(<AppHeader user={mockUser} title="Custom Dashboard" />)

    expect(screen.getByText('Custom Dashboard')).toBeInTheDocument()
  })

  it('opens dropdown and shows library and logout options', async () => {
    render(<AppHeader user={mockUser} />)

    // Find and click the dropdown trigger
    const trigger = screen.getByText('John Doe').closest('button')
    expect(trigger).toBeInTheDocument()
    
    if (trigger) {
      await user.click(trigger)
      
      // Wait for dropdown to appear and check for library + logout
      await waitFor(() => {
        expect(screen.getByText('Assessment Library')).toBeInTheDocument()
        const libraryLink = screen.getByText('Assessment Library').closest('a')
        expect(libraryLink).toHaveAttribute('href', '/library/openscied')
        expect(libraryLink).toHaveAttribute('target', '_blank')
        expect(screen.getByText('Logout')).toBeInTheDocument()
      })
    }
  })

  it('calls custom logout handler when provided', async () => {
    const mockLogout = jest.fn()
    render(<AppHeader user={mockUser} onLogout={mockLogout} />)

    // Open dropdown
    const trigger = screen.getByText('John Doe').closest('button')
    if (trigger) {
      await user.click(trigger)
      
      await waitFor(() => {
        const logoutButton = screen.getByText('Logout')
        fireEvent.click(logoutButton)
      })

      expect(mockLogout).toHaveBeenCalledTimes(1)
    }
  })

  it('uses default logout behavior when no custom handler provided', async () => {
    render(<AppHeader user={mockUser} />)

    // Open dropdown
    const trigger = screen.getByText('John Doe').closest('button')
    if (trigger) {
      await user.click(trigger)
      
      await waitFor(() => {
        const logoutButton = screen.getByText('Logout')
        fireEvent.click(logoutButton)
      })

      const { signOut } = jest.requireMock('next-auth/react') as { signOut: jest.Mock }
      expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/login' })
    }
  })

  it('shows backoffice option when user has access', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-1',
          email: mockUser.email,
          tenantId: 'tenant-1',
        },
      },
      status: 'authenticated',
    })
    ;(globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ canAccess: true }),
    })

    render(<AppHeader user={mockUser} />)

    // Wait for fetch to complete
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled()
    })

    // Open dropdown
    const trigger = screen.getByText('John Doe').closest('button')
    if (trigger) {
      await user.click(trigger)
      
      await waitFor(() => {
        expect(screen.getByText('Backoffice')).toBeInTheDocument()
        expect(screen.getByText('Logout')).toBeInTheDocument()
      })
    }
  })

  it('does not show backoffice option when user does not have access', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-1',
          email: mockUser.email,
          tenantId: 'tenant-1',
        },
      },
      status: 'authenticated',
    })
    ;(globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ canAccess: false }),
    })

    render(<AppHeader user={mockUser} />)

    // Wait for fetch to complete
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled()
    })

    // Open dropdown
    const trigger = screen.getByText('John Doe').closest('button')
    if (trigger) {
      await user.click(trigger)
      
      await waitFor(() => {
        expect(screen.queryByText('Backoffice')).not.toBeInTheDocument()
        expect(screen.getByText('Logout')).toBeInTheDocument()
      })
    }
  })

  it('renders user email in dropdown when available', async () => {
    render(<AppHeader user={mockUser} />)

    // Open dropdown
    const trigger = screen.getByText('John Doe').closest('button')
    if (trigger) {
      await user.click(trigger)
      
      await waitFor(() => {
        expect(screen.getByText('john.doe@example.com')).toBeInTheDocument()
      })
    }
  })

  it('renders user icon', () => {
    const { container } = render(<AppHeader user={mockUser} />)

    // Check for SVG elements (icons)
    const svgElements = container.querySelectorAll('svg')
    expect(svgElements.length).toBeGreaterThanOrEqual(1) // User icon at minimum
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLElement>()
    render(<AppHeader ref={ref} user={mockUser} />)

    expect(ref.current).toBeInstanceOf(HTMLElement)
    expect(ref.current?.tagName).toBe('HEADER')
  })

  it('has correct CSS classes for styling', () => {
    const { container } = render(<AppHeader user={mockUser} />)
    const header = container.querySelector('header')

    expect(header).toHaveClass('border-b', 'bg-card')
  })
})
