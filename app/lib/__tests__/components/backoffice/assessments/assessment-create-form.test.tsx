import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AssessmentCreateForm } from '@/components/backoffice/assessments/assessment-create-form'
import type { CreateAssessmentFormState } from '@/app/(dashboard)/backoffice/assessments/schemas'

// Mock data
const mockTemplates = [
  { id: 'template-1', title: 'Science Template', subject: 'Science', gradeLevel: 'Grade 8' },
]
const mockTeachers = [
  {
    id: 'teacher-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    learnerCount: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
]
const mockTenants = [{ id: 'tenant-1', name: 'Acme School' }]

describe('AssessmentCreateForm', () => {
  const user = userEvent.setup()

  const defaultFormData: CreateAssessmentFormState = {
    templateId: '',
    tenantId: '',
    assignedBy: '',
    assignedTo: '',
    schoolYear: '2025-2026',
    unitCode: '',
    status: 'draft',
    numberOfQuestions: '',
    dueDate: '',
    instructions: '',
    submissionUrl: '',
    googleFormId: '',
  }

  const defaultProps = {
    formData: defaultFormData,
    formErrors: {},
    onChange: jest.fn(),
    onSubmit: jest.fn((e) => e.preventDefault()),
    isSubmitting: false,
    templates: mockTemplates,
    teachers: mockTeachers,
    tenants: mockTenants,
    schoolYearOptions: ['2025-2026', '2024-2025'],
    unitOptions: [
      { value: '8.1', label: '8.1 · Grade 8', gradeLevel: 'Grade 8' },
      { value: '6.1', label: '6.1 · Grade 6', gradeLevel: 'Grade 6' },
    ],
    templatesLoading: false,
    teachersLoading: false,
    tenantsLoading: false,
  }

  it('renders form with required fields', () => {
    render(<AssessmentCreateForm {...defaultProps} />)

    expect(screen.getByText(/Assessment Information/i)).toBeInTheDocument()
  })

  it('displays templates in select dropdown', () => {
    render(<AssessmentCreateForm {...defaultProps} />)

    // The template select should be present
    expect(screen.getByText(/Assessment Template/i)).toBeInTheDocument()
  })

  it('shows loading state for templates', () => {
    render(
      <AssessmentCreateForm {...defaultProps} templatesLoading={true} />,
    )

    expect(screen.getByText(/Loading templates.../i)).toBeInTheDocument()
  })

  it('displays form errors when provided', () => {
    const formErrors = {
      templateId: 'Template is required',
      tenantId: 'Tenant is required',
    }

    render(<AssessmentCreateForm {...defaultProps} formErrors={formErrors} />)

    expect(screen.getByText('Template is required')).toBeInTheDocument()
    expect(screen.getByText('Tenant is required')).toBeInTheDocument()
  })

  it('calls onSubmit when form is submitted', async () => {
    render(<AssessmentCreateForm {...defaultProps} />)

    const submitButton = screen.getByRole('button', { name: /Create Assessment/i })
    await user.click(submitButton)

    expect(defaultProps.onSubmit).toHaveBeenCalled()
  })

  it('displays Reviewer\'s Instructions label', () => {
    render(<AssessmentCreateForm {...defaultProps} />)

    expect(screen.getByText(/Reviewer's Instructions/i)).toBeInTheDocument()
  })

  it('disables assigned by until a tenant is selected', () => {
    render(<AssessmentCreateForm {...defaultProps} />)

    expect(screen.getByText(/Select a tenant first/i)).toBeInTheDocument()
  })

  it('should filter unit options by the selected template grade level', () => {
    render(
      <AssessmentCreateForm
        {...defaultProps}
        formData={{ ...defaultFormData, templateId: 'template-1' }}
      />,
    )

    const unitTrigger = screen.getByRole('combobox', { name: /^Unit/i })
    expect(unitTrigger).not.toBeDisabled()
    expect(screen.queryByText(/Select a template first/i)).not.toBeInTheDocument()
  })

  it('should disable the unit dropdown until a template is selected', () => {
    render(<AssessmentCreateForm {...defaultProps} />)

    expect(screen.getByRole('combobox', { name: /^Unit/i })).toBeDisabled()
    expect(screen.getByText(/Select a template first/i)).toBeInTheDocument()
  })

  it('displays loading state when isSubmitting is true', () => {
    render(<AssessmentCreateForm {...defaultProps} isSubmitting={true} />)

    const submitButton = screen.getByRole('button', { name: /Creating.../i })
    expect(submitButton).toBeDisabled()
  })
})

