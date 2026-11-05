import { render } from '@testing-library/react'
import { LoadingState } from '@/components/backoffice/common/loading-state'

describe('LoadingState', () => {
  it('renders loading skeleton cards', () => {
    const { container } = render(<LoadingState />)

    const skeletonCards = container.querySelectorAll('.animate-pulse')
    expect(skeletonCards.length).toBeGreaterThan(0)
  })

  it('renders correct number of skeleton cards', () => {
    const { container } = render(<LoadingState />)

    const skeletonCards = container.querySelectorAll('.h-64')
    expect(skeletonCards.length).toBe(6)
  })

  it('applies correct grid layout classes', () => {
    const { container } = render(<LoadingState />)

    const grid = container.querySelector('.grid')
    expect(grid).toBeInTheDocument()
    expect(grid).toHaveClass('md:grid-cols-2', 'lg:grid-cols-3')
  })

  it('applies pulse animation to skeleton cards', () => {
    const { container } = render(<LoadingState />)

    const skeletonCards = container.querySelectorAll('.animate-pulse')
    for (const card of skeletonCards) {
      expect(card).toHaveClass('animate-pulse')
    }
  })
})

