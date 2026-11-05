import React from 'react'
import { render, screen } from '@testing-library/react'
import { RecordSummaryCards } from '../record-summary-cards'

describe('RecordSummaryCards', () => {
  const mockProps = {
    studentName: 'John Doe',
    lastFeedbackDate: '2024-01-15T10:30:00Z',
    submittedAt: '2024-01-10T09:00:00Z',
    showStudentInfo: true,
  }

  it('renders all cards when all data is provided', () => {
    render(<RecordSummaryCards {...mockProps} classSection="1st hour" totalResponses={5} />)

    expect(screen.getByText('Class')).toBeInTheDocument()
    expect(screen.getByText('1st hour')).toBeInTheDocument()
    expect(screen.getByText('Responses')).toBeInTheDocument()
    expect(screen.getByText('5 total submissions')).toBeInTheDocument()
    expect(screen.getByText('Last Submitted')).toBeInTheDocument()
    expect(screen.getByText('Last Feedback')).toBeInTheDocument()
  })

  it('renders correct number of cards when some data is missing', () => {
    const { container } = render(<RecordSummaryCards {...mockProps} />)

    // Should render 3 cards: Responses, Last Submitted, Last Feedback (no Class card)
    expect(screen.getByText('Responses')).toBeInTheDocument()
    expect(screen.getByText('Last Submitted')).toBeInTheDocument()
    expect(screen.getByText('Last Feedback')).toBeInTheDocument()
    expect(screen.queryByText('Class')).not.toBeInTheDocument()

    // Check if grid has correct classes for 3 cards
    const gridElement = container.querySelector('.grid')
    expect(gridElement).toHaveClass('md:grid-cols-2', 'lg:grid-cols-3')
  })

  it('renders class section when provided', () => {
    render(<RecordSummaryCards {...mockProps} classSection="1st hour" />)

    expect(screen.getByText('Class')).toBeInTheDocument()
    expect(screen.getByText('1st hour')).toBeInTheDocument()
  })

  it('does not render class section when not provided', () => {
    render(<RecordSummaryCards {...mockProps} />)

    expect(screen.queryByText('Class')).not.toBeInTheDocument()
  })

  it('renders empty class section gracefully', () => {
    render(<RecordSummaryCards {...mockProps} classSection="" />)

    expect(screen.queryByText('Class')).not.toBeInTheDocument()
  })

  it('handles missing lastFeedbackDate gracefully', () => {
    const { container } = render(<RecordSummaryCards {...mockProps} lastFeedbackDate={null} />)

    // Should render 2 cards: Responses, Last Submitted (no Class, no Last Feedback)
    expect(screen.getByText('Responses')).toBeInTheDocument()
    expect(screen.getByText('Last Submitted')).toBeInTheDocument()
    expect(screen.queryByText('Last Feedback')).not.toBeInTheDocument()

    // Check if grid has correct classes for 2 cards
    const gridElement = container.querySelector('.grid')
    expect(gridElement).toHaveClass('md:grid-cols-2')
  })

  it('displays total responses when provided', () => {
    render(<RecordSummaryCards {...mockProps} totalResponses={5} />)

    expect(screen.getByText('5 total submissions')).toBeInTheDocument()
  })

  it('displays no responses when totalResponses is not provided', () => {
    render(<RecordSummaryCards {...mockProps} />)

    expect(screen.getByText('No responses')).toBeInTheDocument()
  })

  it('handles empty submittedAt', () => {
    render(<RecordSummaryCards {...mockProps} submittedAt="" />)

    expect(screen.getByText('Not submitted')).toBeInTheDocument()
  })

  it('applies correct grid classes for 4 cards', () => {
    const { container } = render(
      <RecordSummaryCards 
        {...mockProps} 
        classSection="1st hour" 
        totalResponses={5} 
      />
    )

    // Should render 4 cards: Class, Responses, Last Submitted, Last Feedback
    const gridElement = container.querySelector('.grid')
    expect(gridElement).toHaveClass('md:grid-cols-2', 'lg:grid-cols-4')
  })

  it('applies correct grid classes for 2 cards', () => {
    const { container } = render(
      <RecordSummaryCards 
        {...mockProps} 
        lastFeedbackDate={null}
        submittedAt=""
      />
    )

    // Should render 2 cards: Current Response and Last Submitted (both always shown)
    const gridElement = container.querySelector('.grid')
    expect(gridElement).toHaveClass('grid gap-4 md:grid-cols-2')
  })
})
