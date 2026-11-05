import React from 'react'
import { render, screen, cleanup } from '@testing-library/react'
import { ProgressBar } from '../progress-bar'

describe('ProgressBar', () => {
  afterEach(() => {
    cleanup()
  })
  it('renders progress bar with default props', () => {
    render(<ProgressBar value={50} />)
    
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toBeInTheDocument()
    expect(progressBar).toHaveAttribute('aria-valuenow', '50')
    expect(progressBar).toHaveAttribute('aria-valuemin', '0')
    expect(progressBar).toHaveAttribute('aria-valuemax', '100')
  })

  it('renders with custom max value', () => {
    render(<ProgressBar value={25} max={50} />)
    
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '25')
    expect(progressBar).toHaveAttribute('aria-valuemax', '50')
  })

  it('shows label when showLabel is true', () => {
    render(<ProgressBar value={75} showLabel={true} />)
    
    expect(screen.getByText('Progress')).toBeInTheDocument()
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('shows custom label when provided', () => {
    render(<ProgressBar value={60} showLabel={true} label="Custom Progress" />)
    
    expect(screen.getByText('Progress')).toBeInTheDocument()
    expect(screen.getByText('Custom Progress')).toBeInTheDocument()
  })

  it('applies different size classes', () => {
    const { rerender } = render(<ProgressBar value={50} size="sm" />)
    
    const progressBar = screen.getByRole('progressbar').parentElement
    expect(progressBar).toHaveClass('h-1')
    
    rerender(<ProgressBar value={50} size="lg" />)
    expect(progressBar).toHaveClass('h-3')
  })

  it('applies different variant classes', () => {
    const { rerender } = render(<ProgressBar value={50} variant="success" />)
    
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveClass('bg-green-500')
    
    rerender(<ProgressBar value={50} variant="warning" />)
    expect(progressBar).toHaveClass('bg-yellow-500')
    
    rerender(<ProgressBar value={50} variant="danger" />)
    expect(progressBar).toHaveClass('bg-red-500')
    
    rerender(<ProgressBar value={50} variant="default" />)
    expect(progressBar).toHaveClass('bg-primary')
  })

  it('handles edge cases correctly', () => {
    // Value less than 0
    const { rerender } = render(<ProgressBar value={-10} />)
    let progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveStyle({ width: '0%' })
    
    // Value greater than max
    rerender(<ProgressBar value={120} max={100} />)
    progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveStyle({ width: '100%' })
    
    // Max value of 0
    rerender(<ProgressBar value={50} max={0} />)
    progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveStyle({ width: '0%' })
  })

  it('applies custom className', () => {
    render(<ProgressBar value={50} className="custom-class" />)
    
    const container = screen.getByRole('progressbar').parentElement
    expect(container).toHaveClass('custom-class')
  })

  it('shows correct accessibility label', () => {
    render(<ProgressBar value={50} />)
    
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-label', 'Progress: 50%')
  })

  it('shows custom accessibility label when provided', () => {
    render(<ProgressBar value={50} label="Custom Label" />)
    
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-label', 'Custom Label')
  })

  it('handles percentage calculation correctly', () => {
    const { rerender } = render(<ProgressBar value={25} max={100} />)
    
    let progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveStyle({ width: '25%' })
    
    rerender(<ProgressBar value={30} max={60} />)
    progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveStyle({ width: '50%' })
  })

  it('rounds percentage correctly for label', () => {
    render(<ProgressBar value={33.333} showLabel={true} />)
    
    expect(screen.getByText('33%')).toBeInTheDocument()
  })

  it('does not show label when showLabel is false', () => {
    render(<ProgressBar value={50} showLabel={false} />)
    
    expect(screen.queryByText('Progress')).not.toBeInTheDocument()
    expect(screen.queryByText('50%')).not.toBeInTheDocument()
  })
})
