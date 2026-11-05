import React from 'react'
import { render, screen } from '@testing-library/react'
import { Divider } from '@/app/lib/components/ui/layout/divider'

describe('Divider', () => {
  it('renders simple divider without text', () => {
    const { container } = render(<Divider />)
    const divider = container.firstChild as HTMLElement
    expect(divider).toBeInTheDocument()
    expect(divider).toHaveClass('flex', 'items-center')

    // Check for the border line
    const borderElement = divider.querySelector('.border-t')
    expect(borderElement).toBeInTheDocument()
  })

  it('renders divider with text', () => {
    const { container } = render(<Divider>Test Text</Divider>)

    // Check if text is rendered
    expect(screen.getByText('Test Text')).toBeInTheDocument()

    // Check for the border line
    const divider = container.firstChild as HTMLElement
    const borderElement = divider.querySelector('.border-t')
    expect(borderElement).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<Divider className="custom-class" />)
    const divider = container.firstChild as HTMLElement
    expect(divider).toHaveClass('custom-class', 'flex', 'items-center')
  })

  it('applies custom textClassName', () => {
    render(<Divider textClassName="custom-text-class">Test</Divider>)
    const textElement = screen.getByText('Test')
    expect(textElement).toHaveClass('custom-text-class')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<Divider ref={ref} />)

    expect(ref.current).toBeInstanceOf(HTMLDivElement)
    expect(ref.current?.tagName).toBe('DIV')
  })

  it('renders with complex children', () => {
    render(
      <Divider>
        <span>Complex</span> <strong>Content</strong>
      </Divider>,
    )

    expect(screen.getByText('Complex')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('has correct structure for text divider', () => {
    const { container } = render(<Divider>Sample Text</Divider>)

    const divider = container.firstChild as HTMLElement
    const textContainer = divider.querySelector('.relative.flex.justify-center')
    expect(textContainer).toBeInTheDocument()

    const textElement = screen.getByText('Sample Text')
    expect(textElement).toHaveClass('bg-background', 'px-2')
  })
})
