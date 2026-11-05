import { render, screen } from '@testing-library/react'
import { AssessmentTemplateEditForm } from '@/components/backoffice/assessment-templates/assessment-template-edit-form'

const formData = {
  title: 'Soccer forces',
  type: 'Formative',
  description: '',
  curriculumTeachersEdition: '',
  curriculumAnswerKey: '',
  subject: 'Physical Science',
  gradeLevel: 'Grade 8',
  unitCode: '8.1',
  lessonNumber: '6',
}

describe('AssessmentTemplateEditForm', () => {
  it('should choose the lesson from the unit catalog', () => {
    render(
      <AssessmentTemplateEditForm
        templateId="template-1"
        formData={formData}
        lessonOptions={[
          { value: '6', label: 'Lesson 6 — Soccer assessment' },
          { value: '7', label: 'Lesson 7 — Baseball' },
        ]}
        onChange={jest.fn()}
        onSubmit={jest.fn()}
        isSubmitting={false}
      />,
    )

    expect(screen.getByRole('combobox', { name: /Lesson/i })).toHaveTextContent('Lesson 6')
    expect(screen.queryByRole('spinbutton', { name: /Lesson/i })).not.toBeInTheDocument()
  })

  it('should keep the saved lesson visible when the catalog has not loaded', () => {
    render(
      <AssessmentTemplateEditForm
        templateId="template-1"
        formData={formData}
        lessonOptions={[]}
        lessonsLoading
        allowEmptyUnit={false}
        onChange={jest.fn()}
        onSubmit={jest.fn()}
        isSubmitting={false}
      />,
    )

    expect(screen.getByRole('combobox', { name: /Lesson/i })).toHaveTextContent('Lesson 6')
    expect(screen.getByRole('combobox', { name: /Unit/i })).toHaveTextContent('8.1')
  })

  it('should show a form error when the lesson is invalid', () => {
    render(
      <AssessmentTemplateEditForm
        templateId="template-1"
        formData={{ ...formData, lessonNumber: '' }}
        formErrors={{ lessonNumber: 'Lesson is required' }}
        lessonOptions={[{ value: '6', label: 'Lesson 6 — Soccer assessment' }]}
        onChange={jest.fn()}
        onSubmit={jest.fn()}
        isSubmitting={false}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Lesson is required')
  })
})
