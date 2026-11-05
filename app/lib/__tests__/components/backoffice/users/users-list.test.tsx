import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UsersListComponent from '@/app/(dashboard)/backoffice/_components/users-list'
import type { UserWithTenant } from '@/types'

jest.mock('@/app/lib/services/users/user.queries', () => ({
  userQueries: {
    list: {
      useQuery: jest.fn(),
    },
  },
}))

import { userQueries } from '@/app/lib/services/users/user.queries'

const mockUseQuery = userQueries.list.useQuery as jest.Mock

function user(
  partial: Partial<UserWithTenant> & Pick<UserWithTenant, 'id' | 'name'>,
): UserWithTenant {
  return {
    email: 'user@example.com',
    role: 'teacher',
    active: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    tenantId: 'tenant-1',
    tenant: { id: 'tenant-1', name: 'Alpha District', slug: 'alpha' },
    ...partial,
  }
}

function ready(data: UserWithTenant[]) {
  return {
    data: { users: data, total: data.length },
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
    isFetching: false,
  }
}

const splitUsers = [
  user({ id: 'a', name: 'Alice Admin', role: 'admin', email: 'alice@alpha.edu' }),
  user({
    id: 'b',
    name: 'Bob Teacher',
    role: 'teacher',
    email: 'bob@beta.edu',
    tenantId: 'tenant-2',
    tenant: { id: 'tenant-2', name: 'Beta Schools', slug: 'beta' },
  }),
]

describe('UsersListComponent', () => {
  beforeAll(() => {
    Element.prototype.hasPointerCapture = () => false
    Element.prototype.setPointerCapture = () => {}
    Element.prototype.releasePointerCapture = () => {}
    Element.prototype.scrollIntoView = () => {}
  })

  beforeEach(() => {
    mockUseQuery.mockReset()
  })

  it('should hide status when every user is active', async () => {
    const userEvents = userEvent.setup()
    mockUseQuery.mockReturnValue(ready(splitUsers))
    render(<UsersListComponent />)

    expect(screen.queryByRole('combobox', { name: 'Status' })).not.toBeInTheDocument()
    expect(screen.queryByText('Active')).not.toBeInTheDocument()

    await userEvents.click(screen.getByRole('radio', { name: 'Grid view' }))

    expect(screen.queryByText('Active')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Alice Admin/ })).toHaveAttribute(
      'href',
      '/backoffice/users/a',
    )
  })

  it('should show status when users do not share one status', () => {
    mockUseQuery.mockReturnValue(
      ready([splitUsers[0], user({ ...splitUsers[1], active: false })]),
    )
    render(<UsersListComponent />)

    expect(screen.getByRole('combobox', { name: 'Status' })).toBeInTheDocument()
    expect(screen.getByText('Inactive')).toBeInTheDocument()
  })

  it('should clear a role filter that stops narrowing and keep it cleared', async () => {
    const userEvents = userEvent.setup()
    mockUseQuery.mockReturnValue(ready(splitUsers))
    const { rerender } = render(<UsersListComponent />)

    await userEvents.click(screen.getByRole('combobox', { name: 'Role' }))
    await userEvents.click(screen.getByRole('option', { name: 'Admin' }))

    expect(screen.getByText('Alice Admin')).toBeInTheDocument()
    expect(screen.queryByText('Bob Teacher')).not.toBeInTheDocument()

    mockUseQuery.mockReturnValue(
      ready([
        user({ id: 'a', name: 'Alice Admin', role: 'admin' }),
        user({ id: 'b', name: 'Bob Teacher', role: 'admin', email: 'bob@beta.edu' }),
      ]),
    )
    rerender(<UsersListComponent />)

    expect(screen.queryByRole('combobox', { name: 'Role' })).not.toBeInTheDocument()
    expect(screen.getByText('Alice Admin')).toBeInTheDocument()
    expect(screen.getByText('Bob Teacher')).toBeInTheDocument()

    mockUseQuery.mockReturnValue(ready(splitUsers))
    rerender(<UsersListComponent />)

    expect(screen.getByRole('combobox', { name: 'Role' })).toHaveTextContent('All roles')
    expect(screen.getByText('Alice Admin')).toBeInTheDocument()
    expect(screen.getByText('Bob Teacher')).toBeInTheDocument()
  })
})
