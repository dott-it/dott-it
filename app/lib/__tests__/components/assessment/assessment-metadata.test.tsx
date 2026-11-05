import { render, screen } from '@testing-library/react'
import { AssessmentMetadata } from '@/app/lib/components/assessment/assessment-metadata'
import { ActiveAssessment } from '@/types'

// Mock the assessment data
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
  grade: 6,
  type: 'quiz',
  dueDate: new Date('2024-12-30T23:59:59Z'),
  closeDate: new Date('2024-12-31T23:59:59Z'),
  totalRecords: 100,
  pendingRecords: 30,
  studentCount: 25,
}

describe('AssessmentMetadata', () => {
  it('renders all metadata cards', () => {
    render(<AssessmentMetadata assessment={mockAssessment} totalStudents={25} />)

    expect(screen.getByText('Grade Level')).toBeInTheDocument()
    expect(screen.getByText('6')).toBeInTheDocument()
    expect(screen.getByText('Unit')).toBeInTheDocument()
    expect(screen.getByText('Test Unit')).toBeInTheDocument()
    expect(screen.getByText('Students')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
    expect(screen.getByText('Close Date')).toBeInTheDocument()
    expect(screen.getByText('Assessment Type')).toBeInTheDocument()
    expect(screen.getByText('quiz')).toBeInTheDocument()
  })

  it('displays correct student count', () => {
    render(<AssessmentMetadata assessment={mockAssessment} totalStudents={42} />)

    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('displays formatted close date', () => {
    render(<AssessmentMetadata assessment={mockAssessment} totalStudents={25} />)

    // The exact format depends on the locale, but we can check for the year
    expect(screen.getByText(/2024/)).toBeInTheDocument()
  })

  it('does not display Close Date card when closeDate is undefined', () => {
    const assessmentWithoutDueDate = { ...mockAssessment, closeDate: undefined }

    render(<AssessmentMetadata assessment={assessmentWithoutDueDate} totalStudents={25} />)

    // Close Date card should not be rendered when closeDate is undefined
    expect(screen.queryByText('Close Date')).not.toBeInTheDocument()
  })

  it('displays assessment type', () => {
    render(<AssessmentMetadata assessment={mockAssessment} totalStudents={25} />)

    expect(screen.getByText('quiz')).toBeInTheDocument()
  })

  it('displays grade level correctly', () => {
    render(<AssessmentMetadata assessment={mockAssessment} totalStudents={25} />)

    expect(screen.getByText('Grade Level')).toBeInTheDocument()
    expect(screen.getByText('6')).toBeInTheDocument()
  })

  it('displays unit name correctly', () => {
    render(<AssessmentMetadata assessment={mockAssessment} totalStudents={25} />)

    expect(screen.getByText('Unit')).toBeInTheDocument()
    expect(screen.getByText('Test Unit')).toBeInTheDocument()
  })
})
