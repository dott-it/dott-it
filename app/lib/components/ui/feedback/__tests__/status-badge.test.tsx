import React from 'react'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from '../status-badge'

describe('StatusBadge', () => {
  it('renders draft status correctly', () => {
    render(<StatusBadge status="draft" />)

    expect(screen.getByText('Draft')).toBeInTheDocument()
  })

  it('renders live status correctly', () => {
    render(<StatusBadge status="live" />)

    expect(screen.getByText('Live')).toBeInTheDocument()
  })

  it('renders completed status correctly', () => {
    render(<StatusBadge status="completed" />)

    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('renders expired status correctly', () => {
    render(<StatusBadge status="expired" />)

    expect(screen.getByText('Expired')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<StatusBadge status="live" className="custom-class" />)

    const badge = screen.getByText('Live').closest('div')
    expect(badge).toHaveClass('custom-class')
  })

  it('renders unknown status gracefully', () => {
    // @ts-expect-error - testing invalid status
    render(<StatusBadge status="invalid" />)

    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })
})
