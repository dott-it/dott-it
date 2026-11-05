import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BackofficePageHeader } from '@/components/backoffice/common/backoffice-page-header'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}))

describe('BackofficePageHeader', () => {
  const user = userEvent.setup()

  it('renders title correctly', () => {
    render(<BackofficePageHeader title="Test Page" />)

    expect(screen.getByText('Test Page')).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    render(
      <BackofficePageHeader title="Test Page" subtitle="Test subtitle" />,
    )

    expect(screen.getByText('Test subtitle')).toBeInTheDocument()
  })

  it('renders default breadcrumbs', () => {
    render(<BackofficePageHeader title="Test Page" />)

    expect(screen.getByText('Workspace')).toBeInTheDocument()
    expect(screen.getByText('Backoffice')).toBeInTheDocument()
  })

  it('renders custom breadcrumb items', () => {
    render(
      <BackofficePageHeader
        title="Test Page"
        breadcrumbItems={[
          { label: 'Custom', href: '/custom' },
          { label: 'Page', isLast: true },
        ]}
      />,
    )

    expect(screen.getByText('Custom')).toBeInTheDocument()
    expect(screen.getByText('Page')).toBeInTheDocument()
  })

  it('shows back button by default', () => {
    render(<BackofficePageHeader title="Test Page" />)

    expect(screen.getByText('Back to Backoffice')).toBeInTheDocument()
  })

  it('hides back button when showBackButton is false', () => {
    render(
      <BackofficePageHeader title="Test Page" showBackButton={false} />,
    )

    expect(screen.queryByText('Back to Backoffice')).not.toBeInTheDocument()
  })

  it('renders custom back button text', () => {
    render(
      <BackofficePageHeader
        title="Test Page"
        backButtonText="Go Back"
      />,
    )

    expect(screen.getByText('Go Back')).toBeInTheDocument()
  })

  it('calls onBack handler when provided', async () => {
    const handleBack = jest.fn()
    render(
      <BackofficePageHeader title="Test Page" onBack={handleBack} />,
    )

    const backButton = screen.getByText('Back to Backoffice')
    await user.click(backButton)

    expect(handleBack).toHaveBeenCalledTimes(1)
  })
})

