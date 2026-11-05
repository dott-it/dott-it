import { render, screen } from '@testing-library/react'
import { TenantListRow } from '@/components/backoffice/tenants/tenant-list-row'
import type { Tenant } from '@/types'

const mockTenant: Tenant = {
  id: 'tenant-1',
  name: 'Acme School District',
  slug: 'acme-school',
  domains: ['acme.edu', 'acme-school.org'],
  userCount: 25,
  adminCount: 3,
  status: 'active',
  createdAt: '2024-01-01T00:00:00Z',
}

describe('TenantListRow', () => {
  it('should link the row to the tenant', () => {
    render(<TenantListRow tenant={mockTenant} />)

    const rowLink = screen.getByRole('link', { name: /Acme School District/ })
    expect(rowLink).toHaveAttribute('href', '/backoffice/tenants/tenant-1')
  })

  it('should show the slug, domains, and status', () => {
    render(<TenantListRow tenant={mockTenant} showStatus />)

    expect(screen.getByText(/acme-school · acme\.edu, acme-school\.org/)).toBeInTheDocument()
    expect(screen.getByText('active')).toBeInTheDocument()
    expect(screen.getByText('25 users')).toBeInTheDocument()
    expect(screen.getByText('3 admins')).toBeInTheDocument()
  })

  it('should use singular labels when a tenant has one user and one admin', () => {
    render(<TenantListRow tenant={{ ...mockTenant, userCount: 1, adminCount: 1 }} />)

    expect(screen.getByText('1 user')).toBeInTheDocument()
    expect(screen.getByText('1 admin')).toBeInTheDocument()
  })

  it('should hide status when status cannot narrow the list', () => {
    render(<TenantListRow tenant={mockTenant} />)

    expect(screen.queryByText('active')).not.toBeInTheDocument()
    expect(screen.getByText('25 users')).toBeInTheDocument()
  })

  it('should omit domains that are blank', () => {
    render(<TenantListRow tenant={{ ...mockTenant, domains: ['  '] }} />)

    expect(screen.getByText('acme-school')).toBeInTheDocument()
    expect(screen.queryByText(/acme\.edu/)).not.toBeInTheDocument()
  })
})
