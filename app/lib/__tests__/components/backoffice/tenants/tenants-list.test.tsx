import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TenantsListComponent from '@/app/(dashboard)/backoffice/_components/tenants-list'
import type { Tenant } from '@/types'

jest.mock('@/app/lib/services/tenants/tenant.queries', () => ({
  tenantQueries: {
    list: {
      useQuery: jest.fn(),
    },
  },
}))

import { tenantQueries } from '@/app/lib/services/tenants/tenant.queries'

const mockUseQuery = tenantQueries.list.useQuery as jest.Mock

function tenant(partial: Partial<Tenant> & Pick<Tenant, 'id' | 'name' | 'slug'>): Tenant {
  return {
    domains: ['example.com'],
    userCount: 1,
    adminCount: 1,
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  }
}

function ready(data: Tenant[]) {
  return {
    data,
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
    isFetching: false,
  }
}

const splitTenants = [
  tenant({ id: 'a', name: 'Alpha District', slug: 'alpha', domains: ['alpha.edu'] }),
  tenant({ id: 'b', name: 'Beta Schools', slug: 'beta', domains: ['beta.edu'] }),
]

describe('TenantsListComponent', () => {
  beforeAll(() => {
    Element.prototype.hasPointerCapture = () => false
    Element.prototype.setPointerCapture = () => {}
    Element.prototype.releasePointerCapture = () => {}
    Element.prototype.scrollIntoView = () => {}
  })

  beforeEach(() => {
    mockUseQuery.mockReset()
  })

  it('should hide status when every tenant is active', async () => {
    const user = userEvent.setup()
    mockUseQuery.mockReturnValue(ready(splitTenants))
    render(<TenantsListComponent />)

    expect(screen.queryByRole('combobox', { name: 'Status' })).not.toBeInTheDocument()
    expect(screen.queryByText('active')).not.toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'Grid view' }))

    expect(screen.queryByText(/Status:/)).not.toBeInTheDocument()
    expect(screen.getByText('Alpha District')).toBeInTheDocument()
  })

  it('should show status when tenants do not share one status', () => {
    mockUseQuery.mockReturnValue(
      ready([
        splitTenants[0],
        tenant({
          id: 'b',
          name: 'Beta Schools',
          slug: 'beta',
          domains: ['beta.edu'],
          status: 'inactive',
        }),
      ]),
    )
    render(<TenantsListComponent />)

    expect(screen.getByRole('combobox', { name: 'Status' })).toBeInTheDocument()
    expect(screen.getByText('inactive')).toBeInTheDocument()
  })

  it('should clear a domain filter that stops narrowing and keep it cleared', async () => {
    const user = userEvent.setup()
    mockUseQuery.mockReturnValue(ready(splitTenants))
    const { rerender } = render(<TenantsListComponent />)

    await user.click(screen.getByRole('combobox', { name: 'Domain' }))
    await user.click(screen.getByRole('option', { name: 'alpha.edu' }))

    expect(screen.getByText('Alpha District')).toBeInTheDocument()
    expect(screen.queryByText('Beta Schools')).not.toBeInTheDocument()

    mockUseQuery.mockReturnValue(
      ready([
        tenant({
          id: 'a',
          name: 'Alpha District',
          slug: 'alpha',
          domains: ['alpha.edu', 'shared.edu'],
        }),
        tenant({
          id: 'b',
          name: 'Beta Schools',
          slug: 'beta',
          domains: ['alpha.edu', 'shared.edu'],
        }),
      ]),
    )
    rerender(<TenantsListComponent />)

    expect(screen.queryByRole('combobox', { name: 'Domain' })).not.toBeInTheDocument()
    expect(screen.getByText('Alpha District')).toBeInTheDocument()
    expect(screen.getByText('Beta Schools')).toBeInTheDocument()

    mockUseQuery.mockReturnValue(ready(splitTenants))
    rerender(<TenantsListComponent />)

    expect(screen.getByRole('combobox', { name: 'Domain' })).toHaveTextContent('All domains')
    expect(screen.getByText('Alpha District')).toBeInTheDocument()
    expect(screen.getByText('Beta Schools')).toBeInTheDocument()
  })
})
