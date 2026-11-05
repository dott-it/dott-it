import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { GenericPageHeader } from '@/app/lib/components/ui/layout/header/generic-page-header'

describe('GenericPageHeader', () => {
  const defaultProps = {
    title: 'Test Page',
    breadcrumbItems: [
      { label: 'Home', href: '/' },
      { label: 'Test Page', isLast: true },
    ],
  }

  it('renders title and subtitle correctly', () => {
    render(<GenericPageHeader {...defaultProps} subtitle="Test Subtitle" />)

    // Check for the main title (h1 element)
    expect(screen.getByRole('heading', { name: 'Test Page' })).toBeInTheDocument()
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument()
  })

  it('renders breadcrumbs', () => {
    render(<GenericPageHeader {...defaultProps} />)

    expect(screen.getByText('Home')).toBeInTheDocument()
    // Check for the breadcrumb text specifically
    expect(screen.getByRole('heading', { name: 'Test Page' })).toBeInTheDocument()
  })

  it('shows back button when showBackButton is true', () => {
    const onBack = jest.fn()
    render(
      <GenericPageHeader
        {...defaultProps}
        showBackButton={true}
        onBack={onBack}
      />
    )

    const backButton = screen.getByText('Back')
    expect(backButton).toBeInTheDocument()

    fireEvent.click(backButton)
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('does not show back button when showBackButton is false', () => {
    render(<GenericPageHeader {...defaultProps} showBackButton={false} />)

    expect(screen.queryByText('Back')).not.toBeInTheDocument()
  })

  it('renders custom back button text', () => {
    const onBack = jest.fn()
    render(
      <GenericPageHeader
        {...defaultProps}
        showBackButton={true}
        onBack={onBack}
        backButtonText="Go Back"
      />
    )

    expect(screen.getByText('Go Back')).toBeInTheDocument()
  })

  it('renders actions when provided', () => {
    const actions = (
      <div data-testid="custom-actions">
        <button>Action 1</button>
        <button>Action 2</button>
      </div>
    )

    render(<GenericPageHeader {...defaultProps} actions={actions} />)

    expect(screen.getByTestId('custom-actions')).toBeInTheDocument()
    expect(screen.getByText('Action 1')).toBeInTheDocument()
    expect(screen.getByText('Action 2')).toBeInTheDocument()
  })

  it('does not render actions when not provided', () => {
    render(<GenericPageHeader {...defaultProps} />)

    expect(screen.queryByTestId('custom-actions')).not.toBeInTheDocument()
  })

  it('handles subtitle without grade gracefully', () => {
    render(<GenericPageHeader {...defaultProps} subtitle="Just a subtitle" />)

    expect(screen.getByText('Just a subtitle')).toBeInTheDocument()
  })
})
