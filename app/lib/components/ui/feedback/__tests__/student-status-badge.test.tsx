import React from 'react'
import { render, screen } from '@testing-library/react'
import { StudentStatusBadge } from '../student-status-badge'

describe('StudentStatusBadge', () => {
  it('renders ready_for_review status correctly', () => {
    render(<StudentStatusBadge status="ready_for_review" />)

    expect(screen.getByText('Ready for Review')).toBeInTheDocument()
  })

  it('renders in_progress status correctly', () => {
    render(<StudentStatusBadge status="in_progress" />)

    expect(screen.getByText('In Progress')).toBeInTheDocument()
  })

  it('renders sent status correctly', () => {
    render(<StudentStatusBadge status="sent" />)

    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })

  it('renders handed in status correctly', () => {
    render(<StudentStatusBadge status="handed_in" />)

    expect(screen.getByText('Handed In')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<StudentStatusBadge status="ready_for_review" className="custom-class" />)

    const badge = screen.getByText('Ready for Review').closest('div')
    expect(badge).toHaveClass('custom-class')
  })

  it('renders unknown status gracefully', () => {
    render(<StudentStatusBadge status="invalid" />)

    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })
})
