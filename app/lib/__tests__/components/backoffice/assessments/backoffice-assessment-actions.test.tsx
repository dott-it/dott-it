import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BackofficeAssessmentActions } from '@/components/backoffice/assessments/backoffice-assessment-actions'

describe('BackofficeAssessmentActions', () => {
  const user = userEvent.setup()

  const defaultProps = {
    assessmentId: 'assessment-123',
    hasGoogleForm: true,
    onDelete: jest.fn(),
    isDeleting: false,
    onSyncResponses: jest.fn(),
    isSyncing: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders all action buttons', () => {
    render(<BackofficeAssessmentActions {...defaultProps} />)

    expect(screen.getByRole('link', { name: /View in Workspace/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Edit Assessment/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sync responses/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Delete Assessment/i })).toBeInTheDocument()
  })

  it('renders correct links with assessment ID', () => {
    render(<BackofficeAssessmentActions {...defaultProps} />)

    const viewLink = screen.getByRole('link', { name: /View in Workspace/i })
    expect(viewLink).toHaveAttribute('href', '/workspace/assessments/assessment-123')

    const editLink = screen.getByRole('link', { name: /Edit Assessment/i })
    expect(editLink).toHaveAttribute('href', '/backoffice/assessments/assessment-123/edit')
  })

  it('calls onDelete when delete button is clicked', async () => {
    render(<BackofficeAssessmentActions {...defaultProps} />)

    const deleteButton = screen.getByRole('button', { name: /Delete Assessment/i })
    await user.click(deleteButton)

    expect(defaultProps.onDelete).toHaveBeenCalledTimes(1)
  })

  it('displays loading state when deleting', () => {
    render(<BackofficeAssessmentActions {...defaultProps} isDeleting={true} />)

    expect(screen.getByText('Deleting...')).toBeInTheDocument()
    const deleteButton = screen.getByRole('button', { name: /Deleting.../i })
    expect(deleteButton).toBeDisabled()
  })

  it('disables delete button when isDeleting is true', () => {
    render(<BackofficeAssessmentActions {...defaultProps} isDeleting={true} />)

    const deleteButton = screen.getByRole('button', { name: /Deleting.../i })
    expect(deleteButton).toBeDisabled()
  })

  it('disables Sync responses when assessment has no Google Form', () => {
    render(<BackofficeAssessmentActions {...defaultProps} hasGoogleForm={false} />)

    expect(screen.getByRole('button', { name: /Sync responses/i })).toBeDisabled()
  })

  it('should confirm before calling onSyncResponses', async () => {
    render(<BackofficeAssessmentActions {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /^Sync responses$/i }))

    expect(
      screen.getByRole('heading', { name: /Sync responses from Google Form/i }),
    ).toBeInTheDocument()
    expect(defaultProps.onSyncResponses).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: /^Confirm sync$/i }))

    expect(defaultProps.onSyncResponses).toHaveBeenCalledTimes(1)
  })

  it('shows syncing label while sync is pending', () => {
    render(<BackofficeAssessmentActions {...defaultProps} isSyncing={true} />)

    expect(screen.getByRole('button', { name: /Syncing.../i })).toBeDisabled()
  })
})
