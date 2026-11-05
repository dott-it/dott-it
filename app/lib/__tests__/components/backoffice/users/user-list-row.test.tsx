import { render, screen } from '@testing-library/react'
import { UserListRow } from '@/components/backoffice/users/user-list-row'
import type { UserWithTenant } from '@/types'

const mockUser: UserWithTenant = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'teacher',
  active: true,
  tenantId: 'tenant-1',
  tenant: {
    id: 'tenant-1',
    name: 'Acme School',
    slug: 'acme-school',
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

describe('UserListRow', () => {
  it('should link the row to the user', () => {
    render(<UserListRow user={mockUser} />)

    const rowLink = screen.getByRole('link', { name: /John Doe/ })
    expect(rowLink).toHaveAttribute('href', '/backoffice/users/user-1')
  })

  it('should show email, tenant, and role', () => {
    render(<UserListRow user={mockUser} />)

    expect(screen.getByText(/john@example.com · Acme School/)).toBeInTheDocument()
    expect(screen.getByText('Teacher')).toBeInTheDocument()
  })

  it('should show status when status can narrow the list', () => {
    render(<UserListRow user={mockUser} showStatus />)

    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('should hide status when status cannot narrow the list', () => {
    render(<UserListRow user={mockUser} />)

    expect(screen.queryByText('Active')).not.toBeInTheDocument()
  })

  it('should label a user without a tenant', () => {
    render(<UserListRow user={{ ...mockUser, tenant: null, tenantId: null, role: null }} />)

    expect(screen.getByText(/john@example.com · No tenant/)).toBeInTheDocument()
    expect(screen.getByText('No role')).toBeInTheDocument()
  })
})
