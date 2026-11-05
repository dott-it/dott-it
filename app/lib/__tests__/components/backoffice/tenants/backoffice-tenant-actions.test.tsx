import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BackofficeTenantActions } from '@/components/backoffice/tenants/backoffice-tenant-actions'

describe('BackofficeTenantActions', () => {
  const user = userEvent.setup()

  const defaultProps = {
    isEditing: false,
    isAddingUser: false,
    isAddingTeacher: false,
    onEdit: jest.fn(),
    onAddUser: jest.fn(),
  }

  it('renders edit and add user buttons when not editing', () => {
    render(<BackofficeTenantActions {...defaultProps} />)

    expect(screen.getByRole('button', { name: /Edit Tenant/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Add User/i })).toBeInTheDocument()
  })

  it('does not render buttons when isEditing is true', () => {
    render(<BackofficeTenantActions {...defaultProps} isEditing={true} />)

    expect(screen.queryByRole('button', { name: /Edit Tenant/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Add User/i })).not.toBeInTheDocument()
  })

  it('does not render buttons when isAddingUser is true', () => {
    render(<BackofficeTenantActions {...defaultProps} isAddingUser={true} />)

    expect(screen.queryByRole('button', { name: /Edit Tenant/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Add User/i })).not.toBeInTheDocument()
  })

  it('does not render buttons when isAddingTeacher is true', () => {
    render(<BackofficeTenantActions {...defaultProps} isAddingTeacher={true} />)

    expect(screen.queryByRole('button', { name: /Edit Tenant/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Add User/i })).not.toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', async () => {
    render(<BackofficeTenantActions {...defaultProps} />)

    const editButton = screen.getByRole('button', { name: /Edit Tenant/i })
    await user.click(editButton)

    expect(defaultProps.onEdit).toHaveBeenCalledTimes(1)
  })

  it('calls onAddUser when add user button is clicked', async () => {
    render(<BackofficeTenantActions {...defaultProps} />)

    const addUserButton = screen.getByRole('button', { name: /Add User/i })
    await user.click(addUserButton)

    expect(defaultProps.onAddUser).toHaveBeenCalledTimes(1)
  })
})

