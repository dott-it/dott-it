import { render, screen } from '@testing-library/react'
import { UserCard } from '@/components/backoffice/users/user-card'
import type { UserWithTenant } from '@/types'

const mockUser: UserWithTenant = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'teacher',
  active: true,
  tenant: {
    id: 'tenant-1',
    name: 'Acme School',
    slug: 'acme-school',
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

describe('UserCard', () => {
  it('renders user name when available', () => {
    render(<UserCard user={mockUser} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('renders email when name is not available', () => {
    const userWithoutName: UserWithTenant = {
      ...mockUser,
      name: null,
    }

    render(<UserCard user={userWithoutName} />)

    // Email appears in both title and description, so use getAllByText
    const emailElements = screen.getAllByText('john@example.com')
    expect(emailElements.length).toBeGreaterThan(0)
  })

  it('renders "Unnamed User" when neither name nor email is available', () => {
    const userWithoutNameOrEmail: UserWithTenant = {
      ...mockUser,
      name: null,
      email: null,
    }

    render(<UserCard user={userWithoutNameOrEmail} />)

    expect(screen.getByText('Unnamed User')).toBeInTheDocument()
  })

  it('renders active badge when status can narrow the list', () => {
    render(<UserCard user={mockUser} showStatus />)

    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders inactive badge when user is not active', () => {
    const inactiveUser: UserWithTenant = {
      ...mockUser,
      active: false,
    }

    render(<UserCard user={inactiveUser} showStatus />)

    expect(screen.getByText('Inactive')).toBeInTheDocument()
  })

  it('should hide status when status cannot narrow the list', () => {
    render(<UserCard user={mockUser} />)

    expect(screen.queryByText('Active')).not.toBeInTheDocument()
  })

  it('renders email in description', () => {
    render(<UserCard user={mockUser} />)

    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })

  it('renders "No email" when email is not available', () => {
    const userWithoutEmail: UserWithTenant = {
      ...mockUser,
      email: null,
    }

    render(<UserCard user={userWithoutEmail} />)

    expect(screen.getByText('No email')).toBeInTheDocument()
  })

  it('renders role correctly', () => {
    render(<UserCard user={mockUser} />)

    expect(screen.getByText(/Role:/)).toBeInTheDocument()
    expect(screen.getByText('Teacher')).toBeInTheDocument()
  })

  it('should show No role when role is not available', () => {
    const userWithoutRole: UserWithTenant = {
      ...mockUser,
      role: null,
    }

    render(<UserCard user={userWithoutRole} />)

    expect(screen.getByText('No role')).toBeInTheDocument()
  })

  it('renders tenant name when tenant is assigned', () => {
    render(<UserCard user={mockUser} />)

    expect(screen.getByText('Acme School')).toBeInTheDocument()
  })

  it('renders "No tenant assigned" when tenant is not available', () => {
    const userWithoutTenant: UserWithTenant = {
      ...mockUser,
      tenant: null,
    }

    render(<UserCard user={userWithoutTenant} />)

    expect(screen.getByText('No tenant assigned')).toBeInTheDocument()
  })

  it('renders created date correctly', () => {
    render(<UserCard user={mockUser} />)

    const createdDate = new Date('2024-01-01').toLocaleDateString()
    expect(screen.getByText(new RegExp(`Created: ${createdDate}`))).toBeInTheDocument()
  })

  it('renders email verified date when available', () => {
    const userWithVerifiedEmail: UserWithTenant = {
      ...mockUser,
      emailVerified: new Date('2024-01-02'),
    }

    render(<UserCard user={userWithVerifiedEmail} />)

    const verifiedDate = new Date('2024-01-02').toLocaleDateString()
    expect(
      screen.getByText(new RegExp(`Verified: ${verifiedDate}`)),
    ).toBeInTheDocument()
  })

  it('does not render verified date when email is not verified', () => {
    render(<UserCard user={mockUser} />)

    expect(screen.queryByText(/Verified:/)).not.toBeInTheDocument()
  })

  it('should link the card to the user', () => {
    render(<UserCard user={mockUser} />)

    const cardLink = screen.getByRole('link', { name: /John Doe/ })
    expect(cardLink).toHaveAttribute('href', '/backoffice/users/user-1')
  })
})

