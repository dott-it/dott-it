import React from 'react'
import { render, screen } from '@testing-library/react'
import { FullScreenLoading } from '@/app/lib/components/ui/layout/loading/full-screen-loading'

describe('FullScreenLoading', () => {
  it('renders default loading state', () => {
    render(<FullScreenLoading />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders custom message', () => {
    render(<FullScreenLoading message="Authenticating..." />)

    expect(screen.getByText('Authenticating...')).toBeInTheDocument()
  })

  it('has correct CSS classes for centering', () => {
    const { container } = render(<FullScreenLoading />)
    const wrapper = container.firstChild as HTMLElement

    expect(wrapper).toHaveClass('flex', 'min-h-screen', 'items-center', 'justify-center')
  })

  it('applies custom className', () => {
    const { container } = render(<FullScreenLoading className="custom-loading" />)
    const wrapper = container.firstChild as HTMLElement

    expect(wrapper).toHaveClass('custom-loading')
  })

  it('renders spinner element', () => {
    const { container } = render(<FullScreenLoading />)
    const spinner = container.querySelector('.animate-spin')

    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass(
      'animate-spin',
      'rounded-full',
      'border-2',
      'border-muted',
      'border-t-primary',
    )
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<FullScreenLoading ref={ref} />)

    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it('has proper structure for loading screen', () => {
    const { container } = render(<FullScreenLoading />)

    // Check outer wrapper
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('flex', 'min-h-screen')

    // Check loading component wrapper
    const loadingWrapper = wrapper.querySelector('.flex.flex-col.items-center.justify-center')
    expect(loadingWrapper).toBeInTheDocument()

    // Check spinner
    const spinner = loadingWrapper?.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()

    // Check message
    const message = loadingWrapper?.querySelector('.text-sm.text-muted-foreground')
    expect(message).toBeInTheDocument()
  })
})
