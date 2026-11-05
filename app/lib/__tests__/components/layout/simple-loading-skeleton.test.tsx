import React from 'react'
import { render } from '@testing-library/react'
import { SimpleLoadingSkeleton } from '@/app/lib/components/ui/layout/loading/skeletons/simple-loading-skeleton'

describe('SimpleLoadingSkeleton', () => {
  it('renders default simple loading skeleton', () => {
    const { container } = render(<SimpleLoadingSkeleton />)

    // Check for the main wrapper
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('space-y-4')

    // Check for 3 loading lines
    const loadingLines = container.querySelectorAll('.h-4.animate-pulse.rounded.bg-muted')
    expect(loadingLines).toHaveLength(3)
  })

  it('applies custom className', () => {
    const { container } = render(<SimpleLoadingSkeleton className="custom-skeleton" />)

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('space-y-4', 'custom-skeleton')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<SimpleLoadingSkeleton ref={ref} />)

    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it('renders with correct structure', () => {
    const { container } = render(<SimpleLoadingSkeleton />)

    // Check that all loading lines are children of the wrapper
    const wrapper = container.firstChild as HTMLElement
    const loadingLines = wrapper.querySelectorAll('.h-4.animate-pulse.rounded.bg-muted')
    expect(loadingLines).toHaveLength(3)
  })
})
