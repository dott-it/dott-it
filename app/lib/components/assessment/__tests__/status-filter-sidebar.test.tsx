import { render, screen, fireEvent } from '@testing-library/react'
import { StatusFilterSidebar } from '../status-filter-sidebar'
import { AssessmentRecord } from '@/types'

function createMockRecord(id: string, status: string): AssessmentRecord {
  return {
    id,
    tenantId: 't1',
    assessmentId: 'a1',
    classSection: '1A',
    learnerId: `learner-${id}`,
    learnerName: `Student ${id}`,
    rawAnswer: {},
    submittedAt: new Date(),
    status,
    rubricScore: null,
    details: '',
    type: 'formative',
    teacherScore: null,
    numberOfQuestions: '5',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

describe('StatusFilterSidebar', () => {
  const mockRecords: AssessmentRecord[] = [
    createMockRecord('1', 'ready_for_review'),
    createMockRecord('2', 'ready_for_review'),
    createMockRecord('3', 'ready_for_review'),
    createMockRecord('4', 'in_progress'),
    createMockRecord('5', 'in_progress'),
    createMockRecord('6', 'shared'),
    createMockRecord('7', 'shared'),
    createMockRecord('8', 'handed_in'),
  ]

  const mockOnFilterChange = jest.fn()

  beforeEach(() => {
    mockOnFilterChange.mockClear()
  })

  it('renders Filter by Status title and all options', () => {
    render(
      <StatusFilterSidebar
        assessmentRecords={mockRecords}
        statusFilter="all"
        onFilterChange={mockOnFilterChange}
      />
    )

    expect(screen.getByText('Filter by Status')).toBeInTheDocument()
    expect(screen.getByTestId('status-filter-sidebar')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Filter by All/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Filter by Ready for Review/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Filter by In Progress/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Filter by Shared/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Filter by Handed In/i })).toBeInTheDocument()
  })

  it('displays correct counts per status', () => {
    render(
      <StatusFilterSidebar
        assessmentRecords={mockRecords}
        statusFilter="all"
        onFilterChange={mockOnFilterChange}
      />
    )

    expect(screen.getByTestId('status-filter-option-all')).toHaveTextContent('8')
    expect(screen.getByTestId('status-filter-option-ready_for_review')).toHaveTextContent('3')
    expect(screen.getByTestId('status-filter-option-in_progress')).toHaveTextContent('2')
    expect(screen.getByTestId('status-filter-option-shared')).toHaveTextContent('2')
    expect(screen.getByTestId('status-filter-option-handed_in')).toHaveTextContent('1')
  })

  it('displays Showing X of Y students for all filter', () => {
    render(
      <StatusFilterSidebar
        assessmentRecords={mockRecords}
        statusFilter="all"
        onFilterChange={mockOnFilterChange}
      />
    )

    expect(screen.getByTestId('status-filter-summary')).toHaveTextContent('Showing 8 of 8 students')
  })

  it('displays Showing X of Y students when a status is selected', () => {
    render(
      <StatusFilterSidebar
        assessmentRecords={mockRecords}
        statusFilter="in_progress"
        onFilterChange={mockOnFilterChange}
      />
    )

    expect(screen.getByTestId('status-filter-summary')).toHaveTextContent('Showing 2 of 8 students')
  })

  it('calls onFilterChange when an option is clicked', () => {
    render(
      <StatusFilterSidebar
        assessmentRecords={mockRecords}
        statusFilter="all"
        onFilterChange={mockOnFilterChange}
      />
    )

    fireEvent.click(screen.getByTestId('status-filter-option-in_progress'))
    expect(mockOnFilterChange).toHaveBeenCalledWith('in_progress')

    mockOnFilterChange.mockClear()
    fireEvent.click(screen.getByTestId('status-filter-option-all'))
    expect(mockOnFilterChange).toHaveBeenCalledWith('all')
  })

  it('marks the selected option as pressed', () => {
    render(
      <StatusFilterSidebar
        assessmentRecords={mockRecords}
        statusFilter="in_progress"
        onFilterChange={mockOnFilterChange}
      />
    )

    const inProgressButton = screen.getByTestId('status-filter-option-in_progress')
    expect(inProgressButton).toHaveAttribute('aria-pressed', 'true')
  })

  it('handles empty assessment records', () => {
    render(
      <StatusFilterSidebar
        assessmentRecords={[]}
        statusFilter="all"
        onFilterChange={mockOnFilterChange}
      />
    )

    expect(screen.getByTestId('status-filter-summary')).toHaveTextContent('Showing 0 of 0 students')
    expect(screen.getByTestId('status-filter-option-all')).toHaveTextContent('0')
  })
})
