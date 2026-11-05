import { render, screen, fireEvent } from '@testing-library/react'
import { AssessmentSecondaryBar } from '@/app/lib/components/assessment/assessment-secondary-bar'
import { ActiveAssessment } from '@/types'

const mockAssessment: ActiveAssessment = {
  id: '1',
  tenantId: 'tenant-1',
  templateId: 'template-1',
  teacherId: 'teacher-1',
  assignedBy: 'teacher-1',
  assignedAt: '2024-05-01T00:00:00Z',
  dueAt: '2024-12-30T23:59:59Z',
  assignedTo: {},
  submissionUrl: 'https://example.com',
  status: 'live',
  instructions: 'Test instructions',
  numberOfQuestions: 5,
  title: 'Test Assessment',
  unitName: 'Test Unit',
  subject: 'Science',
  grade: 8,
  type: 'formative',
  dueDate: new Date('2024-12-30T23:59:59Z'),
  closeDate: new Date('2024-12-31T23:59:59Z'),
  totalRecords: 8,
  pendingRecords: 6,
  studentCount: 8,
}

const mockOnAssessmentHandout = jest.fn()

describe('AssessmentSecondaryBar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders secondary bar with correct test id', () => {
    render(
      <AssessmentSecondaryBar
        assessment={mockAssessment}
        totalStudents={8}
        completedCount={2}
        onAssessmentHandout={mockOnAssessmentHandout}
      />,
    )
    expect(screen.getByTestId('assessment-secondary-bar')).toBeInTheDocument()
  })

  it('renders grade pill when assessment has grade', () => {
    render(
      <AssessmentSecondaryBar
        assessment={mockAssessment}
        totalStudents={8}
        completedCount={2}
        onAssessmentHandout={mockOnAssessmentHandout}
      />,
    )
    expect(screen.getByTestId('secondary-bar-grade')).toHaveTextContent('Grade 8')
  })

  it('renders subject pill when assessment has subject', () => {
    render(
      <AssessmentSecondaryBar
        assessment={mockAssessment}
        totalStudents={8}
        completedCount={2}
        onAssessmentHandout={mockOnAssessmentHandout}
      />,
    )
    expect(screen.getByTestId('secondary-bar-subject')).toHaveTextContent('Science')
  })

  it('renders assessment type pill with formatted type', () => {
    render(
      <AssessmentSecondaryBar
        assessment={mockAssessment}
        totalStudents={8}
        completedCount={2}
        onAssessmentHandout={mockOnAssessmentHandout}
      />,
    )
    expect(screen.getByTestId('secondary-bar-type')).toHaveTextContent('Formative')
  })

  it('renders students count', () => {
    render(
      <AssessmentSecondaryBar
        assessment={mockAssessment}
        totalStudents={8}
        completedCount={2}
        onAssessmentHandout={mockOnAssessmentHandout}
      />,
    )
    expect(screen.getByTestId('secondary-bar-students')).toHaveTextContent('8 Students')
  })

  it('renders progress ratio and progress bar', () => {
    render(
      <AssessmentSecondaryBar
        assessment={mockAssessment}
        totalStudents={8}
        completedCount={2}
        onAssessmentHandout={mockOnAssessmentHandout}
      />,
    )
    const progressRegion = screen.getByTestId('secondary-bar-progress')
    expect(progressRegion).toHaveAttribute('aria-label', 'Progress: 2 of 8 submissions')
    expect(progressRegion).toHaveTextContent('2/8')
  })

  it('renders Assessment Handout button and calls handler on click', () => {
    render(
      <AssessmentSecondaryBar
        assessment={mockAssessment}
        totalStudents={8}
        completedCount={2}
        onAssessmentHandout={mockOnAssessmentHandout}
      />,
    )
    const button = screen.getByTestId('secondary-bar-handout-button')
    expect(button).toHaveTextContent('Assessment Handout')
    fireEvent.click(button)
    expect(mockOnAssessmentHandout).toHaveBeenCalledTimes(1)
  })

  it('disables Assessment Handout button when handoutDisabled is true', () => {
    render(
      <AssessmentSecondaryBar
        assessment={mockAssessment}
        totalStudents={8}
        completedCount={2}
        onAssessmentHandout={mockOnAssessmentHandout}
        handoutDisabled
      />,
    )
    expect(screen.getByTestId('secondary-bar-handout-button')).toBeDisabled()
  })

  it('does not render grade pill when assessment has no grade', () => {
    const noGrade = { ...mockAssessment, grade: undefined }
    render(
      <AssessmentSecondaryBar
        assessment={noGrade}
        totalStudents={8}
        completedCount={2}
        onAssessmentHandout={mockOnAssessmentHandout}
      />,
    )
    expect(screen.queryByTestId('secondary-bar-grade')).not.toBeInTheDocument()
  })

  it('does not render subject pill when assessment has no subject', () => {
    const noSubject = { ...mockAssessment, subject: undefined }
    render(
      <AssessmentSecondaryBar
        assessment={noSubject}
        totalStudents={8}
        completedCount={2}
        onAssessmentHandout={mockOnAssessmentHandout}
      />,
    )
    expect(screen.queryByTestId('secondary-bar-subject')).not.toBeInTheDocument()
  })
})
