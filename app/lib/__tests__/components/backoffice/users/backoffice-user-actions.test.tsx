import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BackofficeUserActions } from '@/components/backoffice/users/backoffice-user-actions'

describe('BackofficeUserActions', () => {
  const user = userEvent.setup()

  const defaultProps = {
    isEditing: false,
    userActive: true,
    onEdit: jest.fn(),
    onToggleActive: jest.fn(),
    isTogglingActive: false,
    userName: 'John Doe',
    userEmail: 'john@example.com',
  }

  it('renders edit button and deactivate button when user is active', () => {
    render(<BackofficeUserActions {...defaultProps} />)

    expect(screen.getByRole('button', { name: /Edit User/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Deactivate/i })).toBeInTheDocument()
  })

  it('renders edit button and reactivate button when user is inactive', () => {
    render(<BackofficeUserActions {...defaultProps} userActive={false} />)

    expect(screen.getByRole('button', { name: /Edit User/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Reactivate/i })).toBeInTheDocument()
  })

  it('does not render buttons when isEditing is true', () => {
    render(<BackofficeUserActions {...defaultProps} isEditing={true} />)

    expect(screen.queryByRole('button', { name: /Edit User/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Deactivate/i })).not.toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', async () => {
    render(<BackofficeUserActions {...defaultProps} />)

    const editButton = screen.getByRole('button', { name: /Edit User/i })
    await user.click(editButton)

    expect(defaultProps.onEdit).toHaveBeenCalledTimes(1)
  })

  it('opens deactivate dialog when deactivate button is clicked', async () => {
    render(<BackofficeUserActions {...defaultProps} />)

    const deactivateButton = screen.getByRole('button', { name: /Deactivate/i })
    await user.click(deactivateButton)

    // Dialog should be visible
    expect(screen.getByText(/Deactivate user\?/i)).toBeInTheDocument()
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument()
  })

  it('calls onToggleActive with false when deactivate is confirmed', async () => {
    render(<BackofficeUserActions {...defaultProps} />)

    const deactivateButton = screen.getByRole('button', { name: /Deactivate/i })
    await user.click(deactivateButton)

    const confirmButton = screen.getByRole('button', { name: /Confirm/i })
    await user.click(confirmButton)

    expect(defaultProps.onToggleActive).toHaveBeenCalledWith(false)
  })

  it('calls onToggleActive with true when reactivate button is clicked', async () => {
    render(<BackofficeUserActions {...defaultProps} userActive={false} />)

    const reactivateButton = screen.getByRole('button', { name: /Reactivate/i })
    await user.click(reactivateButton)

    expect(defaultProps.onToggleActive).toHaveBeenCalledWith(true)
  })

  it('disables deactivate button when isTogglingActive is true', () => {
    render(<BackofficeUserActions {...defaultProps} isTogglingActive={true} />)

    const deactivateButton = screen.getByRole('button', { name: /Deactivate/i })
    expect(deactivateButton).toBeDisabled()
  })

  it('disables reactivate button when isTogglingActive is true', () => {
    render(
      <BackofficeUserActions
        {...defaultProps}
        userActive={false}
        isTogglingActive={true}
      />,
    )

    const reactivateButton = screen.getByRole('button', { name: /Reactivate/i })
    expect(reactivateButton).toBeDisabled()
  })

  it('displays user email in dialog when name is not available', async () => {
    render(
      <BackofficeUserActions {...defaultProps} userName={null} />,
    )

    const deactivateButton = screen.getByRole('button', { name: /Deactivate/i })
    await user.click(deactivateButton)

    expect(screen.getByText(/john@example\.com/i)).toBeInTheDocument()
  })

  it('shows loading text in dialog when toggling active', async () => {
    const { rerender } = render(
      <BackofficeUserActions {...defaultProps} isTogglingActive={false} />,
    )

    // Open the dialog first (when not toggling)
    const deactivateButton = screen.getByRole('button', { name: /Deactivate/i })
    await user.click(deactivateButton)

    // Wait for dialog to be visible
    expect(screen.getByText(/Deactivate user\?/i)).toBeInTheDocument()

    // Now simulate the loading state by rerendering with isTogglingActive=true
    rerender(
      <BackofficeUserActions {...defaultProps} isTogglingActive={true} />,
    )

    // The "Deactivating..." text should be in the confirm button when isTogglingActive is true
    const confirmButton = screen.getByRole('button', { name: /Deactivating.../i })
    expect(confirmButton).toBeInTheDocument()
    expect(confirmButton).toBeDisabled()
  })
})

