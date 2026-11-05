import React from 'react'
import { render, screen } from '@testing-library/react'
import { Loading } from '@/app/lib/components/ui/layout/loading/loading'

describe('Loading', () => {
  it('renders spinner variant by default', () => {
    const { container } = render(<Loading />)

    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('renders with custom message', () => {
    render(<Loading message="Custom loading message" />)

    expect(screen.getByText('Custom loading message')).toBeInTheDocument()
  })

  it('renders spinner variant', () => {
    const { container } = render(<Loading variant="spinner" />)

    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('renders dots variant', () => {
    const { container } = render(<Loading variant="dots" />)

    const dots = container.querySelectorAll('.animate-bounce')
    expect(dots).toHaveLength(3)
  })

  it('renders pulse variant', () => {
    const { container } = render(<Loading variant="pulse" />)

    const pulse = container.querySelector('.animate-pulse')
    expect(pulse).toBeInTheDocument()
  })

  it('applies correct size classes', () => {
    const { container, rerender } = render(<Loading size="sm" />)

    let spinner = container.querySelector('.size-4')
    expect(spinner).toBeInTheDocument()

    rerender(<Loading size="md" />)
    spinner = container.querySelector('.size-6')
    expect(spinner).toBeInTheDocument()

    rerender(<Loading size="lg" />)
    spinner = container.querySelector('.size-8')
    expect(spinner).toBeInTheDocument()

    rerender(<Loading size="xl" />)
    spinner = container.querySelector('.size-12')
    expect(spinner).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<Loading className="custom-loading" />)

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('custom-loading')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<Loading ref={ref} />)

    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it('has correct default structure', () => {
    const { container } = render(<Loading />)

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center')
  })

  it('renders dots with correct animation delays', () => {
    const { container } = render(<Loading variant="dots" />)

    const dots = container.querySelectorAll('.animate-bounce')
    expect(dots[0]).toHaveStyle({ animationDelay: '0s' })
    expect(dots[1]).toHaveStyle({ animationDelay: '0.1s' })
    expect(dots[2]).toHaveStyle({ animationDelay: '0.2s' })
  })

  it('renders dots with correct sizes', () => {
    const { container, rerender } = render(<Loading variant="dots" size="sm" />)

    let dots = container.querySelectorAll('.size-1')
    expect(dots).toHaveLength(3)

    rerender(<Loading variant="dots" size="md" />)
    dots = container.querySelectorAll('.size-2')
    expect(dots).toHaveLength(3)

    rerender(<Loading variant="dots" size="lg" />)
    dots = container.querySelectorAll('.size-3')
    expect(dots).toHaveLength(3)

    rerender(<Loading variant="dots" size="xl" />)
    dots = container.querySelectorAll('.size-4')
    expect(dots).toHaveLength(3)
  })

  it('does not render message when not provided', () => {
    const { container } = render(<Loading />)

    const message = container.querySelector('p')
    expect(message).not.toBeInTheDocument()
  })

  it('renders message with correct styling', () => {
    const { container } = render(<Loading message="Test message" />)

    const message = container.querySelector('p')
    expect(message).toHaveClass('text-sm', 'text-muted-foreground')
  })

  it('renders page variant with correct structure', () => {
    const { container } = render(<Loading variant="page" />)

    // Check for main wrapper
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('space-y-6')

    // Check for header skeleton
    const headerSkeleton = container.querySelector('.flex.items-center.justify-between')
    expect(headerSkeleton).toBeInTheDocument()

    // Check for stats cards skeleton
    const statsGrid = container.querySelector(String.raw`.grid.gap-6.md\:grid-cols-3`)
    expect(statsGrid).toBeInTheDocument()

    // Check for search skeleton
    const searchSkeleton = container.querySelector('.h-10.w-full')
    expect(searchSkeleton).toBeInTheDocument()

    // Check for content cards skeleton
    const contentGrid = container.querySelector(
      String.raw`.grid.gap-4.md\:grid-cols-2.lg\:grid-cols-3`,
    )
    expect(contentGrid).toBeInTheDocument()
  })

  it('does not render message for page variant', () => {
    const { container } = render(<Loading variant="page" message="Test message" />)

    const message = container.querySelector('p')
    expect(message).not.toBeInTheDocument()
  })

  it('applies correct classes for page variant', () => {
    const { container } = render(<Loading variant="page" className="custom-page" />)

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('space-y-6', 'custom-page')
  })
})
