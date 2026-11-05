import { render, screen, fireEvent } from '@testing-library/react'
import { AssessmentStatus } from '../assessment-status'
import { ActiveAssessment } from '@/types'

const mockAssessment: ActiveAssessment = {
  id: '1',
  tenantId: 'tenant-1',
  templateId: 'template-1',
  teacherId: 'teacher-1',
  assignedBy: 'teacher-1',
  assignedAt: '2024-05-01T00:00:00Z',
  dueAt: '2024-12-31T23:59:59Z',
  assignedTo: {},
  submissionUrl: 'https://example.com',
  status: 'draft',
  instructions: 'Test instructions',
  numberOfQuestions: 5,
  title: 'Test Assessment',
  unitName: 'Unit 1',
  subject: 'Science',
  grade: 8,
  type: 'Formative',
  dueDate: new Date('2024-12-31'),
  totalRecords: 0,
  pendingRecords: 0,
}

describe('AssessmentStatus', () => {
  const mockOnStatusChange = jest.fn()

  beforeEach(() => {
    mockOnStatusChange.mockClear()
  })

  it('renders assessment status correctly', () => {
    render(<AssessmentStatus assessment={mockAssessment} onStatusChange={mockOnStatusChange} />)

    expect(screen.getByText('Status:')).toBeInTheDocument()
    expect(screen.getByText('Draft')).toBeInTheDocument()
  })

  it('shows start live button for draft status', () => {
    render(<AssessmentStatus assessment={mockAssessment} onStatusChange={mockOnStatusChange} />)

    const startLiveButton = screen.getByRole('button', { name: /start live/i })
    expect(startLiveButton).toBeInTheDocument()
  })

  it('calls onStatusChange when start live is clicked', () => {
    render(<AssessmentStatus assessment={mockAssessment} onStatusChange={mockOnStatusChange} />)

    const startLiveButton = screen.getByRole('button', { name: /start live/i })
    fireEvent.click(startLiveButton)

    expect(mockOnStatusChange).toHaveBeenCalledWith('live')
  })

  it('shows set done button for live status', () => {
    const liveAssessment = { ...mockAssessment, status: 'live' as const }

    render(<AssessmentStatus assessment={liveAssessment} onStatusChange={mockOnStatusChange} />)

    const setDoneButton = screen.getByRole('button', { name: /set done/i })
    expect(setDoneButton).toBeInTheDocument()
  })

  it('shows reopen button for completed status', () => {
    const completedAssessment = { ...mockAssessment, status: 'completed' as const }

    render(
      <AssessmentStatus assessment={completedAssessment} onStatusChange={mockOnStatusChange} />,
    )

    const reopenButton = screen.getByRole('button', { name: /reopen/i })
    expect(reopenButton).toBeInTheDocument()
  })

  it('disables buttons when loading', () => {
    render(
      <AssessmentStatus
        assessment={mockAssessment}
        onStatusChange={mockOnStatusChange}
        isLoading={true}
      />,
    )

    const startLiveButton = screen.getByRole('button', { name: /start live/i })
    expect(startLiveButton).toBeDisabled()
  })
})
