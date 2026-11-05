import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { StudentAssessmentSecondaryBar } from '../student-assessment-secondary-bar'

jest.mock('@/app/lib/utils/student-display-name', () => ({
  getStudentDisplayName: ({
    showRealNames,
    learnerName,
  }: {
    showRealNames: boolean
    learnerName?: string | null
  }) =>
    showRealNames ? (learnerName ?? '') : `Spirit-${learnerName?.slice(0, 4) ?? '?'}`,
}))

jest.mock('@/app/lib/components/ui/buttons/button-compounds', () => ({
  Button: ({
    children,
    onClick,
    ...props
  }: {
    children: React.ReactNode
    onClick?: () => void
    [key: string]: unknown
  }) => (
    <button onClick={onClick} type="button" {...props}>
      {children}
    </button>
  ),
}))

jest.mock('@/app/lib/components/ui/feedback', () => ({
  StudentStatusBadge: ({ status }: { status: string }) => (
    <span data-testid="status-badge">{status}</span>
  ),
}))

describe('StudentAssessmentSecondaryBar', () => {
  const defaultProps = {
    studentName: 'Alex Rivera',
    showStudentInfo: true,
    onToggleStudentInfo: jest.fn(),
    onPrevious: jest.fn(),
    onNext: jest.fn(),
    isFirstRecord: false,
    isLastRecord: false,
    assessmentRecordStatus: 'ready_for_review' as const,
    activeFilters: [] as { type: 'status' | 'class'; value: string; label: string }[],
    onRemoveFilter: jest.fn(),
    currentPosition: 12,
    totalCount: 28,
    onExport: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders secondary bar with student name and reviewed count', () => {
    render(<StudentAssessmentSecondaryBar {...defaultProps} />)

    expect(screen.getByTestId('student-assessment-secondary-bar')).toBeInTheDocument()
    expect(screen.getByText('Alex Rivera')).toBeInTheDocument()
    expect(screen.getByText('12/28 reviewed')).toBeInTheDocument()
  })

  it('disables Previous button when isFirstRecord is true', () => {
    render(<StudentAssessmentSecondaryBar {...defaultProps} isFirstRecord={true} />)

    const previous = screen.getByRole('button', { name: 'Previous student' })
    expect(previous).toBeDisabled()
  })

  it('disables Next button when isLastRecord is true', () => {
    render(<StudentAssessmentSecondaryBar {...defaultProps} isLastRecord={true} />)

    const next = screen.getByRole('button', { name: 'Next student' })
    expect(next).toBeDisabled()
  })

  it('calls onToggleStudentInfo when eye button is clicked', () => {
    render(<StudentAssessmentSecondaryBar {...defaultProps} />)

    const eyeButton = screen.getByRole('button', { name: 'Hide student name' })
    fireEvent.click(eyeButton)

    expect(defaultProps.onToggleStudentInfo).toHaveBeenCalledTimes(1)
  })

  it('shows Show student name aria-label when showStudentInfo is false', () => {
    render(<StudentAssessmentSecondaryBar {...defaultProps} showStudentInfo={false} />)

    expect(screen.getByRole('button', { name: 'Show student name' })).toBeInTheDocument()
  })

  it('calls onExport when Export button is clicked', () => {
    render(<StudentAssessmentSecondaryBar {...defaultProps} />)

    const exportButton = screen.getByRole('button', { name: 'Export' })
    fireEvent.click(exportButton)

    expect(defaultProps.onExport).toHaveBeenCalledTimes(1)
  })

  it('displays class section when provided', () => {
    render(<StudentAssessmentSecondaryBar {...defaultProps} classSection="Period 3" />)

    expect(screen.getByTestId('secondary-bar-class')).toHaveTextContent('Period 3')
  })

  it('does not display class section when not provided', () => {
    render(<StudentAssessmentSecondaryBar {...defaultProps} />)

    expect(screen.queryByTestId('secondary-bar-class')).not.toBeInTheDocument()
  })

  it('renders filter chips and calls onRemoveFilter when chip remove is clicked', () => {
    const activeFilters = [
      { type: 'status' as const, value: 'ready_for_review', label: 'Ready for Review' },
      { type: 'class' as const, value: 'Period 3', label: 'Period 3' },
    ]
    render(
      <StudentAssessmentSecondaryBar
        {...defaultProps}
        activeFilters={activeFilters}
      />
    )

    expect(screen.getByText('Ready for Review')).toBeInTheDocument()
    expect(screen.getByText('Period 3')).toBeInTheDocument()

    const removeStatusButton = screen.getByRole('button', { name: 'Remove status filter' })
    fireEvent.click(removeStatusButton)
    expect(defaultProps.onRemoveFilter).toHaveBeenCalledWith('status')

    const removeClassButton = screen.getByRole('button', { name: 'Remove class filter' })
    fireEvent.click(removeClassButton)
    expect(defaultProps.onRemoveFilter).toHaveBeenCalledWith('class')
  })

  it('calls onPrevious when Previous is clicked', () => {
    render(<StudentAssessmentSecondaryBar {...defaultProps} />)

    fireEvent.click(screen.getByRole('button', { name: 'Previous student' }))
    expect(defaultProps.onPrevious).toHaveBeenCalledTimes(1)
  })

  it('calls onNext when Next is clicked', () => {
    render(<StudentAssessmentSecondaryBar {...defaultProps} />)

    fireEvent.click(screen.getByRole('button', { name: 'Next student' }))
    expect(defaultProps.onNext).toHaveBeenCalledTimes(1)
  })

  it('displays spirit animal name when showStudentInfo is false', () => {
    render(<StudentAssessmentSecondaryBar {...defaultProps} showStudentInfo={false} />)

    expect(screen.getByText('Spirit-Alex')).toBeInTheDocument()
  })

  it('displays status badge in secondary bar', () => {
    render(<StudentAssessmentSecondaryBar {...defaultProps} />)

    expect(screen.getByTestId('secondary-bar-status')).toBeInTheDocument()
    expect(screen.getByTestId('status-badge')).toBeInTheDocument()
  })
})
