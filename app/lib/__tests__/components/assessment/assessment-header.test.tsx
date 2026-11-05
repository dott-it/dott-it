import { render, screen, fireEvent } from '@testing-library/react'
import { AssessmentHeader } from '@/app/lib/components/assessment/assessment-header'
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
  studentCount: 100,
}

// Mock functions
const mockOnBack = jest.fn()
const mockOnExport = jest.fn()
const mockOnLiveCollection = jest.fn()
const mockOnStatusChange = jest.fn()

describe('AssessmentHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders assessment title and metadata', () => {
    render(
      <AssessmentHeader
        assessment={mockAssessment}
        onBack={mockOnBack}
        onExport={mockOnExport}
        onLiveCollection={mockOnLiveCollection}
      />,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Test Assessment' })).toBeInTheDocument()
    expect(screen.getByText('Test Unit • Grade 6')).toBeInTheDocument()
  })

  it('omits an empty unit from the subtitle', () => {
    render(
      <AssessmentHeader
        assessment={{ ...mockAssessment, unitName: '' }}
        onBack={mockOnBack}
        onExport={mockOnExport}
        onLiveCollection={mockOnLiveCollection}
      />,
    )

    expect(screen.getByText('Grade 6')).toBeInTheDocument()
    expect(screen.queryByText('• Grade 6')).not.toBeInTheDocument()
  })

  it('renders all action buttons', () => {
    render(
      <AssessmentHeader
        assessment={mockAssessment}
        onBack={mockOnBack}
        onExport={mockOnExport}
        onLiveCollection={mockOnLiveCollection}
      />,
    )

    expect(screen.getByText('Export')).toBeInTheDocument()
    expect(screen.getByText('Assessment Handout')).toBeInTheDocument()
  })

  it('calls onExport when export button is clicked', () => {
    render(
      <AssessmentHeader
        assessment={mockAssessment}
        onBack={mockOnBack}
        onExport={mockOnExport}
        onLiveCollection={mockOnLiveCollection}
      />,
    )

    fireEvent.click(screen.getByText('Export'))
    expect(mockOnExport).toHaveBeenCalledTimes(1)
  })

  it('calls onLiveCollection when live collection button is clicked', () => {
    render(
      <AssessmentHeader
        assessment={mockAssessment}
        onBack={mockOnBack}
        onExport={mockOnExport}
        onLiveCollection={mockOnLiveCollection}
      />,
    )

    fireEvent.click(screen.getByText('Assessment Handout'))
    expect(mockOnLiveCollection).toHaveBeenCalledTimes(1)
  })

  it('shows status action button for draft assessment when onStatusChange is provided', () => {
    const draftAssessment = { ...mockAssessment, status: 'draft' as const }

    render(
      <AssessmentHeader
        assessment={draftAssessment}
        onBack={mockOnBack}
        onExport={mockOnExport}
        onLiveCollection={mockOnLiveCollection}
        onStatusChange={mockOnStatusChange}
      />,
    )

    expect(screen.getByText('Start Live')).toBeInTheDocument()
  })

  it('shows status action button for live assessment when onStatusChange is provided', () => {
    const liveAssessment = { ...mockAssessment, status: 'live' as const }

    render(
      <AssessmentHeader
        assessment={liveAssessment}
        onBack={mockOnBack}
        onExport={mockOnExport}
        onLiveCollection={mockOnLiveCollection}
        onStatusChange={mockOnStatusChange}
      />,
    )

    // "Set Done" button was removed as requested in #225
    expect(screen.queryByText('Set Done')).not.toBeInTheDocument()
  })

  it('does not show status action button when onStatusChange is not provided', () => {
    const draftAssessment = { ...mockAssessment, status: 'draft' as const }

    render(
      <AssessmentHeader
        assessment={draftAssessment}
        onBack={mockOnBack}
        onExport={mockOnExport}
        onLiveCollection={mockOnLiveCollection}
      />,
    )

    // Should not show status action button when onStatusChange is not provided
    expect(screen.queryByText('Start Live')).not.toBeInTheDocument()
  })

  it('disables live collection button when assessment status is not live', () => {
    const draftAssessment = { ...mockAssessment, status: 'draft' as const }

    render(
      <AssessmentHeader
        assessment={draftAssessment}
        onBack={mockOnBack}
        onExport={mockOnExport}
        onLiveCollection={mockOnLiveCollection}
      />,
    )

    const liveCollectionButton = screen.getByText('Assessment Handout')
    expect(liveCollectionButton).toBeDisabled()
  })

  it('does not show Assessment Handout button when showHandoutInHeader is false', () => {
    render(
      <AssessmentHeader
        assessment={mockAssessment}
        onBack={mockOnBack}
        onExport={mockOnExport}
        onLiveCollection={mockOnLiveCollection}
        showHandoutInHeader={false}
      />,
    )

    expect(screen.getByText('Export')).toBeInTheDocument()
    expect(screen.queryByText('Assessment Handout')).not.toBeInTheDocument()
  })

  it('does not show Export button when showExportInHeader is false', () => {
    render(
      <AssessmentHeader
        assessment={mockAssessment}
        onBack={mockOnBack}
        onExport={mockOnExport}
        onLiveCollection={mockOnLiveCollection}
        showExportInHeader={false}
      />,
    )

    expect(screen.queryByText('Export')).not.toBeInTheDocument()
    expect(screen.getByText('Assessment Handout')).toBeInTheDocument()
  })
})
