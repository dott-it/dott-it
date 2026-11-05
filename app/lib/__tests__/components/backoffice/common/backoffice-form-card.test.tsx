import { render, screen } from '@testing-library/react'
import { BackofficeFormCard } from '@/components/backoffice/common/backoffice-form-card'

describe('BackofficeFormCard', () => {
  it('renders title correctly', () => {
    render(
      <BackofficeFormCard title="Test Form">
        <div>Form content</div>
      </BackofficeFormCard>,
    )

    expect(screen.getByText('Test Form')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(
      <BackofficeFormCard title="Test Form" description="Test description">
        <div>Form content</div>
      </BackofficeFormCard>,
    )

    expect(screen.getByText('Test description')).toBeInTheDocument()
  })

  it('does not render description when not provided', () => {
    render(
      <BackofficeFormCard title="Test Form">
        <div>Form content</div>
      </BackofficeFormCard>,
    )

    expect(screen.queryByText('Test description')).not.toBeInTheDocument()
  })

  it('renders children content', () => {
    render(
      <BackofficeFormCard title="Test Form">
        <div data-testid="form-content">Form content</div>
      </BackofficeFormCard>,
    )

    expect(screen.getByTestId('form-content')).toBeInTheDocument()
    expect(screen.getByText('Form content')).toBeInTheDocument()
  })

  it('applies correct spacing to children', () => {
    const { container } = render(
      <BackofficeFormCard title="Test Form">
        <div>Content 1</div>
        <div>Content 2</div>
      </BackofficeFormCard>,
    )

    const cardContent = container.querySelector('.space-y-6')
    expect(cardContent).toBeInTheDocument()
  })
})

