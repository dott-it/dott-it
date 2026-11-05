import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { PageNavigation } from '../navigation/page-navigation'

// Mock the dependencies
jest.mock('@/app/lib/components/ui/buttons/button-compounds', () => ({
  Button: ({
    children,
    onClick,
    variant,
    size,
    ...props
  }: {
    children: React.ReactNode
    onClick?: () => void
    variant?: string
    size?: string
    [key: string]: unknown
  }) => (
    <button onClick={onClick} data-variant={variant} data-size={size} {...props}>
      {children}
    </button>
  ),
}))

jest.mock('@/app/lib/components/ui/layout', () => ({
  Breadcrumbs: ({ items }: { items: Array<{ label: string; href?: string }> }) => (
    <nav data-testid="breadcrumbs">
      {items.map((item: { label: string; href?: string }, index: number) => (
        <span key={index} data-testid={`breadcrumb-${index}`}>
          {item.label}
        </span>
      ))}
    </nav>
  ),
}))

describe('PageNavigation', () => {
  const mockBreadcrumbItems = [
    { label: 'Workspace', href: '/workspace' },
    { label: 'Assessment', href: '/workspace/assessments' },
    { label: 'Student', isLast: true },
  ]

  const mockOnBack = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders breadcrumbs correctly', () => {
    render(<PageNavigation breadcrumbItems={mockBreadcrumbItems} />)

    expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument()
    expect(screen.getByTestId('breadcrumb-0')).toHaveTextContent('Workspace')
    expect(screen.getByTestId('breadcrumb-1')).toHaveTextContent('Assessment')
    expect(screen.getByTestId('breadcrumb-2')).toHaveTextContent('Student')
  })

  it('renders back button when showBackButton is true', () => {
    render(
      <PageNavigation
        breadcrumbItems={mockBreadcrumbItems}
        showBackButton={true}
        onBack={mockOnBack}
      />,
    )

    expect(screen.getByText('Back')).toBeInTheDocument()
  })

  it('does not render back button when showBackButton is false', () => {
    render(<PageNavigation breadcrumbItems={mockBreadcrumbItems} showBackButton={false} />)

    expect(screen.queryByText('Back')).not.toBeInTheDocument()
  })

  it('calls onBack when back button is clicked', () => {
    render(
      <PageNavigation
        breadcrumbItems={mockBreadcrumbItems}
        showBackButton={true}
        onBack={mockOnBack}
      />,
    )

    const backButton = screen.getByText('Back')
    fireEvent.click(backButton)

    expect(mockOnBack).toHaveBeenCalledTimes(1)
  })

  it('uses custom back button text', () => {
    render(
      <PageNavigation
        breadcrumbItems={mockBreadcrumbItems}
        showBackButton={true}
        onBack={mockOnBack}
        backButtonText="Go Back"
      />,
    )

    expect(screen.getByText('Go Back')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<PageNavigation breadcrumbItems={mockBreadcrumbItems} className="custom-class" />)

    const navigation = screen.getByTestId('breadcrumbs').parentElement
    expect(navigation).toHaveClass('custom-class')
  })

  it('renders with default props correctly', () => {
    render(<PageNavigation breadcrumbItems={mockBreadcrumbItems} />)

    expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument()
    expect(screen.queryByText('Back')).not.toBeInTheDocument()
  })
})
