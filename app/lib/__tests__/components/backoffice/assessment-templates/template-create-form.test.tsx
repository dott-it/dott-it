import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AssessmentTemplateCreateForm } from '@/components/backoffice/assessment-templates/assessment-template-create-form'
import {
  emptyCreateTemplateFormState,
  type CreateTemplateFormState,
} from '@/app/(dashboard)/backoffice/assessment-templates/schemas'
import { TEMPLATE_TYPE_OPTIONS } from '@/components/backoffice/assessment-templates/assessment-template-options'

describe('AssessmentTemplateCreateForm', () => {
  const user = userEvent.setup()

  const defaultFormData = emptyCreateTemplateFormState

  const defaultProps = {
    formData: defaultFormData,
    formErrors: {},
    onChange: jest.fn(),
    onSubmit: jest.fn((e) => e.preventDefault()),
    isSubmitting: false,
    lessonOptions: [
      { value: '6', label: 'Lesson 6 — Soccer assessment' },
      { value: '10', label: 'Lesson 10 — Baseball' },
    ],
  }

  it('renders all form fields including lesson', () => {
    render(<AssessmentTemplateCreateForm {...defaultProps} />)

    expect(screen.getByLabelText(/Template Title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Subject/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Unit/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Lesson/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Curriculum Teacher's Edition/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Curriculum Answer Key/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/Grade Level/i)).not.toBeInTheDocument()
  })

  it('includes Entrance/Exit Ticket among type options', () => {
    expect(TEMPLATE_TYPE_OPTIONS).toContain('Entrance/Exit Ticket')
  })

  it('displays form data values', () => {
    const formData: CreateTemplateFormState = {
      title: 'Test Template',
      type: 'Formative',
      subject: 'Biology',
      description: 'Test description',
      curriculumTeachersEdition: 'Teacher edition notes',
      curriculumAnswerKey: 'Answer key notes',
      gradeLevel: 'Grade 8',
      unitCode: '8.1',
      lessonNumber: '6',
    }

    render(<AssessmentTemplateCreateForm {...defaultProps} formData={formData} />)

    expect(screen.getByDisplayValue('Test Template')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /Type/i })).toHaveTextContent('Formative')
    expect(screen.getByRole('combobox', { name: /Subject/i })).toHaveTextContent('Biology')
    expect(screen.getByDisplayValue('Test description')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Teacher edition notes')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Answer key notes')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /Unit/i })).toHaveTextContent('8.1')
    expect(screen.getByRole('combobox', { name: /Lesson/i })).toHaveTextContent('Lesson 6')
  })

  it('should warn when the answer key failed to load', () => {
    render(
      <AssessmentTemplateCreateForm
        {...defaultProps}
        answerKeyWarning="Could not load the answer key for this lesson. Paste it manually, or try again."
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Answer key unavailable')
    expect(screen.getByRole('alert')).toHaveTextContent(/Paste it manually/)
  })

  it('should explain when the selected unit does not return lessons', () => {
    render(
      <AssessmentTemplateCreateForm
        {...defaultProps}
        formData={{ ...defaultFormData, unitCode: '8.1' }}
        lessonOptions={[]}
        lessonsError="Could not load lessons for this unit. Try again, or pick another unit."
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Could not load lessons')
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not load lessons for this unit. Try again, or pick another unit.',
    )
    expect(screen.getByRole('combobox', { name: /Lesson/i })).toHaveTextContent('Lessons unavailable')
    expect(screen.getByRole('combobox', { name: /Lesson/i })).toBeDisabled()
  })

  it('disables lesson until a unit is selected', () => {
    render(<AssessmentTemplateCreateForm {...defaultProps} />)

    expect(screen.getByRole('combobox', { name: /Lesson/i })).toBeDisabled()
  })

  it('calls onChange when input values change', async () => {
    render(
      <AssessmentTemplateCreateForm
        {...defaultProps}
        formData={{ ...defaultFormData, unitCode: '8.1' }}
      />,
    )

    const titleInput = screen.getByLabelText(/Template Title/i)
    await user.type(titleInput, 'New Template')

    expect(defaultProps.onChange).toHaveBeenCalled()
  })

  it('displays form errors when provided', () => {
    const formErrors = {
      title: 'Title is required',
      type: 'Type is required',
      lessonNumber: 'Lesson is required',
    }

    render(<AssessmentTemplateCreateForm {...defaultProps} formErrors={formErrors} />)

    expect(screen.getByText('Title is required')).toBeInTheDocument()
    expect(screen.getByText('Type is required')).toBeInTheDocument()
    expect(screen.getByText('Lesson is required')).toBeInTheDocument()
  })

  it('calls onSubmit when form is submitted', async () => {
    render(<AssessmentTemplateCreateForm {...defaultProps} />)

    const submitButton = screen.getByRole('button', { name: /Create Template/i })
    await user.click(submitButton)

    expect(defaultProps.onSubmit).toHaveBeenCalled()
  })

  it('displays loading state when isSubmitting is true', () => {
    render(<AssessmentTemplateCreateForm {...defaultProps} isSubmitting={true} />)

    expect(screen.getByText(/Creating.../i)).toBeInTheDocument()
    const submitButton = screen.getByRole('button', { name: /Creating.../i })
    expect(submitButton).toBeDisabled()
  })

  it('renders form card with curriculum-oriented description', () => {
    render(<AssessmentTemplateCreateForm {...defaultProps} />)

    expect(screen.getByText('Template Information')).toBeInTheDocument()
    expect(
      screen.getByText(/Choose an OpenSciEd unit and lesson/i),
    ).toBeInTheDocument()
  })

  it('shows draft loading status', () => {
    render(
      <AssessmentTemplateCreateForm
        {...defaultProps}
        formData={{ ...defaultFormData, unitCode: '8.1', lessonNumber: '6' }}
        draftLoading
      />,
    )

    expect(screen.getByRole('status')).toHaveTextContent(/Loading curriculum for this lesson/i)
    expect(screen.getByRole('status')).toHaveTextContent(/change unit or lesson/i)
    expect(screen.getByRole('button', { name: /Loading curriculum/i })).toBeDisabled()
  })

  it('keeps unit and lesson editable while draft is loading', () => {
    render(
      <AssessmentTemplateCreateForm
        {...defaultProps}
        formData={{ ...defaultFormData, unitCode: '8.1', lessonNumber: '6' }}
        draftLoading
      />,
    )

    expect(screen.getByLabelText(/Unit/i)).not.toBeDisabled()
    expect(screen.getByLabelText(/^Lesson/i)).not.toBeDisabled()
    expect(screen.getByLabelText(/Template Title/i)).toBeDisabled()
  })
})
