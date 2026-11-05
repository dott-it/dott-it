import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormField } from '@/app/lib/components/ui/forms/form-field'

describe('FormField Component', () => {
  const user = userEvent.setup()

  it('renders with label and input', () => {
    render(<FormField label="Email" placeholder="Enter email" />)

    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument()
  })

  it('renders with required indicator', () => {
    render(<FormField label="Email" required />)

    const label = screen.getByText('Email')
    expect(label).toBeInTheDocument()
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('renders with description', () => {
    render(<FormField label="Email" description="Enter your email address" />)

    expect(screen.getByText('Enter your email address')).toBeInTheDocument()
  })

  it('renders with error message', () => {
    render(<FormField label="Email" error="Email is required" />)

    expect(screen.getByText('Email is required')).toBeInTheDocument()
    expect(screen.getByText('Email is required')).toHaveClass('text-red-600', 'dark:text-red-400')
  })

  it('applies error styles to input when error is present', () => {
    render(<FormField label="Email" error="Email is required" />)

    const input = screen.getByLabelText('Email')
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  it('forwards input props correctly', () => {
    render(<FormField label="Email" type="email" placeholder="Enter email" disabled />)

    const input = screen.getByLabelText('Email')
    expect(input).toHaveAttribute('type', 'email')
    expect(input).toHaveAttribute('placeholder', 'Enter email')
    expect(input).toBeDisabled()
  })

  it('handles user input', async () => {
    render(<FormField label="Email" />)

    const input = screen.getByLabelText('Email')
    await user.type(input, 'test@example.com')

    expect(input).toHaveValue('test@example.com')
  })

  it('applies custom container className', () => {
    render(<FormField label="Email" containerClassName="custom-container" />)

    const container = screen.getByLabelText('Email').closest('div')
    expect(container).toHaveClass('custom-container')
  })

  it('applies custom input className', () => {
    render(<FormField label="Email" className="custom-input" />)

    const input = screen.getByLabelText('Email')
    expect(input).toHaveClass('custom-input')
  })

  it('generates unique id when not provided', () => {
    render(<FormField label="Email" />)
    render(<FormField label="Password" />)

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')

    expect(emailInput.id).not.toBe(passwordInput.id)
  })

  it('uses provided id when available', () => {
    render(<FormField label="Email" id="email-field" />)

    const input = screen.getByLabelText('Email')
    expect(input).toHaveAttribute('id', 'email-field')
  })

  it('sets aria-describedby for description', () => {
    render(<FormField label="Email" description="Enter your email" />)

    const input = screen.getByLabelText('Email')
    const descriptionId = input.getAttribute('aria-describedby')
    expect(descriptionId).toContain('-description')
  })

  it('sets aria-describedby for error', () => {
    render(<FormField label="Email" error="Email is required" />)

    const input = screen.getByLabelText('Email')
    const errorId = input.getAttribute('aria-describedby')
    expect(errorId).toContain('-error')
  })

  it('prioritizes error over description for aria-describedby', () => {
    render(<FormField label="Email" description="Enter your email" error="Email is required" />)

    const input = screen.getByLabelText('Email')
    const describedBy = input.getAttribute('aria-describedby')
    expect(describedBy).toContain('-error')
    expect(describedBy).not.toContain('-description')
  })
})
