import React from 'react'
import { render, screen } from '@testing-library/react'
import { Input } from '@/app/lib/components/ui/forms/input'

describe('Input', () => {
  it('renders with default props', () => {
    render(<Input />)
    const input = screen.getByRole('textbox')
    expect(input).toBeInTheDocument()
    expect(input).toHaveClass('flex', 'h-10', 'w-full', 'rounded-md', 'border')
  })

  it('renders with custom type', () => {
    render(<Input type="email" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('type', 'email')
  })

  it('renders with placeholder', () => {
    render(<Input placeholder="Enter your name" />)
    const input = screen.getByPlaceholderText('Enter your name')
    expect(input).toBeInTheDocument()
  })

  it('renders with value', () => {
    render(<Input value="test value" readOnly />)
    const input = screen.getByDisplayValue('test value')
    expect(input).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<Input className="custom-input" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('custom-input')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>()
    render(<Input ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('applies all HTML attributes', () => {
    render(<Input data-testid="input" aria-label="Name input" required disabled />)
    const input = screen.getByTestId('input')
    expect(input).toHaveAttribute('aria-label', 'Name input')
    expect(input).toHaveAttribute('required')
    expect(input).toHaveAttribute('disabled')
  })

  it('renders disabled input with correct styles', () => {
    render(<Input disabled />)
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
    expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50')
  })

  it('renders with different input types', () => {
    const { rerender } = render(<Input type="text" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text')

    rerender(<Input type="password" />)
    expect(screen.getByDisplayValue('')).toHaveAttribute('type', 'password')

    rerender(<Input type="number" />)
    expect(screen.getByDisplayValue('')).toHaveAttribute('type', 'number')

    rerender(<Input type="tel" />)
    expect(screen.getByDisplayValue('')).toHaveAttribute('type', 'tel')
  })

  it('renders with file type', () => {
    render(<Input type="file" />)
    const input = screen.getByDisplayValue('')
    expect(input).toHaveAttribute('type', 'file')
  })

  it('has proper focus styles', () => {
    render(<Input />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass(
      'focus-visible:outline-none',
      'focus-visible:ring-2',
      'focus-visible:ring-ring',
    )
  })

  it('has proper responsive text size', () => {
    render(<Input />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('text-base', 'md:text-sm')
  })

  it('handles controlled input', () => {
    const TestComponent = () => {
      const [value, setValue] = React.useState('')
      return (
        <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Type here" />
      )
    }

    render(<TestComponent />)
    const input = screen.getByPlaceholderText('Type here')
    expect(input).toHaveValue('')
  })
})
