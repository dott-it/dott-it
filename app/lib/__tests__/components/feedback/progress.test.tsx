import React from 'react'
import { render, screen } from '@testing-library/react'

// Mock Radix UI Progress components
jest.mock('@radix-ui/react-progress', () => {
  const ProgressRoot = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, children, ...props }, ref) => (
      <div ref={ref} className={className} data-testid="progress-root" {...props}>
        {children}
      </div>
    ),
  )
  ProgressRoot.displayName = 'ProgressRoot'

  const ProgressIndicator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, style, ...props }, ref) => (
      <div
        ref={ref}
        className={className}
        style={style}
        data-testid="progress-indicator"
        {...props}
      />
    ),
  )
  ProgressIndicator.displayName = 'ProgressIndicator'

  return {
    Root: ProgressRoot,
    Indicator: ProgressIndicator,
  }
})

import { Progress } from '../../../components/ui/feedback/progress'

describe('Progress', () => {
  it('renders with default props', () => {
    render(<Progress />)
    const progressRoot = screen.getByTestId('progress-root')
    expect(progressRoot).toBeInTheDocument()
    expect(progressRoot).toHaveClass(
      'relative',
      'h-4',
      'w-full',
      'overflow-hidden',
      'rounded-full',
      'bg-secondary',
    )
  })

  it('renders with custom value', () => {
    render(<Progress value={50} />)
    const progressIndicator = screen.getByTestId('progress-indicator')
    expect(progressIndicator).toHaveStyle({ transform: 'translateX(-50%)' })
  })

  it('renders with 0 value', () => {
    render(<Progress value={0} />)
    const progressIndicator = screen.getByTestId('progress-indicator')
    expect(progressIndicator).toHaveStyle({ transform: 'translateX(-100%)' })
  })

  it('renders with 100 value', () => {
    render(<Progress value={100} />)
    const progressIndicator = screen.getByTestId('progress-indicator')
    expect(progressIndicator).toHaveStyle({ transform: 'translateX(-0%)' })
  })

  it('renders with undefined value', () => {
    render(<Progress value={undefined} />)
    const progressIndicator = screen.getByTestId('progress-indicator')
    expect(progressIndicator).toHaveStyle({ transform: 'translateX(-100%)' })
  })

  it('applies custom className', () => {
    render(<Progress className="custom-progress" />)
    const progressRoot = screen.getByTestId('progress-root')
    expect(progressRoot).toHaveClass('custom-progress')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<Progress ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it('renders progress indicator with correct classes', () => {
    render(<Progress value={75} />)
    const progressIndicator = screen.getByTestId('progress-indicator')
    expect(progressIndicator).toHaveClass('size-full', 'flex-1', 'bg-primary', 'transition-all')
  })

  it('applies all HTML attributes', () => {
    render(<Progress data-testid="progress" aria-label="Loading progress" value={25} />)
    const progressRoot = screen.getByTestId('progress')
    expect(progressRoot).toHaveAttribute('aria-label', 'Loading progress')
  })

  it('handles edge case values', () => {
    const { rerender } = render(<Progress value={-10} />)
    let progressIndicator = screen.getByTestId('progress-indicator')
    expect(progressIndicator).toHaveStyle({ transform: 'translateX(-110%)' })

    rerender(<Progress value={150} />)
    progressIndicator = screen.getByTestId('progress-indicator')
    expect(progressIndicator).toHaveStyle({ transform: 'translateX(--50%)' })
  })
})
