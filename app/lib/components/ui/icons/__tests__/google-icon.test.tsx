import React from 'react'
import { render } from '@testing-library/react'
import { GoogleIcon } from '../google-icon'

describe('GoogleIcon', () => {
  it('renders google icon with default className', () => {
    const { container } = render(<GoogleIcon />)

    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass('size-5')
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
    expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg')
  })

  it('renders google icon with custom className', () => {
    const { container } = render(<GoogleIcon className="custom-class" />)

    const svg = container.querySelector('svg')
    expect(svg).toHaveClass('custom-class')
    expect(svg).not.toHaveClass('size-5')
  })

  it('contains all google logo path elements', () => {
    const { container } = render(<GoogleIcon />)

    const paths = container.querySelectorAll('path')
    expect(paths).toHaveLength(4)

    // Check for specific fill colors that make up the Google logo
    const fillColors = [...paths].map((path) => path.getAttribute('fill'))
    expect(fillColors).toContain('#4285F4') // Blue
    expect(fillColors).toContain('#34A853') // Green
    expect(fillColors).toContain('#FBBC05') // Yellow
    expect(fillColors).toContain('#EA4335') // Red
  })

  it('maintains accessibility attributes', () => {
    const { container } = render(<GoogleIcon />)

    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
    expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg')
  })
})
