import { render, screen, fireEvent } from '@testing-library/react'
import { StudentProgress } from '@/app/lib/components/assessment/student-progress'

describe('StudentProgress', () => {
  it('renders student progress with all statuses', () => {
    render(<StudentProgress readyForReview={3} inProgress={12} shared={8} total={23} />)

    expect(screen.getByText('Assessment Progress')).toBeInTheDocument()
    expect(screen.getByText('Ready for Review')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('Shared')).toBeInTheDocument()
    expect(screen.getByText('35% Complete')).toBeInTheDocument()
  })

  it('renders correct counts for each status', () => {
    render(<StudentProgress readyForReview={3} inProgress={12}  shared={8} />)

    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('renders zero values correctly', () => {
    render(<StudentProgress readyForReview={0} inProgress={0} shared={0} />)

    expect(screen.getAllByText('0')).toHaveLength(3)
    expect(screen.getAllByText('0%')).toHaveLength(3)
  })

  it('calls onFilterChange when status card is clicked', () => {
    const mockOnFilterChange = jest.fn()
    render(
      <StudentProgress
        readyForReview={3}
        inProgress={12}
        shared={8}
        onFilterChange={mockOnFilterChange}
      />,
    )

    fireEvent.click(screen.getByText('Ready for Review'))
    expect(mockOnFilterChange).toHaveBeenCalledWith('ready_for_review')

    fireEvent.click(screen.getByText('In Progress'))
    expect(mockOnFilterChange).toHaveBeenCalledWith('in_progress')

    fireEvent.click(screen.getByText('Shared'))
    expect(mockOnFilterChange).toHaveBeenCalledWith('shared')
  })

  it('renders without onFilterChange prop', () => {
    render(<StudentProgress readyForReview={3} inProgress={12}  shared={8} />)

    expect(screen.getByText('Assessment Progress')).toBeInTheDocument()
    expect(screen.getByText('Ready for Review')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('Shared')).toBeInTheDocument()
  })

  it('applies correct CSS classes for each status card', () => {
    render(<StudentProgress readyForReview={3} inProgress={12}  shared={8} />)

    const readyForReviewCard = screen.getByText('Ready for Review').closest('[class*="bg-blue-50"]')
    const inProgressCard = screen.getByText('In Progress').closest('[class*="bg-yellow-50"]')
    const sharedCard = screen.getByText('Shared').closest('[class*="bg-green-50"]')

    expect(readyForReviewCard).toHaveClass('bg-blue-50')
    expect(inProgressCard).toHaveClass('bg-yellow-50')
    expect(sharedCard).toHaveClass('bg-green-50')
  })
})
