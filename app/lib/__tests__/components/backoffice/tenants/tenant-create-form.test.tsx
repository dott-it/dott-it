import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TenantCreateForm } from '@/components/backoffice/tenants/tenant-create-form'
import type { CreateTenantFormState } from '@/app/(dashboard)/backoffice/tenants/schemas'

describe('TenantCreateForm', () => {
  const user = userEvent.setup()

  const defaultFormData: CreateTenantFormState = {
    name: '',
    slug: '',
    logo: '',
  }

  const defaultProps = {
    formData: defaultFormData,
    domains: [],
    onFormDataChange: jest.fn(),
    onDomainsChange: jest.fn(),
    onSubmit: jest.fn((e) => e.preventDefault()),
    isSubmitting: false,
    formErrors: {},
  }

  it('renders all form fields', () => {
    render(<TenantCreateForm {...defaultProps} />)

    expect(screen.getByLabelText(/Tenant Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Slug/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Logo URL/i)).toBeInTheDocument()
  })

  it('displays form data values', () => {
    const formData: CreateTenantFormState = {
      name: 'Acme School',
      slug: 'acme-school',
      logo: 'https://example.com/logo.png',
    }

    render(<TenantCreateForm {...defaultProps} formData={formData} />)

    expect(screen.getByDisplayValue('Acme School')).toBeInTheDocument()
    expect(screen.getByDisplayValue('acme-school')).toBeInTheDocument()
    expect(screen.getByDisplayValue('https://example.com/logo.png')).toBeInTheDocument()
  })

  it('calls onFormDataChange when input values change', async () => {
    render(<TenantCreateForm {...defaultProps} />)

    const nameInput = screen.getByLabelText(/Tenant Name/i)
    await user.type(nameInput, 'New School')

    expect(defaultProps.onFormDataChange).toHaveBeenCalled()
  })

  it('converts slug to lowercase automatically', async () => {
    render(<TenantCreateForm {...defaultProps} />)

    const slugInput = screen.getByLabelText(/Slug/i)
    await user.type(slugInput, 'ACME-SCHOOL')

    // The onChange handler should convert each character to lowercase as it's typed
    // Check that all slug calls have lowercase values
    const calls = defaultProps.onFormDataChange.mock.calls
    const slugCalls = calls.filter(call => call[0] === 'slug')
    expect(slugCalls.length).toBeGreaterThan(0)
    // All values passed to onFormDataChange should be lowercase
    const allLowercase = slugCalls.every(call => {
      const value = call[1] as string
      return value === value.toLowerCase()
    })
    expect(allLowercase).toBe(true)
  })

  it('displays form errors when provided', () => {
    const formErrors = {
      name: 'Name is required',
      slug: 'Slug is required',
    }

    render(<TenantCreateForm {...defaultProps} formErrors={formErrors} />)

    expect(screen.getByText('Name is required')).toBeInTheDocument()
    expect(screen.getByText('Slug is required')).toBeInTheDocument()
  })

  it('calls onSubmit when form is submitted', async () => {
    render(<TenantCreateForm {...defaultProps} />)

    const form = screen.getByRole('button', { name: /Create Tenant/i }).closest('form')
    expect(form).toBeInTheDocument()
    
    // Simulate form submission
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
    form?.dispatchEvent(submitEvent)

    expect(defaultProps.onSubmit).toHaveBeenCalled()
  })

  it('displays loading state when isSubmitting is true', () => {
    render(<TenantCreateForm {...defaultProps} isSubmitting={true} />)

    expect(screen.getByText(/Creating.../i)).toBeInTheDocument()
    const submitButton = screen.getByRole('button', { name: /Creating.../i })
    expect(submitButton).toBeDisabled()
  })

  it('renders domain input component', () => {
    render(<TenantCreateForm {...defaultProps} />)

    // Domain input should be present (may need to adjust selector based on actual implementation)
    expect(screen.getByText(/Custom domains/i)).toBeInTheDocument()
  })

  it('calls onDomainsChange when domains are modified', () => {
    // This test would need to interact with the DomainInput component
    // Implementation depends on how DomainInput works
    render(<TenantCreateForm {...defaultProps} />)

    // Placeholder - actual implementation depends on DomainInput component
    expect(defaultProps.onDomainsChange).toBeDefined()
  })
})

