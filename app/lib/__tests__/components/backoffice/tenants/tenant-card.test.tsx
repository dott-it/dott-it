import { render, screen } from '@testing-library/react'
import { TenantCard } from '@/components/backoffice/tenants/tenant-card'
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

describe('TenantCard', () => {
  it('renders tenant name correctly', () => {
    render(<TenantCard tenant={mockTenant} />)

    expect(screen.getByText('Acme School District')).toBeInTheDocument()
  })

  it('renders tenant slug correctly', () => {
    render(<TenantCard tenant={mockTenant} />)

    expect(screen.getByText(/Slug: acme-school/)).toBeInTheDocument()
  })

  it('renders user count correctly', () => {
    render(<TenantCard tenant={mockTenant} />)

    expect(screen.getByText('25 users')).toBeInTheDocument()
  })

  it('should use singular labels when a tenant has one user and one admin', () => {
    render(<TenantCard tenant={{ ...mockTenant, userCount: 1, adminCount: 1 }} />)

    expect(screen.getByText('1 user')).toBeInTheDocument()
    expect(screen.getByText('1 admin')).toBeInTheDocument()
  })

  it('renders admin count correctly', () => {
    render(<TenantCard tenant={mockTenant} />)

    expect(screen.getByText('3 admins')).toBeInTheDocument()
  })

  it('renders domains correctly', () => {
    render(<TenantCard tenant={mockTenant} />)

    expect(
      screen.getByText(/Domains: acme\.edu, acme-school\.org/),
    ).toBeInTheDocument()
  })

  it('renders status correctly', () => {
    render(<TenantCard tenant={mockTenant} showStatus />)

    expect(screen.getByText(/Status: active/)).toBeInTheDocument()
  })

  it('should hide status when status cannot narrow the list', () => {
    render(<TenantCard tenant={mockTenant} />)

    expect(screen.queryByText(/Status:/)).not.toBeInTheDocument()
  })

  it('links the card to the tenant', () => {
    render(<TenantCard tenant={mockTenant} />)

    const cardLink = screen.getByRole('link', { name: /Acme School District/ })
    expect(cardLink).toHaveAttribute('href', '/backoffice/tenants/tenant-1')
  })

  it('handles tenant with no domains', () => {
    const tenantWithoutDomains: Tenant = {
      ...mockTenant,
      domains: [],
    }

    render(<TenantCard tenant={tenantWithoutDomains} />)

    expect(screen.queryByText(/Domains:/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Status:/)).not.toBeInTheDocument()
  })

  it('should hide domains that are only whitespace', () => {
    render(<TenantCard tenant={{ ...mockTenant, domains: ['   '] }} />)

    expect(screen.queryByText(/Domains:/)).not.toBeInTheDocument()
  })

  it('handles different status values', () => {
    const inactiveTenant: Tenant = {
      ...mockTenant,
      status: 'inactive',
    }

    render(<TenantCard tenant={inactiveTenant} showStatus />)

    expect(screen.getByText(/Status: inactive/)).toBeInTheDocument()
  })
})

