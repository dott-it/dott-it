import { render, screen } from '@testing-library/react'
import { AssessmentCollection } from '@/app/lib/components/ui/feedback/assessment-collection'
import { Assessment } from '@/types'

jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode
    href: string
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  }
})

// Mock the utils to avoid issues with window.location
jest.mock('@/app/lib/utils/utils', () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
  formatDateShort: (date: string) => new Date(date).toLocaleDateString(),
}))

const mockAssessment: Assessment = {
  id: 'test-1',
  tenantId: 'tenant-1',
  templateId: 'template-1',
  teacherId: 'teacher-1',
  assignedBy: 'teacher-1',
  assignedAt: '2024-05-01T00:00:00Z',
  dueAt: '2024-05-15T23:59:59Z',
  assignedTo: {},
  submissionUrl: 'https://example.com',
  status: 'live',
  instructions: 'Test instructions',
  numberOfQuestions: 5,
  title: 'Test Assessment',
  unitName: 'Test Unit',
  subject: 'Science',
  grade: 8,
  type: 'Constructed Response',
  dueDate: new Date('2024-05-15'),
  closeDate: new Date('2024-05-15'),
  totalRecords: 25,
  pendingRecords: 5,
  studentCount: 25,
  submissionStats: {
    readyForReview: 15,
    shared: 7,
  },
  submissionStatus: {
    handedIn: 3,
    readyForReview: 15,
    inProgress: 5,
    shared: 7,
  },
  description: 'Test assessment description',
}

describe('AssessmentCollection', () => {
  it('renders collection with title and assessments', () => {
    render(
      <AssessmentCollection
        title="Live Assessments"
        assessments={[mockAssessment]}
        getAssessmentHref={(assessment) => `/workspace/assessments/${assessment.id}`}
      />,
    )

    expect(screen.getByText('Live Assessments')).toBeInTheDocument()
    expect(screen.getByText('Test Assessment')).toBeInTheDocument()
    expect(screen.getByTestId('assessment-card-status-ready-for-review')).toHaveTextContent('15')
    expect(screen.getByTestId('assessment-card-status-in-progress')).toHaveTextContent('5')
    expect(screen.getByTestId('assessment-card-status-shared')).toHaveTextContent('7')
  })

  it('renders nothing when assessments array is empty', () => {
    const { container } = render(
      <AssessmentCollection
        title="Live Assessments"
        assessments={[]}
        getAssessmentHref={(assessment) => `/workspace/assessments/${assessment.id}`}
      />,
    )

    expect(container.firstChild).toBeNull()
  })

  it('renders multiple assessments in grid layout', () => {
    const secondAssessment = { ...mockAssessment, id: 'test-2', title: 'Second Assessment' }

    render(
      <AssessmentCollection
        title="Live Assessments"
        assessments={[mockAssessment, secondAssessment]}
        getAssessmentHref={(assessment) => `/workspace/assessments/${assessment.id}`}
      />,
    )

    expect(screen.getByText('Test Assessment')).toBeInTheDocument()
    expect(screen.getByText('Second Assessment')).toBeInTheDocument()
  })

  it('links assessment cards to details page', () => {
    render(
      <AssessmentCollection
        title="Live Assessments"
        assessments={[mockAssessment]}
        getAssessmentHref={(assessment) => `/workspace/assessments/${assessment.id}`}
      />,
    )

    const link = screen.getByRole('link', { name: /Test Assessment/i })
    expect(link).toHaveAttribute('href', '/workspace/assessments/test-1')
  })

  it('applies custom className when provided', () => {
    const { container } = render(
      <AssessmentCollection
        title="Live Assessments"
        assessments={[mockAssessment]}
        getAssessmentHref={(assessment) => `/workspace/assessments/${assessment.id}`}
        className="custom-class"
      />,
    )

    const collectionElement = container.firstChild as HTMLElement
    expect(collectionElement).toHaveClass('custom-class')
  })
})
