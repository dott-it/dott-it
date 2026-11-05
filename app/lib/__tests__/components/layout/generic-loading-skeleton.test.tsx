import React from 'react'
import { render } from '@testing-library/react'
import { LoadingSkeleton } from '@/app/lib/components/ui/layout/loading/generic-loading-skeleton'
import { SimpleLoadingSkeleton } from '@/app/lib/components/ui/layout/loading/skeletons/simple-loading-skeleton'

describe('LoadingSkeleton', () => {
  it('renders default cards variant', () => {
    const { container } = render(<LoadingSkeleton />)

    // Check for grid layout (cards variant)
    const grid = container.querySelector('.grid')
    expect(grid).toBeInTheDocument()
    expect(grid).toHaveClass('gap-4', 'md:grid-cols-2', 'lg:grid-cols-3')
  })

  it('renders header variant', () => {
    const { container } = render(<LoadingSkeleton variant="header" />)

    // Check for header layout
    const headerLayout = container.querySelector('.flex.items-center.justify-between')
    expect(headerLayout).toBeInTheDocument()
  })

  it('renders list variant', () => {
    const { container } = render(<LoadingSkeleton variant="list" />)

    // Check for list layout
    const listLayout = container.querySelector('.space-y-4')
    expect(listLayout).toBeInTheDocument()
  })

  it('renders custom count of items', () => {
    const { container } = render(<LoadingSkeleton variant="cards" count={3} />)

    const skeletonItems = container.querySelectorAll('.animate-pulse')
    expect(skeletonItems).toHaveLength(3)
  })

  it('applies custom className', () => {
    const { container } = render(<LoadingSkeleton className="custom-class" />)

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<LoadingSkeleton ref={ref} />)

    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it('renders custom variant with no content', () => {
    const { container } = render(<LoadingSkeleton variant="custom" />)

    // Custom variant should render empty content
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toBeInTheDocument()
    expect(wrapper.children).toHaveLength(0)
  })
})

describe('SimpleLoadingSkeleton', () => {
  it('renders simple skeleton lines', () => {
    const { container } = render(<SimpleLoadingSkeleton />)

    // Check for skeleton lines (3 by default)
    const skeletonLines = container.querySelectorAll('.animate-pulse')
    expect(skeletonLines).toHaveLength(3)

    // Check for proper spacing
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('space-y-4')
  })

  it('applies custom className', () => {
    const { container } = render(<SimpleLoadingSkeleton className="simple-loading" />)

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('simple-loading')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<SimpleLoadingSkeleton ref={ref} />)

    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })
})

describe('Loading Skeleton Animations', () => {
  it('all skeleton items have animate-pulse class', () => {
    const { container } = render(<LoadingSkeleton variant="cards" count={4} />)

    const skeletonItems = container.querySelectorAll('.animate-pulse')
    expect(skeletonItems.length).toBeGreaterThan(0)

    for (const item of skeletonItems) {
      expect(item).toHaveClass('animate-pulse')
    }
  })

  it('skeleton items have proper background styling', () => {
    const { container } = render(<LoadingSkeleton variant="cards" count={2} />)

    const skeletonItems = container.querySelectorAll('.bg-muted')
    expect(skeletonItems.length).toBeGreaterThan(0)

    for (const item of skeletonItems) {
      expect(item).toHaveClass('bg-muted')
    }
  })
})
