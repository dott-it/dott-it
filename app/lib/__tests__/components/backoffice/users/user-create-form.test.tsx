import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserCreateForm } from '@/components/backoffice/users/user-create-form'
import type { CreateUserFormState } from '@/app/(dashboard)/backoffice/users/schemas'

describe('UserCreateForm', () => {
  const user = userEvent.setup()

  const defaultFormData: CreateUserFormState = {
    email: '',
    name: '',
    password: '',
    tenantId: '',
    role: '',
    active: true,
  }

  const defaultProps = {
    formData: defaultFormData,
    onFormDataChange: jest.fn(),
    onSubmit: jest.fn((e) => e.preventDefault()),
    isSubmitting: false,
    formErrors: {},
  }

  it('renders all form fields', () => {
    render(<UserCreateForm {...defaultProps} />)

    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument()
    expect(screen.getByText(/Account status/i)).toBeInTheDocument()
  })

  it('displays form data values', () => {
    const formData: CreateUserFormState = {
      email: 'user@example.com',
      name: 'John Doe',
      password: 'password123',
      tenantId: 'tenant-1',
      role: 'teacher',
      active: true,
    }

    render(<UserCreateForm {...defaultProps} formData={formData} />)

    expect(screen.getByDisplayValue('user@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('password123')).toBeInTheDocument()
  })

  it('calls onFormDataChange when input values change', async () => {
    render(<UserCreateForm {...defaultProps} />)

    const emailInput = screen.getByLabelText(/Email/i)
    await user.type(emailInput, 'new@example.com')

    expect(defaultProps.onFormDataChange).toHaveBeenCalled()
  })

  it('handles active toggle change', async () => {
    render(<UserCreateForm {...defaultProps} />)

    const activeToggle = screen.getByRole('switch', { name: /Account status/i })
    await user.click(activeToggle)

    expect(defaultProps.onFormDataChange).toHaveBeenCalledWith('active', false)
  })

  it('displays form errors when provided', () => {
    const formErrors = {
      email: 'Email is required',
      password: 'Password is too short',
    }

    render(<UserCreateForm {...defaultProps} formErrors={formErrors} />)

    expect(screen.getByText('Email is required')).toBeInTheDocument()
    expect(screen.getByText('Password is too short')).toBeInTheDocument()
  })

  it('calls onSubmit when form is submitted', async () => {
    render(<UserCreateForm {...defaultProps} />)

    const form = screen.getByRole('button', { name: /Create User/i }).closest('form')
    expect(form).toBeInTheDocument()
    
    // Simulate form submission
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
    form?.dispatchEvent(submitEvent)

    expect(defaultProps.onSubmit).toHaveBeenCalled()
  })

  it('displays loading state when isSubmitting is true', () => {
    render(<UserCreateForm {...defaultProps} isSubmitting={true} />)

    expect(screen.getByText(/Creating.../i)).toBeInTheDocument()
    const submitButton = screen.getByRole('button', { name: /Creating.../i })
    expect(submitButton).toBeDisabled()
  })

  it('renders tenant select component', () => {
    render(<UserCreateForm {...defaultProps} />)

    // Tenant select should be present (may appear multiple times, so use getAllByText)
    const tenantElements = screen.getAllByText(/Tenant/i)
    expect(tenantElements.length).toBeGreaterThan(0)
  })

  it('renders role select component', () => {
    render(<UserCreateForm {...defaultProps} />)

    // Role select should be present (may appear multiple times, so use getAllByText)
    const roleElements = screen.getAllByText(/Role/i)
    expect(roleElements.length).toBeGreaterThan(0)
  })

  it('shows active status as checked by default', () => {
    render(<UserCreateForm {...defaultProps} />)

    const activeToggle = screen.getByRole('switch', { name: /Account status/i })
    expect(activeToggle).toBeChecked()
  })
})

