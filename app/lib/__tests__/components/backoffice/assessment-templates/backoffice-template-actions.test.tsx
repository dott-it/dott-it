import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BackofficeTemplateActions } from '@/components/backoffice/assessment-templates/backoffice-template-actions'

describe('BackofficeTemplateActions', () => {
  const user = userEvent.setup()

  const defaultProps = {
    templateId: 'template-123',
    onDuplicate: jest.fn(),
    onDelete: jest.fn(),
    isDeleting: false,
    isDuplicating: false,
  }

  it('renders all action buttons', () => {
    render(<BackofficeTemplateActions {...defaultProps} />)

    expect(screen.getByRole('button', { name: /Duplicate Template/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Edit Template/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Delete Template/i })).toBeInTheDocument()
  })

  it('renders correct edit link with template ID', () => {
    render(<BackofficeTemplateActions {...defaultProps} />)

    const editLink = screen.getByRole('link', { name: /Edit Template/i })
    expect(editLink).toHaveAttribute('href', '/backoffice/assessment-templates/template-123/edit')
  })

  it('calls onDuplicate when duplicate button is clicked', async () => {
    render(<BackofficeTemplateActions {...defaultProps} />)

    const duplicateButton = screen.getByRole('button', { name: /Duplicate Template/i })
    await user.click(duplicateButton)

    expect(defaultProps.onDuplicate).toHaveBeenCalledTimes(1)
  })

  it('calls onDelete when delete button is clicked', async () => {
    render(<BackofficeTemplateActions {...defaultProps} />)

    const deleteButton = screen.getByRole('button', { name: /Delete Template/i })
    await user.click(deleteButton)

    expect(defaultProps.onDelete).toHaveBeenCalledTimes(1)
  })

  it('displays loading state when duplicating', () => {
    render(<BackofficeTemplateActions {...defaultProps} isDuplicating={true} />)

    expect(screen.getByText('Duplicating...')).toBeInTheDocument()
    const duplicateButton = screen.getByRole('button', { name: /Duplicating.../i })
    expect(duplicateButton).toBeDisabled()
  })

  it('displays loading state when deleting', () => {
    render(<BackofficeTemplateActions {...defaultProps} isDeleting={true} />)

    expect(screen.getByText('Deleting...')).toBeInTheDocument()
    const deleteButton = screen.getByRole('button', { name: /Deleting.../i })
    expect(deleteButton).toBeDisabled()
  })

  it('disables duplicate button when isDuplicating is true', () => {
    render(<BackofficeTemplateActions {...defaultProps} isDuplicating={true} />)

    const duplicateButton = screen.getByRole('button', { name: /Duplicating.../i })
    expect(duplicateButton).toBeDisabled()
  })

  it('disables delete button when isDeleting is true', () => {
    render(<BackofficeTemplateActions {...defaultProps} isDeleting={true} />)

    const deleteButton = screen.getByRole('button', { name: /Deleting.../i })
    expect(deleteButton).toBeDisabled()
  })
})

