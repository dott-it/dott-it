import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BackofficeHeader } from '@/components/backoffice/common/backoffice-header'

describe('BackofficeHeader', () => {
  const user = userEvent.setup()

  it('renders all tabs correctly', () => {
    const handleTabChange = jest.fn()
    render(
      <BackofficeHeader activeTab="assessments" onTabChange={handleTabChange} />,
    )

    expect(screen.getByText('Assessments')).toBeInTheDocument()
    expect(screen.getByText('Templates')).toBeInTheDocument()
    expect(screen.getByText('Tenants')).toBeInTheDocument()
    expect(screen.getByText('Users')).toBeInTheDocument()
  })

  it('shows correct create button text for assessments tab', () => {
    render(
      <BackofficeHeader activeTab="assessments" onTabChange={jest.fn()} />,
    )

    expect(screen.getByText('Add Assessment')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /Add Assessment/i })
    expect(link).toHaveAttribute('href', '/backoffice/assessments/create')
  })

  it('shows correct create button text for templates tab', () => {
    render(
      <BackofficeHeader activeTab="templates" onTabChange={jest.fn()} />,
    )

    expect(screen.getByText('Add Template')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /Add Template/i })
    expect(link).toHaveAttribute(
      'href',
      '/backoffice/assessment-templates/create',
    )
  })

  it('shows correct create button text for tenants tab', () => {
    render(<BackofficeHeader activeTab="tenants" onTabChange={jest.fn()} />)

    expect(screen.getByText('Add Tenant')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /Add Tenant/i })
    expect(link).toHaveAttribute('href', '/backoffice/tenants/create')
  })

  it('shows correct create button text for users tab', () => {
    render(<BackofficeHeader activeTab="users" onTabChange={jest.fn()} />)

    expect(screen.getByText('Add User')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /Add User/i })
    expect(link).toHaveAttribute('href', '/backoffice/users/create')
  })

  it('calls onTabChange when tab is clicked', async () => {
    const handleTabChange = jest.fn()
    render(
      <BackofficeHeader activeTab="assessments" onTabChange={handleTabChange} />,
    )

    const templatesTab = screen.getByRole('tab', { name: 'Templates' })
    await user.click(templatesTab)

    expect(handleTabChange).toHaveBeenCalledWith('templates')
  })
})

